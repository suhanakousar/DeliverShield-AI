"""
DeliverShield AI - Fraud Detection ML Models
Mock Isolation Forest and DBSCAN implementations.
Can be replaced with real trained models.
"""

import math
import random
from typing import Optional


class IsolationForestModel:
    """
    Mock Isolation Forest for anomaly detection.

    In production, this would be a trained sklearn IsolationForest model.
    For demo, uses feature-based heuristics that simulate anomaly scoring.

    Anomaly score interpretation:
    - 0.0 - 0.3: Normal behavior
    - 0.3 - 0.5: Slightly unusual
    - 0.5 - 0.75: Suspicious
    - 0.75 - 1.0: Highly anomalous (likely fraud)
    """

    # Normal ranges for each feature (mean, std)
    FEATURE_PROFILES = {
        "claim_frequency_weekly": {"mean": 0.5, "std": 0.8},
        "disrupted_hours": {"mean": 3.0, "std": 1.5},
        "payout_ratio": {"mean": 0.3, "std": 0.2},
        "time_to_claim_seconds": {"mean": 1800, "std": 1200},
        "gps_accuracy": {"mean": 15.0, "std": 10.0},
        "device_change_count": {"mean": 0.1, "std": 0.3},
        "claim_hour_variance": {"mean": 4.0, "std": 2.0},
        "avg_payout_amount": {"mean": 200, "std": 100},
    }

    def predict_anomaly(self, features: dict) -> dict:
        """
        Calculate anomaly score for a set of features.

        Uses z-score based deviation from expected patterns.
        Higher deviation = higher anomaly score.

        Args:
            features: Dict of feature name -> value

        Returns:
            Dict with anomaly_score (0-1), is_anomaly bool, and details
        """
        z_scores = {}
        total_deviation = 0.0
        features_used = 0

        for feature_name, profile in self.FEATURE_PROFILES.items():
            if feature_name in features:
                value = features[feature_name]
                z = abs(value - profile["mean"]) / max(profile["std"], 0.01)
                z_scores[feature_name] = round(z, 3)
                total_deviation += z
                features_used += 1

        # Average z-score
        if features_used > 0:
            avg_z = total_deviation / features_used
        else:
            avg_z = 0.0

        # Convert to anomaly score (0-1)
        # Using a sigmoid-like function: score = 1 - exp(-z/3)
        anomaly_score = 1.0 - math.exp(-avg_z / 3.0)

        # Add small randomness
        noise = random.uniform(-0.03, 0.03)
        anomaly_score = max(0.0, min(1.0, anomaly_score + noise))
        anomaly_score = round(anomaly_score, 3)

        is_anomaly = anomaly_score >= 0.75

        return {
            "anomaly_score": anomaly_score,
            "is_anomaly": is_anomaly,
            "average_z_score": round(avg_z, 3),
            "feature_z_scores": z_scores,
            "features_analyzed": features_used,
            "threshold": 0.75,
            "model_type": "mock_isolation_forest",
        }


class DBSCANClusterModel:
    """
    Mock DBSCAN model for fraud ring detection.

    In production, uses sklearn DBSCAN on GPS coordinates, timing,
    and device fingerprints to identify coordinated fraud clusters.
    """

    def detect_clusters(
        self,
        data_points: list[dict],
        eps: float = 0.5,
        min_samples: int = 2,
    ) -> dict:
        """
        Detect suspicious clusters in claim data.

        Args:
            data_points: List of dicts with lat, lon, timestamp, device_id, worker_id
            eps: Maximum distance between points in a cluster (km)
            min_samples: Minimum points to form a cluster

        Returns:
            Dict with cluster information
        """
        n_points = len(data_points)

        if n_points < min_samples:
            return {
                "n_clusters": 0,
                "noise_points": n_points,
                "clusters": [],
                "fraud_rings_detected": 0,
                "model_type": "mock_dbscan",
            }

        # Simulate cluster detection
        # In production: extract features, run DBSCAN, analyze clusters
        clusters = []
        fraud_rings = 0

        # Simple heuristic: check for same device fingerprints
        device_groups = {}
        for point in data_points:
            device = point.get("device_id", "unknown")
            if device not in device_groups:
                device_groups[device] = []
            device_groups[device].append(point)

        cluster_id = 0
        for device, points in device_groups.items():
            if len(points) >= min_samples and device != "unknown":
                cluster_id += 1
                is_suspicious = len(points) >= 3 or random.random() < 0.3
                cluster_info = {
                    "cluster_id": cluster_id,
                    "size": len(points),
                    "device_id": device,
                    "worker_ids": [p.get("worker_id") for p in points],
                    "is_suspicious": is_suspicious,
                    "reason": (
                        "multiple_claims_same_device"
                        if is_suspicious
                        else "co_located_workers"
                    ),
                    "risk_score": round(random.uniform(0.5, 0.95), 2) if is_suspicious else round(random.uniform(0.1, 0.4), 2),
                }
                clusters.append(cluster_info)
                if is_suspicious:
                    fraud_rings += 1

        # Also simulate spatial clustering
        if n_points >= 5 and random.random() < 0.15:
            cluster_id += 1
            cluster_size = random.randint(2, min(4, n_points))
            clusters.append({
                "cluster_id": cluster_id,
                "size": cluster_size,
                "device_id": "various",
                "worker_ids": [data_points[i].get("worker_id") for i in range(min(cluster_size, n_points))],
                "is_suspicious": True,
                "reason": "spatiotemporal_clustering",
                "risk_score": round(random.uniform(0.6, 0.9), 2),
            })
            fraud_rings += 1

        noise_points = n_points - sum(c["size"] for c in clusters)

        return {
            "n_clusters": len(clusters),
            "noise_points": max(0, noise_points),
            "clusters": clusters,
            "fraud_rings_detected": fraud_rings,
            "total_points_analyzed": n_points,
            "parameters": {"eps": eps, "min_samples": min_samples},
            "model_type": "mock_dbscan",
        }


# Singleton instances
isolation_forest = IsolationForestModel()
dbscan_model = DBSCANClusterModel()
