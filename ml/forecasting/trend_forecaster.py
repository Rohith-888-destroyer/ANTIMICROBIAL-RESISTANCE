"""
AMR Trend Forecaster Module
===========================
Computes short-term frequency trend projections for AMR signals
using exponential smoothing / trend regression with confidence bounds.

DISCLAIMER: Forecasts represent observational surveillance signal projections.
They do NOT represent clinical infection predictions or outbreak confirmations.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional

class AMRSignalForecaster:
    """
    Provides short-term trend projection for AMR isolate observation series.
    """
    def forecast_signal_trend(
        self,
        historical_counts: List[int],
        months_ahead: int = 3
    ) -> Dict:
        if len(historical_counts) < 3:
            return {
                "status": "INSUFFICIENT_DATA",
                "message": "Insufficient historical data for reliable trend forecasting.",
                "forecast": [],
                "confidence": "Low",
                "disclaimer": "Minimum 3 observation periods required for forecast evaluation."
            }

        counts = np.array(historical_counts, dtype=float)
        x = np.arange(len(counts))
        
        # Fit linear trend line
        slope, intercept = np.polyfit(x, counts, 1)
        std_err = float(np.std(counts - (slope * x + intercept)))

        future_x = np.arange(len(counts), len(counts) + months_ahead)
        future_pred = slope * future_x + intercept
        future_pred = np.maximum(0, future_pred)  # Non-negative counts

        forecast_points = []
        for i, val in enumerate(future_pred):
            lower_bound = max(0.0, round(float(val - 1.96 * std_err), 1))
            upper_bound = round(float(val + 1.96 * std_err), 1)
            forecast_points.append({
                "period_offset": i + 1,
                "projected_count": round(float(val), 1),
                "lower_ci_95": lower_bound,
                "upper_ci_95": upper_bound
            })

        trend_direction = "INCREASING" if slope > 0.3 else ("DECREASING" if slope < -0.3 else "STABLE")
        confidence = "High" if len(counts) >= 6 and std_err < 3.0 else "Moderate"

        return {
            "status": "SUCCESS",
            "trend_direction": trend_direction,
            "slope": round(float(slope), 3),
            "confidence": confidence,
            "forecast_months": months_ahead,
            "forecast": forecast_points,
            "disclaimer": "Computational surveillance forecast based on public repository sampling. Not a clinical incidence prediction."
        }
