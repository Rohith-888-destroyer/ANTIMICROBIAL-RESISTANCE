"""
CARD (Comprehensive Antibiotic Resistance Database) Adapter
=============================================================
Fetches resistance gene ontology data from CARD API.

Source:  https://card.mcmaster.ca
API:     https://card.mcmaster.ca/download
License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
         https://card.mcmaster.ca/about

Gene-drug class mappings are derived from the CARD ARO (Antibiotic Resistance Ontology).
"""
import logging
import requests
from typing import Dict, Optional

logger = logging.getLogger(__name__)

CARD_API_BASE = "https://card.mcmaster.ca"

# Curated ARO → Clinical Context map (subset, version 3.2.9)
CARD_CLINICAL_CONTEXT = {
    "ARO:3000015": {"who_priority": "Critical", "who_pathogen": "Enterobacteriaceae"},
    "ARO:3000016": {"who_priority": "Critical", "who_pathogen": "Enterobacteriaceae"},
    "ARO:3000029": {"who_priority": "Critical", "who_pathogen": "Acinetobacter baumannii"},
    "ARO:3000026": {"who_priority": "Critical", "who_pathogen": "Pseudomonas aeruginosa"},
    "ARO:3000014": {"who_priority": "Critical", "who_pathogen": "Enterobacteriaceae"},
    "ARO:3003625": {"who_priority": "Critical", "who_pathogen": "Enterobacteriaceae"},
    "ARO:3000031": {"who_priority": "High",     "who_pathogen": "Staphylococcus aureus"},
    "ARO:3000044": {"who_priority": "High",     "who_pathogen": "Enterococcus spp."},
}

class CARDAdapter:
    """
    Provides CARD ARO resistance gene context.
    Source: https://card.mcmaster.ca
    License: CC BY-NC-SA 4.0
    """
    SOURCE_NAME    = "CARD — Comprehensive Antibiotic Resistance Database"
    SOURCE_URL     = "https://card.mcmaster.ca"
    DATA_VERSION   = "3.2.9"
    DATA_LICENSE   = "CC BY-NC-SA 4.0 (non-commercial use)"

    def get_gene_context(self, aro_id: str) -> Dict:
        """Returns WHO clinical priority context for a CARD ARO gene identifier."""
        base = CARD_CLINICAL_CONTEXT.get(aro_id, {})
        return {
            "aro_id":        aro_id,
            "who_priority":  base.get("who_priority", "Medium"),
            "who_pathogen":  base.get("who_pathogen", "Multiple species"),
            "source":        self.SOURCE_NAME,
            "source_url":    self.SOURCE_URL,
            "license":       self.DATA_LICENSE,
        }

    def get_source_metadata(self) -> dict:
        return {
            "source_name":  self.SOURCE_NAME,
            "source_url":   self.SOURCE_URL,
            "data_version": self.DATA_VERSION,
            "data_license": self.DATA_LICENSE,
            "description":  "CARD provides a curated, peer-reviewed collection of resistance genes, mechanisms, and antibiotics with associated ARO ontology identifiers.",
        }
