import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

class ResistanceVelocityEngine:
    """
    Computes Observed Resistance Signal Velocity:
    v = df / dt  (Rate of change of gene/pathogen frequency)
    a = d^2f / dt^2 (Temporal acceleration of signal)
    """
    def __init__(self, window_days: int = 60):
        self.window_days = window_days

    def calculate_velocity(self, df: pd.DataFrame, pathogen: str, gene: str, country_code: str = None) -> Dict:
        subset = df[(df["pathogen_name"] == pathogen) & (df["gene_symbol"] == gene)].copy()
        if country_code:
            subset = subset[subset["country_code"] == country_code]

        if len(subset) < 4:
            return {
                "velocity": 0.0,
                "acceleration": 0.0,
                "frequency_change_pct": 0.0,
                "status": "INSUFFICIENT_DATA",
                "sample_count": len(subset)
            }

        subset["collection_date"] = pd.to_datetime(subset["collection_date"])
        subset = subset.sort_values("collection_date")

        # Aggregate monthly frequencies
        monthly = subset.resample("ME", on="collection_date").size().reset_index(name="count")
        
        if len(monthly) < 2:
            return {
                "velocity": 0.0,
                "acceleration": 0.0,
                "frequency_change_pct": 0.0,
                "status": "STABLE",
                "sample_count": len(subset)
            }

        counts = monthly["count"].values
        diffs = np.diff(counts)
        velocity = float(np.mean(diffs)) if len(diffs) > 0 else 0.0
        
        accel = float(np.mean(np.diff(diffs))) if len(diffs) > 1 else 0.0

        first_val = max(1, counts[0])
        last_val = counts[-1]
        pct_change = float(((last_val - first_val) / first_val) * 100.0)

        status = "HIGH" if velocity > 1.5 else ("MEDIUM" if velocity > 0.5 else "LOW")

        return {
            "velocity": round(velocity, 3),
            "acceleration": round(accel, 3),
            "frequency_change_pct": round(pct_change, 1),
            "status": status,
            "sample_count": len(subset)
        }
