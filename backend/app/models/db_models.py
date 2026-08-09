from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from backend.app.config import DATABASE_URL

Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class PathogenModel(Base):
    __tablename__ = "pathogens"
    id = Column(Integer, primary_key=True, index=True)
    scientific_name = Column(String, unique=True, index=True)
    common_name = Column(String, nullable=True)
    gram_stain = Column(String, nullable=True)
    risk_level = Column(String, default="Moderate")

class RegionModel(Base):
    __tablename__ = "regions"
    id = Column(Integer, primary_key=True, index=True)
    country_code = Column(String, index=True)
    country_name = Column(String, index=True)
    region_name = Column(String, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    surveillance_coverage = Column(String, default="Moderate") # High, Moderate, Low, Very Low

class ResistanceGeneModel(Base):
    __tablename__ = "resistance_genes"
    id = Column(Integer, primary_key=True, index=True)
    gene_symbol = Column(String, index=True)
    aro_id = Column(String, nullable=True)
    mechanism = Column(String, index=True) # e.g., Carbapenemase, Efflux Pump
    antimicrobial_class = Column(String, index=True) # e.g., Carbapenems, Aminoglycosides

class ObservationModel(Base):
    __tablename__ = "observations"
    id = Column(Integer, primary_key=True, index=True)
    accession = Column(String, unique=True, index=True)
    pathogen_name = Column(String, index=True)
    gene_symbol = Column(String, index=True)
    antimicrobial_class = Column(String, index=True)
    country_code = Column(String, index=True)
    collection_date = Column(DateTime, index=True)
    source_database = Column(String, default="NCBI Pathogen Portal")
    host_target = Column(String, default="Human") # Human, Animal, Environment (One Health)
    kmer_profile_json = Column(Text, nullable=True)

class GenomicClusterModel(Base):
    __tablename__ = "genomic_clusters"
    id = Column(String, primary_key=True)
    pathogen_name = Column(String, index=True)
    primary_gene = Column(String)
    sequence_count = Column(Integer, default=0)
    countries_json = Column(Text)
    novelty_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class SignalModel(Base):
    __tablename__ = "signals"
    id = Column(String, primary_key=True)
    type = Column(String, index=True) # rapid_increase, genomic_anomaly, new_cluster, geographic_expansion
    pathogen = Column(String, index=True)
    resistance_gene = Column(String, index=True)
    region = Column(String, index=True)
    severity = Column(String) # HIGH, MEDIUM, LOW
    observed_increase_pct = Column(Float)
    resistance_velocity = Column(Float)
    sentinel_score = Column(Float)
    evidence_level = Column(String) # LOW, MODERATE, HIGH, VERY HIGH
    generated_at = Column(DateTime, default=datetime.utcnow)
    explanation_json = Column(Text)
    limitations_json = Column(Text)

def init_db():
    Base.metadata.create_all(bind=engine)
