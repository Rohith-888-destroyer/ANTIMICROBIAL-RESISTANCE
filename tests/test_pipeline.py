import pytest
import pandas as pd
from datetime import datetime
from fastapi.testclient import TestClient

from backend.app.main import app
from src.signals.velocity_engine import ResistanceVelocityEngine
from ml.anomaly_detection.novelty_detector import GenomicNoveltyDetector
from src.evidence.evidence_scorer import EvidenceScorer

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_api_overview():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "observations_analyzed" in data
    assert "active_signals" in data

def test_resistance_velocity():
    engine = ResistanceVelocityEngine()
    df = pd.DataFrame([
        {"pathogen_name": "E. coli", "gene_symbol": "mcr-1", "country_code": "USA", "collection_date": "2025-01-01"},
        {"pathogen_name": "E. coli", "gene_symbol": "mcr-1", "country_code": "USA", "collection_date": "2025-02-01"},
        {"pathogen_name": "E. coli", "gene_symbol": "mcr-1", "country_code": "USA", "collection_date": "2025-03-01"},
        {"pathogen_name": "E. coli", "gene_symbol": "mcr-1", "country_code": "USA", "collection_date": "2025-04-01"},
    ])
    res = engine.calculate_velocity(df, "E. coli", "mcr-1")
    assert "velocity" in res
    assert "status" in res

def test_evidence_scorer():
    scorer = EvidenceScorer()
    res = scorer.calculate_sentinel_score(
        velocity_score=2.0,
        novelty_score=80.0,
        region_count=5,
        sample_size=40
    )
    assert res["sentinel_score"] > 0
    assert res["evidence_level"] in ["LOW", "MODERATE", "HIGH", "VERY HIGH"]
