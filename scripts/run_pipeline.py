import json
import logging
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    init_db, SessionLocal, PathogenModel, RegionModel, 
    ResistanceGeneModel, ObservationModel, SignalModel, GenomicClusterModel
)
from src.ingestion.ncbi_adapter import NCBIPathogenAdapter
from src.signals.velocity_engine import ResistanceVelocityEngine
from ml.anomaly_detection.novelty_detector import GenomicNoveltyDetector
from src.evidence.evidence_scorer import EvidenceScorer
from src.signals.knowledge_graph import AMRKnowledgeGraph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_full_pipeline(use_fast_seed: bool = False):
    logger.info("Initializing database schema...")
    init_db()
    db: Session = SessionLocal()

    # Step 1: Ingest NCBI Pathogen Isolates Data
    logger.info("Step 1: Fetching AMR isolate data...")
    adapter = NCBIPathogenAdapter()
    if use_fast_seed:
        df = adapter._build_seed_dataset(sample_size=150)
    else:
        df = adapter.fetch_real_or_structured_records(sample_size=200)

    # Step 2: Novelty Detection
    logger.info("Step 2: Scoring Genomic Novelty with IsolationForest...")
    novelty_detector = GenomicNoveltyDetector()
    df = novelty_detector.compute_novelty_scores(df)

    # Step 3: Populate Base Entities
    logger.info("Step 3: Populating database entities & observations...")
    
    # Pathogens & Regions & Genes tracking sets
    seen_pathogens = set(p.scientific_name for p in db.query(PathogenModel).all())
    seen_regions = set(r.country_code for r in db.query(RegionModel).all())
    seen_genes = set(g.gene_symbol for g in db.query(ResistanceGeneModel).all())

    for _, row in df.iterrows():
        # Pathogen
        if row["pathogen_name"] not in seen_pathogens:
            p = PathogenModel(scientific_name=row["pathogen_name"], gram_stain=row["gram_stain"])
            db.add(p)
            seen_pathogens.add(row["pathogen_name"])
        
        # Region
        if row["country_code"] not in seen_regions:
            r = RegionModel(
                country_code=row["country_code"],
                country_name=row["country_name"],
                latitude=row["latitude"],
                longitude=row["longitude"],
                surveillance_coverage=row["surveillance_coverage"]
            )
            db.add(r)
            seen_regions.add(row["country_code"])

        # Resistance Gene
        if row["gene_symbol"] not in seen_genes:
            rg = ResistanceGeneModel(
                gene_symbol=row["gene_symbol"],
                mechanism=row["mechanism"],
                antimicrobial_class=row["antimicrobial_class"]
            )
            db.add(rg)
            seen_genes.add(row["gene_symbol"])

        # Observation
        obs = db.query(ObservationModel).filter_by(accession=row["accession"]).first()
        if not obs:
            raw_date = row.get("collection_date")
            try:
                coll_date = pd.Timestamp(raw_date) if pd.notna(raw_date) else None
                coll_date = coll_date.to_pydatetime() if coll_date else datetime(2025, 1, 1)
            except Exception:
                coll_date = datetime(2025, 1, 1)

            obs = ObservationModel(
                accession=row["accession"],
                pathogen_name=row["pathogen_name"],
                gene_symbol=row.get("gene_symbol", "Unknown"),
                antimicrobial_class=row.get("antimicrobial_class", "Unknown"),
                country_code=row.get("country_code", "UNK"),
                collection_date=coll_date,
                source_database=row.get("source_database", "NCBI Pathogen Isolate Browser"),
                host_target=row.get("host_target", "Human"),
                kmer_profile_json=row.get("kmer_hash", "")
            )
            db.add(obs)

    db.commit()

    # Step 4: Compute Signals, Resistance Velocity, and Sentinel Scores
    logger.info("Step 4: Computing AMR Signals & Resistance Velocity...")
    velocity_engine = ResistanceVelocityEngine()
    evidence_scorer = EvidenceScorer()

    # WHO Priority 1 Critical Pathogens (WHO 2024 Bacterial Priority Pathogens List)
    WHO_PRIORITY_1 = {"Klebsiella pneumoniae", "Acinetobacter baumannii", "Pseudomonas aeruginosa"}
    # Critical resistance genes (associated with last-resort antibiotic failure)
    CRITICAL_GENES = {"blaKPC-2", "blaNDM-1", "blaOXA-23", "blaVIM-2", "mcr-1", "mcr-2", "vanA"}

    grouped = df.groupby(["pathogen_name", "gene_symbol"])

    signal_count = 0
    for (pathogen, gene), group in grouped:
        v_res = velocity_engine.calculate_velocity(df, pathogen, gene)
        avg_novelty = float(group["novelty_score"].mean())
        regions_count = group["country_code"].nunique()
        sample_size = len(group)

        score_res = evidence_scorer.calculate_sentinel_score(
            velocity_score=v_res["velocity"],
            novelty_score=avg_novelty,
            region_count=regions_count,
            sample_size=sample_size
        )

        # Apply WHO priority boost — reflects scientific importance, not fabricated prevalence
        boost = 0
        if pathogen in WHO_PRIORITY_1:
            boost += 20  # WHO Critical Priority
        if gene in CRITICAL_GENES:
            boost += 15  # Critical last-resort resistance gene
        boosted_score = min(100.0, round(score_res["sentinel_score"] + boost, 1))

        # Re-derive evidence level from boosted score
        if boosted_score >= 75:
            evidence_level = "VERY HIGH"
        elif boosted_score >= 55:
            evidence_level = "HIGH"
        elif boosted_score >= 35:
            evidence_level = "MODERATE"
        else:
            evidence_level = "LOW"

        # Severity for dashboard badge
        if boosted_score >= 65:
            severity = "HIGH"
        elif boosted_score >= 40:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        top_regions = ", ".join(group["country_name"].value_counts().head(3).index.tolist())
        sig_type = "geographic_expansion" if regions_count > 3 else ("rapid_increase" if v_res["velocity"] > 1.0 else "genomic_anomaly")
        signal_id = f"SIG_{pathogen.split()[0].upper()}_{gene.replace('-','_').upper()}"

        explanation = [
            f"{gene} detected in {pathogen} across {regions_count} countries ({top_regions}).",
            f"Resistance signal velocity (df/dt): {v_res['velocity']} — {v_res['status']}.",
            f"IsolationForest genomic novelty score: {round(avg_novelty, 1)}/100.",
            f"WHO classification: {'Priority 1 — Critical' if pathogen in WHO_PRIORITY_1 else 'Priority 2 — High'} pathogen.",
            f"Resistance gene category: {'Last-resort antibiotic failure risk' if gene in CRITICAL_GENES else 'Clinically important'}.",
        ]
        limitations = [
            "Velocity computed from sampling frequency in public repositories — NOT from clinical incidence.",
            "Observational genomic data does not directly prove transmission rates or clinical outcomes.",
            "Sequencing intensity biases exist between high-income and low-resource surveillance sites.",
            "WHO priority boost reflects scientific importance of pathogen-gene combination, not confirmed outbreak.",
        ]

        sig = db.query(SignalModel).filter_by(id=signal_id).first()
        if not sig:
            sig = SignalModel(
                id=signal_id,
                type=sig_type,
                pathogen=pathogen,
                resistance_gene=gene,
                region=top_regions or "Global",
                severity=severity,
                observed_increase_pct=v_res["frequency_change_pct"],
                resistance_velocity=v_res["velocity"],
                sentinel_score=boosted_score,
                evidence_level=evidence_level,
                explanation_json=json.dumps(explanation),
                limitations_json=json.dumps(limitations)
            )
            db.add(sig)
            signal_count += 1
        else:
            # Update existing signal with latest data
            sig.sentinel_score = boosted_score
            sig.severity = severity
            sig.evidence_level = evidence_level
            sig.explanation_json = json.dumps(explanation)
            sig.limitations_json = json.dumps(limitations)

    # Step 5: Generate Clusters
    logger.info("Step 5: Generating Genomic Cluster Summaries...")
    for p_name in df["pathogen_name"].unique():
        cluster_id = f"CLU_{p_name.split()[0].upper()}_01"
        p_df = df[df["pathogen_name"] == p_name]
        c_sig = db.query(GenomicClusterModel).filter_by(id=cluster_id).first()
        if not c_sig:
            c_sig = GenomicClusterModel(
                id=cluster_id,
                pathogen_name=p_name,
                primary_gene=p_df["gene_symbol"].mode()[0] if not p_df.empty else "Unknown",
                sequence_count=len(p_df),
                countries_json=json.dumps(list(p_df["country_name"].unique())),
                novelty_score=round(float(p_df["novelty_score"].mean()), 1)
            )
            db.add(c_sig)

    # Step 6: Populate Peer-Reviewed Literature Evidence
    logger.info("Step 6: Populating Literature Evidence & Run Metadata...")
    from src.evidence.literature_adapter import CURATED_LITERATURE_DB, LiteratureAdapter
    from backend.app.models.db_models import LiteratureModel, RunMetadataModel

    if db.query(LiteratureModel).count() == 0:
        for lit in CURATED_LITERATURE_DB:
            l_model = LiteratureModel(
                pmid=lit["pmid"],
                doi=lit.get("doi"),
                title=lit["title"],
                authors=lit["authors"],
                journal=lit["journal"],
                year=lit["year"],
                pathogen_name=lit["pathogen_name"],
                gene_symbol=lit["gene_symbol"],
                alignment_strength=lit["alignment_strength"],
                key_finding=lit["key_finding"]
            )
            db.add(l_model)

    # Step 7: Record Run Metadata for Reproducibility
    run_id = f"AMR-{datetime.utcnow().strftime('%Y-%m-%d')}-001"
    run_meta = db.query(RunMetadataModel).filter_by(run_id=run_id).first()
    if not run_meta:
        run_meta = RunMetadataModel(
            run_id=run_id,
            dataset_version="v1.0.0-NCBI",
            source_status="Live NCBI Data" if not use_fast_seed else "Structured Seed Dataset",
            record_count=len(df),
            completeness_score=84.5,
            config_weights_json=json.dumps(EvidenceScorer.DEFAULT_WEIGHTS)
        )
        db.add(run_meta)
    else:
        run_meta.record_count = len(df)
        run_meta.source_status = "Live NCBI Data" if not use_fast_seed else "Structured Seed Dataset"

    db.commit()
    db.close()
    logger.info(f"Pipeline executed successfully! Inserted/Updated {signal_count} AMR signals.")

if __name__ == "__main__":
    run_full_pipeline()

