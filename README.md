# 🧬 AMR-Sentinel

**Autonomous Global Antimicrobial Resistance Intelligence Network**

> A production-quality computational surveillance platform that continuously analyses public genomic, microbiological, and environmental data to detect emerging antimicrobial-resistance signals before they become obvious trends.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)

---

## ⚕️ Disclaimer

AMR-Sentinel is an **open-source computational research and surveillance platform**. It operates exclusively on publicly available genomic metadata.

It does **NOT**:
- Diagnose individual patient infections
- Recommend clinical antibiotic regimens
- Confirm disease outbreaks
- Prove biological transmission pathways
- Replace official public-health agency laboratory investigation

All outputs are labelled as surveillance signals with documented evidence levels, limitations, and data provenance.

---

## 🌐 Live Data Sources

| Source | Type | License | Used For |
|--------|------|---------|----------|
| [NCBI Pathogen Isolate Browser](https://www.ncbi.nlm.nih.gov/pathogens/) | Genomic Metadata | NCBI Public | Isolate metadata, geographic context, collection dates, host info |
| [CARD — Comprehensive Antibiotic Resistance Database](https://card.mcmaster.ca) | AMR Gene Ontology | CC BY-NC-SA 4.0 | ARO gene identifiers, resistance mechanisms, drug class mappings |
| [NCBI Entrez E-utilities](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/) | REST API | NCBI Public | BioSample metadata queries (ESearch / ESummary) |
| [WHO GLASS](https://www.who.int/initiatives/glass) | Epidemiological Reports | CC BY-NC-SA 3.0 IGO | WHO priority pathogen list, regional validation |
| [ECDC EARS-Net](https://www.ecdc.europa.eu/en/antimicrobial-resistance/surveillance) | Surveillance Data | ECDC Copyright | European AMR surveillance reference |
| [PubMed / MEDLINE](https://pubmed.ncbi.nlm.nih.gov/) | Scientific Literature | PubMed Open Access | Signal validation, methodology references |

---

## 🏗️ Architecture

```
amr-sentinel/
├── backend/               # FastAPI REST API
│   └── app/
│       ├── main.py        # All API endpoints (14 routes)
│       └── models/        # SQLAlchemy ORM models (SQLite)
├── src/
│   ├── ingestion/
│   │   ├── ncbi_adapter.py   # NCBI Entrez + BioSample API integration
│   │   └── card_adapter.py   # CARD ARO gene context
│   ├── signals/
│   │   ├── velocity_engine.py    # Resistance velocity (df/dt)
│   │   └── knowledge_graph.py   # AMR multi-relational graph builder
│   └── evidence/
│       └── evidence_scorer.py   # Sentinel Score calculator
├── ml/
│   └── anomaly_detection/
│       └── novelty_detector.py  # IsolationForest genomic novelty
├── bioinformatics/
│   ├── qc/                # Quality control filters
│   ├── embeddings/        # Feature vector construction
│   └── clustering/        # DBSCAN/HDBSCAN cluster logic
├── dashboard/             # React 18 + Vite + TypeScript frontend
│   └── src/
│       ├── App.tsx        # Full dashboard (8 interactive tabs)
│       └── index.css      # Professional design system
├── scripts/
│   └── run_pipeline.py    # Full ETL pipeline runner
├── tests/                 # Pytest unit tests
├── docs/
│   └── model-card.md      # Model card with limitations
└── .github/
    └── workflows/         # CI/CD (GitHub Actions)
```

---

## 🧮 How It Works

### 1. Data Ingestion
The `NCBIPathogenAdapter` attempts live NCBI Entrez ESearch/ESummary queries for WHO Priority Pathogens. Falls back to a scientifically representative seed dataset on network failure. All records carry NCBI BioSample accession IDs.

### 2. Resistance Velocity (df/dt)
Velocity is computed as the rate of change of observed pathogen-gene frequency across rolling 30-day temporal windows:

```
v = Δf / Δt    (observed frequency change rate)
a = Δv / Δt    (signal acceleration)
```

> **Important**: Velocity is an *observational* metric derived from sequencing throughput — NOT from clinical incidence or transmission rates.

### 3. Genomic Novelty Score
Computed via **scikit-learn IsolationForest** (contamination=0.10) on one-hot encoded metadata feature matrices:
- Pathogen identity
- Resistance gene
- Resistance mechanism
- Country of isolation

Scores normalized to 0–100. Scores >75 indicate statistically atypical feature combinations.

### 4. Sentinel Score (0–100)
Multi-dimensional composite surveillance score:

| Component | Weight | Source |
|-----------|--------|--------|
| Resistance Velocity Trend | 30% | df/dt calculation |
| Genomic Novelty | 25% | IsolationForest |
| Geographic Expansion | 20% | Country count |
| Data Coverage Quality | 15% | Sample size |
| Temporal Consistency | 10% | Rolling window stability |

**WHO Priority Boost**: WHO Priority 1 pathogens (+20 pts) and critical last-resort genes (+15 pts) receive scientifically-justified score boosts. This reflects clinical significance — **not fabricated prevalence data**.

### 5. AMR Knowledge Graph
Multi-relational graph linking:
`Pathogen → Gene → Mechanism → Drug Class → Region`
with 58+ nodes and 215+ edges from real observation data.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Installation

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the data pipeline (fetches live NCBI data)
python -m scripts.run_pipeline

# 3. Start the FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001

# 4. In a new terminal — start the React dashboard
cd dashboard
cmd /c npm run dev
```

Dashboard opens at **http://localhost:5173**
API docs at **http://localhost:8001/docs** (Swagger UI)

### Environment Variables (optional)

```env
NCBI_API_KEY=your_ncbi_api_key   # Increases rate limit from 3 to 10 req/s
```

Get a free NCBI API key at: https://www.ncbi.nlm.nih.gov/account/

---

## 📊 Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **Home** | Overview metrics, top signals, Sentinel Score breakdown, evidence framework |
| **AMR Weather Map** | Global SVG map — signal velocity fronts, animated hotspots, hover tooltips |
| **AMR Radar** | Ranked emerging signals with XAI explanations and scientific limitations |
| **Genomic Explorer** | IsolationForest cluster analysis — novelty scores, country spread |
| **Knowledge Graph** | Interactive multi-relational AMR graph (Pathogen → Gene → Drug Class → Region) |
| **Blind Spots** | Coverage quality map — explicit surveillance gap visualization |
| **Methodology** | Full algorithm documentation, formulae, scientific boundaries |
| **Data Sources** | Complete provenance — source name, URL, license, update frequency |

---

## 🧪 Running Tests

```bash
pytest tests/ -v
```

---

## 📋 API Reference

The full Swagger UI is available at `http://localhost:8001/docs` when the backend is running.

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | System health check |
| `GET /api/overview` | Dashboard KPI summary |
| `GET /api/signals` | All AMR signals, ranked by Sentinel Score |
| `GET /api/signals/{id}` | Single signal detail |
| `GET /api/pathogens` | All monitored pathogens |
| `GET /api/pathogens/{name}` | Pathogen detail + signals |
| `GET /api/resistance-genes` | All detected resistance genes with CARD context |
| `GET /api/resistance-mechanisms` | Grouped by mechanism class |
| `GET /api/map` | Geographic data for weather map |
| `GET /api/coverage` | Surveillance coverage quality (blind spots) |
| `GET /api/clusters` | Genomic cluster summaries |
| `GET /api/clusters/{id}` | Cluster detail |
| `GET /api/knowledge-graph` | Graph nodes and edges |
| `GET /api/timeline` | Temporal observation trend |
| `GET /api/what-changed` | Weekly intelligence briefing |
| `GET /api/data-sources` | Data provenance registry |
| `GET /api/methodology` | Full algorithm documentation |

---

## 🤝 Contributing

This is an open-source research project. Contributions welcome:
- Additional genomic data source adapters (PATRIC, EUCAST, WHONET)
- WHO GLASS direct API integration
- Phylogenetic clustering modules
- Natural language report generation

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

CARD data used under CC BY-NC-SA 4.0 (non-commercial research use only).
NCBI data used under NCBI data usage policies.
