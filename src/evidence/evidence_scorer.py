from typing import Dict, List, Optional

class EvidenceScorer:
    """
    Transparent multi-dimensional evidence framework for AMR Signals.
    Calculates Sentinel Score (0 - 100) and Evidence Level with configurable weights.
    """
    DEFAULT_WEIGHTS = {
        "trend": 30.0,
        "novelty": 25.0,
        "expansion": 20.0,
        "coverage": 15.0,
        "consistency": 10.0,
    }

    def calculate_sentinel_score(
        self,
        velocity_score: float,
        novelty_score: float,
        region_count: int,
        sample_size: int,
        temporal_consistency: float = 0.8,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict:
        weights = dict(self.DEFAULT_WEIGHTS)
        if custom_weights:
            weights.update(custom_weights)

        # Normalize weights to sum to 100
        w_sum = sum(weights.values()) or 100.0
        w_trend = (weights.get("trend", 30.0) / w_sum) * 100.0
        w_novelty = (weights.get("novelty", 25.0) / w_sum) * 100.0
        w_expansion = (weights.get("expansion", 20.0) / w_sum) * 100.0
        w_coverage = (weights.get("coverage", 15.0) / w_sum) * 100.0
        w_consistency = (weights.get("consistency", 10.0) / w_sum) * 100.0

        # 1. Trend component
        trend_pts = min(w_trend, (velocity_score / 2.0) * w_trend)

        # 2. Novelty component
        novelty_pts = min(w_novelty, (novelty_score / 100.0) * w_novelty)

        # 3. Geographic expansion
        expansion_pts = min(w_expansion, (region_count / 5.0) * w_expansion)

        # 4. Coverage / Sample Size quality
        coverage_pts = min(w_coverage, (sample_size / 50.0) * w_coverage)

        # 5. Temporal consistency
        temporal_pts = min(w_consistency, temporal_consistency * w_consistency)

        total_score = round(trend_pts + novelty_pts + expansion_pts + coverage_pts + temporal_pts, 1)
        total_score = min(100.0, max(0.0, total_score))

        if total_score >= 75:
            evidence_level = "VERY HIGH"
        elif total_score >= 55:
            evidence_level = "HIGH"
        elif total_score >= 35:
            evidence_level = "MODERATE"
        else:
            evidence_level = "LOW"

        return {
            "sentinel_score": total_score,
            "evidence_level": evidence_level,
            "components": {
                "trend": round(trend_pts, 1),
                "novelty": round(novelty_pts, 1),
                "expansion": round(expansion_pts, 1),
                "coverage": round(coverage_pts, 1),
                "consistency": round(temporal_pts, 1)
            },
            "weights": {
                "trend": round(w_trend, 1),
                "novelty": round(w_novelty, 1),
                "expansion": round(w_expansion, 1),
                "coverage": round(w_coverage, 1),
                "consistency": round(w_consistency, 1)
            }
        }

