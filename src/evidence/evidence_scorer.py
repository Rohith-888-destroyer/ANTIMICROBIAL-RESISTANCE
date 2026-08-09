from typing import Dict, List

class EvidenceScorer:
    """
    Transparent multi-dimensional evidence framework for AMR Signals.
    Calculates Sentinel Score (0 - 100) and Evidence Level.
    """
    def calculate_sentinel_score(
        self,
        velocity_score: float,
        novelty_score: float,
        region_count: int,
        sample_size: int,
        temporal_consistency: float = 0.8
    ) -> Dict:
        
        # 1. Trend component (max 30)
        trend_pts = min(30.0, velocity_score * 15.0)

        # 2. Novelty component (max 25)
        novelty_pts = min(25.0, (novelty_score / 100.0) * 25.0)

        # 3. Geographic expansion (max 20)
        expansion_pts = min(20.0, region_count * 4.0)

        # 4. Coverage / Sample Size quality (max 15)
        coverage_pts = min(15.0, (sample_size / 50.0) * 15.0)

        # 5. Temporal consistency (max 10)
        temporal_pts = min(10.0, temporal_consistency * 10.0)

        total_score = round(trend_pts + novelty_pts + expansion_pts + coverage_pts + temporal_pts, 1)

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
            }
        }
