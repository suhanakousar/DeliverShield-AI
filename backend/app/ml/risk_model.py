"""
DeliverShield AI - Risk Prediction Model
Mock XGBoost model for zone risk prediction.
Can be replaced with a real trained model.
"""

import random


class RiskModel:
    """
    Mock XGBoost-style risk model.

    In production, this would:
    1. Load a trained XGBoost model from a .json or .pkl file
    2. Accept feature vectors
    3. Return calibrated probability scores

    For demo, uses pre-defined weights and feature interactions.
    """

    # Feature weights (simulating a trained model's feature importances)
    FEATURE_WEIGHTS = {
        "flood_history_score": 0.22,
        "waterlogging_score": 0.18,
        "heat_index": 0.14,
        "rainfall_monthly_avg": 0.12,
        "infrastructure_quality": 0.10,
        "elevation_meters": -0.08,
        "drainage_rating": -0.06,
        "green_cover_pct": -0.04,
        "traffic_density": 0.06,
    }

    # Bias term (intercept)
    BIAS = 0.35

    def predict_risk(self, features: dict) -> dict:
        """
        Predict risk score for a zone given its features.

        Args:
            features: Dict with feature names and values (0-1 normalized)

        Returns:
            Dict with risk_score (0-100), confidence, and feature contributions
        """
        weighted_sum = self.BIAS
        contributions = {}

        for feature, weight in self.FEATURE_WEIGHTS.items():
            value = features.get(feature, 0.5)  # Default to 0.5 if missing
            contribution = value * weight
            weighted_sum += contribution
            contributions[feature] = {
                "value": round(value, 3),
                "weight": weight,
                "contribution": round(contribution, 4),
            }

        # Apply sigmoid-like transformation to get score in [0, 1]
        # Using a simple clamped linear for demo
        raw_score = max(0.0, min(1.0, weighted_sum))

        # Add small noise for realism
        noise = random.uniform(-0.02, 0.02)
        final_score = max(0.0, min(1.0, raw_score + noise))

        # Scale to 0-100
        risk_score = round(final_score * 100, 1)

        # Confidence based on how many features were provided
        features_provided = sum(1 for f in self.FEATURE_WEIGHTS if f in features)
        confidence = round(features_provided / len(self.FEATURE_WEIGHTS), 2)

        return {
            "risk_score": risk_score,
            "confidence": confidence,
            "raw_score": round(raw_score, 4),
            "feature_contributions": contributions,
            "model_type": "mock_xgboost",
            "model_version": "1.0.0-demo",
        }

    def predict_batch(self, feature_list: list[dict]) -> list[dict]:
        """Predict risk for multiple zones/inputs."""
        return [self.predict_risk(features) for features in feature_list]

    def get_feature_importance(self) -> list[dict]:
        """Return feature importances (sorted by absolute importance)."""
        importances = sorted(
            self.FEATURE_WEIGHTS.items(),
            key=lambda x: abs(x[1]),
            reverse=True,
        )
        return [
            {"feature": name, "importance": abs(weight), "direction": "risk_increase" if weight > 0 else "risk_decrease"}
            for name, weight in importances
        ]


# Singleton instance
risk_model = RiskModel()
