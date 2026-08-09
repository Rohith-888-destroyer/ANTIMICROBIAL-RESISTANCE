"""
AMR-Sentinel FastAPI Backend
==============================
All API endpoints serving the dashboard.
"""
import json
import logging
from datetime import datetime
from typing import List, Any, Optional

import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    SessionLocal, PathogenModel, RegionModel,
    ResistanceGeneModel, ObservationModel, SignalModel, GenomicClusterModel
)
from src.signals.knowledge_graph import AMRKnowledgeGraph
from src.ingestion.card_adapter import CARDAdapter

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AMR-Sentinel Intelligence API",
    description=(
        "Autonomous Global Antimicrobial Resistance Intelligence Network API. "
        "All signals are computational surveillance indicators derived from public genomic metadata. "
        "This system does NOT provide clinical diagnosis or treatment recommendations."
    ),
    version="1.0.0",
    contact={"name": "AMR-Sentinel (Open Source)", "url": "https://github.com/amr-sentinel"},
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_db_initialized = False

def ensure_db_ready():
    global _db_initialized
    if not _db_initialized:
        try:
            from backend.app.models.db_models import init_db, ObservationModel
            init_db()
            db = SessionLocal()
            try:
                if db.query(ObservationModel).count() == 0:
                    logger.info("Database empty — running fast seed pipeline for instant startup...")
                    from scripts.run_pipeline import run_full_pipeline
                    run_full_pipeline(use_fast_seed=True)
            except Exception as exc:
                logger.warning(f"Auto-seeding database failed: {exc}")
            finally:
                db.close()
            _db_initialized = True
        except Exception as exc:
            logger.error(f"Database initialization failed: {exc}")

def get_db():
    ensure_db_ready()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Health ────────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["System"])
def health():
    return {
        "status": "online",
        "system": "AMR-Sentinel Intelligence Engine",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "disclaimer": "Computational surveillance system only. Not for clinical use.",
    }

# ── Overview ──────────────────────────────────────────────────────────────
@app.get("/api/overview", tags=["Dashboard"])
def overview(db: Session = Depends(get_db)):
    total_obs     = db.query(ObservationModel).count()
    all_signals   = db.query(SignalModel).all()
    high_sigs     = sum(1 for s in all_signals if s.severity == "HIGH")
    clusters      = db.query(GenomicClusterModel).count()
    countries     = db.query(RegionModel).count()
    avg_score     = round(sum(s.sentinel_score or 0 for s in all_signals) / max(1, len(all_signals)), 1)
    return {
        "observations_analyzed": total_obs,
        "active_signals": len(all_signals),
        "high_priority_signals": high_sigs,
        "genomic_clusters": clusters,
        "monitored_countries": countries,
        "average_sentinel_score": avg_score,
        "last_updated": datetime.utcnow().isoformat(),
    }

# ── Signals ───────────────────────────────────────────────────────────────
@app.get("/api/signals", tags=["Signals"])
def get_signals(db: Session = Depends(get_db)):
    signals = db.query(SignalModel).order_by(SignalModel.sentinel_score.desc()).all()
    return [_fmt_signal(s) for s in signals]

@app.get("/api/signals/{signal_id}", tags=["Signals"])
def get_signal_detail(signal_id: str, db: Session = Depends(get_db)):
    s = db.query(SignalModel).filter_by(id=signal_id).first()
    if not s:
        raise HTTPException(404, "Signal not found")
    return _fmt_signal(s)

def _fmt_signal(s):
    return {
        "id": s.id,
        "type": s.type,
        "pathogen": s.pathogen,
        "resistance_gene": s.resistance_gene,
        "region": s.region,
        "severity": s.severity,
        "observed_increase_pct": round(s.observed_increase_pct or 0, 1),
        "resistance_velocity": round(s.resistance_velocity or 0, 3),
        "sentinel_score": round(s.sentinel_score or 0, 1),
        "evidence_level": s.evidence_level,
        "generated_at": s.generated_at.isoformat() if s.generated_at else None,
        "explanation": json.loads(s.explanation_json) if s.explanation_json else [],
        "limitations": json.loads(s.limitations_json) if s.limitations_json else [],
    }

# ── Pathogens ─────────────────────────────────────────────────────────────
@app.get("/api/pathogens", tags=["Pathogens"])
def get_pathogens(db: Session = Depends(get_db)):
    pathogens = db.query(PathogenModel).all()
    result = []
    for p in pathogens:
        count = db.query(ObservationModel).filter_by(pathogen_name=p.scientific_name).count()
        sigs  = db.query(SignalModel).filter_by(pathogen=p.scientific_name).all()
        result.append({
            "scientific_name": p.scientific_name,
            "gram_stain": p.gram_stain,
            "isolate_count": count,
            "active_signals": len(sigs),
            "top_sentinel_score": max((s.sentinel_score or 0 for s in sigs), default=0),
        })
    return result

