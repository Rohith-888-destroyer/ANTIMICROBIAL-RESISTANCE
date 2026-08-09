import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_RAW_DIR = DATA_DIR / "raw"
DATA_PROCESSED_DIR = DATA_DIR / "processed"
DATA_CACHE_DIR = DATA_DIR / "cache"

for d in [DATA_DIR, DATA_RAW_DIR, DATA_PROCESSED_DIR, DATA_CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "amr_sentinel.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

NCBI_ISOLATE_BROWSER_URL = "https://ftp.ncbi.nlm.nih.gov/pathogen/Results/"
CARD_ARO_INDEX_URL = "https://card.mcmaster.ca/latest/data"

MONITORED_PATHOGENS = [
    "Klebsiella pneumoniae",
    "Escherichia coli",
    "Staphylococcus aureus",
    "Acinetobacter baumannii",
    "Pseudomonas aeruginosa",
    "Salmonella enterica",
]

DEFAULT_VELOCITY_WINDOW_DAYS = 30
MIN_SAMPLE_THRESHOLD = 5
