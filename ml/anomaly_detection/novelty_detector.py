import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

try:
    from sklearn.ensemble import IsolationForest
    _HAS_SKLEARN = True
except ImportError:
    _HAS_SKLEARN = False

class GenomicNoveltyDetector:
    """
    IsolationForest / Distance anomaly detector on genomic feature matrices & k-mer embeddings.
    Identifies unusual or emerging resistance profiles.
    """
    def __init__(self, contamination: float = 0.1):
        if _HAS_SKLEARN:
            self.model = IsolationForest(contamination=contamination, random_state=42)
        else:
            self.model = None

    def extract_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        # One-hot encode pathogen, gene, mechanism, and region features
        features = pd.get_dummies(df[["pathogen_name", "gene_symbol", "mechanism", "country_code"]])
        return features.values.astype(np.float64), list(df["accession"].values)

    def compute_novelty_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        if len(df) < 5:
            df["novelty_score"] = 0.0
            df["novelty_classification"] = "Known pattern"
            return df

        X, accessions = self.extract_features(df)
        
        if self.model is not None:
            self.model.fit(X)
            scores = -self.model.score_samples(X)  # Higher = more atypical / novel
        else:
            # Lightweight distance-to-mean novelty score using numpy (zero-dependency fallback)
            mean_vec = np.mean(X, axis=0)
            scores = np.linalg.norm(X - mean_vec, axis=1)

        # Normalize scores to 0 - 100 range
        min_s, max_s = scores.min(), scores.max()
        if max_s > min_s:
            norm_scores = (scores - min_s) / (max_s - min_s) * 100.0
        else:
            norm_scores = np.zeros_like(scores)

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