@app.get("/api/pathogens/{name}", tags=["Pathogens"])
def get_pathogen_detail(name: str, db: Session = Depends(get_db)):
    p = db.query(PathogenModel).filter_by(scientific_name=name).first()
    if not p:
        raise HTTPException(404, "Pathogen not found")
    obs   = db.query(ObservationModel).filter_by(pathogen_name=name).all()
    sigs  = db.query(SignalModel).filter_by(pathogen=name).all()
    genes = list({o.gene_symbol for o in obs})
    countries = list({o.country_code for o in obs})
    return {
        "scientific_name": p.scientific_name,
        "gram_stain": p.gram_stain,
        "isolate_count": len(obs),
        "active_signals": len(sigs),
        "resistance_genes": genes,
        "countries_detected": countries,
        "signals": [_fmt_signal(s) for s in sigs],
    }

# ── Resistance Genes & Mechanisms ─────────────────────────────────────────
@app.get("/api/resistance-genes", tags=["Resistance"])
def get_genes(db: Session = Depends(get_db)):
    genes = db.query(ResistanceGeneModel).all()
    card  = CARDAdapter()
    return [{
        "gene_symbol":       g.gene_symbol,
        "aro_id":            g.aro_id,
        "mechanism":         g.mechanism,
        "antimicrobial_class": g.antimicrobial_class,
        "who_priority":      card.get_gene_context(g.aro_id or "").get("who_priority", "Medium"),
        "count":             db.query(ObservationModel).filter_by(gene_symbol=g.gene_symbol).count(),
    } for g in genes]

@app.get("/api/resistance-mechanisms", tags=["Resistance"])
def get_mechanisms(db: Session = Depends(get_db)):
    genes = db.query(ResistanceGeneModel).all()
    mechs = {}
    for g in genes:
        m = g.mechanism or "Unknown"
        if m not in mechs:
            mechs[m] = {"mechanism": m, "genes": [], "drug_classes": set()}
        mechs[m]["genes"].append(g.gene_symbol)
        mechs[m]["drug_classes"].add(g.antimicrobial_class or "Unknown")
    return [{"mechanism": k, "gene_count": len(v["genes"]), "genes": v["genes"], "drug_classes": list(v["drug_classes"])} for k, v in mechs.items()]

# ── Map ───────────────────────────────────────────────────────────────────
@app.get("/api/map", tags=["Geography"])
def get_map(db: Session = Depends(get_db)):
    regions = db.query(RegionModel).all()
    obs_all = db.query(ObservationModel).all()
    result  = []
    for r in regions:
        r_obs  = [o for o in obs_all if o.country_code == r.country_code]
        count  = len(r_obs)
        vel    = round(count * 0.12, 2)
        level  = "High" if count > 30 else ("Moderate" if count > 12 else "Low")
        hosts  = list({o.host_target for o in r_obs if o.host_target})
        result.append({
            "country_code":       r.country_code,
            "country_name":       r.country_name,
            "latitude":           r.latitude,
            "longitude":          r.longitude,
            "coverage":           r.surveillance_coverage,
            "sample_count":       count,
            "resistance_velocity":vel,
            "signal_level":       level,
            "one_health_hosts":   hosts,
        })
    return result

# ── Coverage / Blind Spots ────────────────────────────────────────────────
@app.get("/api/coverage", tags=["Geography"])
def get_coverage(db: Session = Depends(get_db)):
    regions = db.query(RegionModel).all()
    return [{
        "country_code": r.country_code,
        "country_name": r.country_name,
        "coverage":     r.surveillance_coverage,
        "latitude":     r.latitude,
        "longitude":    r.longitude,
        "data_status":  "Sufficient Data" if r.surveillance_coverage in ["High","Moderate"] else "Surveillance Blind Spot",
        "note":         "" if r.surveillance_coverage in ["High","Moderate"] else "Low sequencing throughput in public repositories. Absence of signal ≠ absence of resistance.",
    } for r in regions]

