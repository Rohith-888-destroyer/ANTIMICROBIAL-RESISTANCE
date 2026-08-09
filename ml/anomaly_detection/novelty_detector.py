import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import Dict, List, Tuple

class GenomicNoveltyDetector:
    """
    IsolationForest anomaly detector on genomic feature matrices & k-mer embeddings.
    Identifies unusual or emerging resistance profiles.
    """
    def __init__(self, contamination: float = 0.1):
        self.model = IsolationForest(contamination=contamination, random_state=42)

    def extract_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        # One-hot encode pathogen, gene, mechanism, and region features
        features = pd.get_dummies(df[["pathogen_name", "gene_symbol", "mechanism", "country_code"]])
        return features.values, list(df["accession"].values)

    def compute_novelty_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        if len(df) < 5:
            df["novelty_score"] = 0.0
            df["novelty_classification"] = "Known pattern"
            return df

        X, accessions = self.extract_features(df)
        self.model.fit(X)
        scores = -self.model.score_samples(X)  # Higher = more atypical / novel
        
        # Normalize scores to 0 - 100 range
        min_s, max_s = scores.min(), scores.max()
        norm_scores = (scores - min_s) / (max_s - min_s + 1e-6) * 100.0

        df["novelty_score"] = np.round(norm_scores, 1)

        def classify(score):
            if score > 75:
                return "Highly unusual pattern"
            elif score > 50:
                return "Unusual pattern"
            elif score > 25:
                return "Similar pattern"
            return "Known pattern"

        df["novelty_classification"] = df["novelty_score"].apply(classify)
        return df