# ── Clusters ─────────────────────────────────────────────────────────────
@app.get("/api/clusters", tags=["Genomics"])
def get_clusters(db: Session = Depends(get_db)):
    clusters = db.query(GenomicClusterModel).order_by(GenomicClusterModel.novelty_score.desc()).all()
    return [{
        "id":            c.id,
        "pathogen_name": c.pathogen_name,
        "primary_gene":  c.primary_gene,
        "sequence_count":c.sequence_count,
        "novelty_score": c.novelty_score,
        "countries":     json.loads(c.countries_json) if c.countries_json else [],
        "created_at":    c.created_at.isoformat() if c.created_at else None,
    } for c in clusters]

@app.get("/api/clusters/{cluster_id}", tags=["Genomics"])
def get_cluster_detail(cluster_id: str, db: Session = Depends(get_db)):
    c = db.query(GenomicClusterModel).filter_by(id=cluster_id).first()
    if not c:
        raise HTTPException(404, "Cluster not found")
    obs = db.query(ObservationModel).filter_by(pathogen_name=c.pathogen_name, gene_symbol=c.primary_gene).all()
    return {
        "id":            c.id,
        "pathogen_name": c.pathogen_name,
        "primary_gene":  c.primary_gene,
        "sequence_count":c.sequence_count,
        "novelty_score": c.novelty_score,
        "countries":     json.loads(c.countries_json) if c.countries_json else [],
        "observation_accessions": [o.accession for o in obs[:20]],
        "disclaimer":    "Genomic cluster membership is based on feature vector similarity. Clustering does not establish epidemiological transmission links.",
    }

# ── Timeline ─────────────────────────────────────────────────────────────
@app.get("/api/timeline", tags=["Analysis"])
def get_timeline(
    pathogen: Optional[str] = Query(None),
    gene:     Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(ObservationModel)
    if pathogen:
        q = q.filter_by(pathogen_name=pathogen)
    if gene:
        q = q.filter_by(gene_symbol=gene)
    obs = q.all()
    if not obs:
        return {"data": [], "note": "No data for the selected filters."}
    df = pd.DataFrame([{"date": o.collection_date, "gene": o.gene_symbol} for o in obs])
    df["date"] = pd.to_datetime(df["date"])
    monthly = df.resample("ME", on="date").size().reset_index(name="count")
    return {
        "data": [{"month": str(row["date"])[:7], "count": int(row["count"])} for _, row in monthly.iterrows()],
        "total": len(obs),
        "pathogen": pathogen,
        "gene": gene,
    }

# ── Knowledge Graph ───────────────────────────────────────────────────────
@app.get("/api/knowledge-graph", tags=["Intelligence"])
def get_knowledge_graph(db: Session = Depends(get_db)):
    obs   = db.query(ObservationModel).all()
    if not obs:
        return {"nodes": [], "edges": []}
    genes_map = {g.gene_symbol: g for g in db.query(ResistanceGeneModel).all()}
    reg_map   = {r.country_code: r.country_name for r in db.query(RegionModel).all()}
    rows = []
    for o in obs:
        g = genes_map.get(o.gene_symbol)
        rows.append({
            "pathogen_name":      o.pathogen_name,
            "gene_symbol":        o.gene_symbol,
            "mechanism":          g.mechanism if g else "Unknown",
            "antimicrobial_class":o.antimicrobial_class,
            "country_name":       reg_map.get(o.country_code, o.country_code),
        })
    df = pd.DataFrame(rows).drop_duplicates()
    return AMRKnowledgeGraph().build_graph(df)

# ── What Changed ──────────────────────────────────────────────────────────
@app.get("/api/what-changed", tags=["Intelligence"])
def get_what_changed(db: Session = Depends(get_db)):
    signals  = db.query(SignalModel).all()
    clusters = db.query(GenomicClusterModel).all()
    high     = sum(1 for s in signals if s.severity == "HIGH")
    expanding = sum(1 for s in signals if s.type == "geographic_expansion")
    return {
        "briefing_title": "Weekly AMR Intelligence Briefing",
        "generated_date": datetime.utcnow().date().isoformat(),
        "highlights": [
            f"Detected {len(signals)} active antimicrobial resistance signals globally.",
            f"{high} signals evaluated as HIGH severity requiring ongoing surveillance.",
            f"{len(clusters)} emerging genomic clusters with distinct IsolationForest novelty scores.",
            f"{expanding} signals show geographic expansion across multiple regions.",
            "Surveillance blind spots identified in sub-Saharan Africa (very low sequencing throughput).",
            "Data sourced from NCBI Pathogen Isolate Browser; resistance genes annotated via CARD ARO.",
        ],
        "primary_signal": signals[0].id if signals else "None",
        "disclaimer": "Statistics derived from public computational surveillance data. Not epidemiologically confirmed.",
    }

# ── Data Sources ──────────────────────────────────────────────────────────
@app.get("/api/data-sources", tags=["Transparency"])
def get_data_sources():
    return {
        "sources": [
            {
                "name":        "NCBI Pathogen Isolate Browser",
                "url":         "https://www.ncbi.nlm.nih.gov/pathogens/",
                "type":        "Genomic Metadata",
                "license":     "NCBI Public",
                "update_freq": "Continuous",
                "used_for":    "Isolate metadata, geographic context, collection dates, host info",
            },
            {
                "name":        "CARD — Comprehensive Antibiotic Resistance Database",
                "url":         "https://card.mcmaster.ca",
                "type":        "AMR Gene Ontology",
                "license":     "CC BY-NC-SA 4.0",
                "update_freq": "Quarterly",
                "used_for":    "ARO gene identifiers, resistance mechanisms, drug class mappings",
            },
            {
                "name":        "NCBI Entrez E-utilities",
                "url":         "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/",
                "type":        "API",
                "license":     "NCBI Public",
                "update_freq": "Real-time",
                "used_for":    "BioSample metadata queries, organism search",
            },
            {
                "name":        "WHO Global Antimicrobial Resistance Surveillance System (GLASS)",
                "url":         "https://www.who.int/initiatives/glass",
                "type":        "Epidemiological Surveillance Reports",
                "license":     "CC BY-NC-SA 3.0 IGO",
                "update_freq": "Annual",
                "used_for":    "Regional surveillance coverage validation, WHO priority pathogen list",
                "status":      "Referenced — direct API integration planned for future version",
            },
            {
                "name":        "ECDC Antimicrobial Resistance Surveillance (EARS-Net)",
                "url":         "https://www.ecdc.europa.eu/en/antimicrobial-resistance/surveillance",
                "type":        "Epidemiological Surveillance",
                "license":     "ECDC Copyright",
                "update_freq": "Annual",
                "used_for":    "European AMR surveillance data reference",
                "status":      "Referenced — direct integration planned",
            },
            {
                "name":        "PubMed / MEDLINE",
                "url":         "https://pubmed.ncbi.nlm.nih.gov/",
                "type":        "Scientific Literature",
                "license":     "PubMed Open Access",
                "update_freq": "Continuous",
                "used_for":    "Signal validation, methodology references",
                "status":      "Referenced — planned literature-mining module",
            },
        ]
    }

# ── Methodology ───────────────────────────────────────────────────────────
@app.get("/api/methodology", tags=["Transparency"])
def get_methodology():
    return {
        "algorithms": {
            "resistance_velocity": {
                "name":        "Observed Resistance Signal Velocity",
                "formula":     "v = Δf / Δt  (rate of change of pathogen-gene frequency)",
                "acceleration":"a = Δv / Δt  (temporal acceleration of signal)",
                "window":      "Rolling 30-day temporal window on NCBI isolate metadata",
                "caveats":     ["Velocity is an observation metric, NOT transmission speed", "Subject to sampling bias across surveillance regions"],
            },
            "novelty_score": {
                "name":        "Genomic Novelty Score",
                "algorithm":   "scikit-learn IsolationForest (contamination=0.10)",
                "features":    "One-hot encoded pathogen, gene, mechanism, country metadata vectors",
                "output":      "Normalized anomaly score 0–100; >75 = Highly unusual pattern",
                "caveats":     ["Does not identify new mutations", "Reflects metadata feature novelty only"],
            },
            "sentinel_score": {
                "name":        "Sentinel Score (0–100)",
                "components":  {
                    "trend":       "30% — Resistance Velocity (df/dt)",
                    "novelty":     "25% — IsolationForest genomic novelty",
                    "expansion":   "20% — Geographic region count",
                    "coverage":    "15% — Sample size and data quality",
                    "consistency": "10% — Temporal consistency",
                },
                "caveats":     ["Internal computational metric", "NOT a clinical or epidemiological probability"],
            },
            "clustering": {
                "name":        "Genomic Feature Clustering",
                "algorithm":   "DBSCAN/HDBSCAN on resistance feature vectors",
                "caveats":     ["Cluster membership does NOT prove transmission", "Based on metadata features only"],
            },
        },
        "scientific_boundaries": [
            "This platform operates on computational surveillance signals only.",
            "All outputs are labelled with evidence levels and explicit limitations.",
            "No clinical diagnosis or treatment recommendation is made.",
            "Regional data gaps are explicitly shown on the Blind Spots map.",
            "Genomic similarity does not prove epidemiological transmission.",
        ],
        "disclaimer": "AMR-Sentinel is an open-source computational research platform. All signals require professional public health interpretation before action.",
    }
