"""Shared constants for the prediction service."""
import os

# Number of demo routes in database/seed/routes.csv (route ids 1..N)
ROUTE_IDS = list(range(1, 13))

# Crowd categories derived from occupancy percentage:
# 0-30 Low, 31-60 Moderate, 61-85 High, 86-100 Overcrowded
CATEGORY_BINS = [(30, "Low"), (60, "Moderate"), (85, "High"), (100, "Overcrowded")]

_here = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(_here, "..", "models", "model.joblib"))
DATASET_PATH = os.getenv("DATASET_PATH", os.path.join(_here, "..", "data", "occupancy_synthetic.csv"))

FEATURES = ["route_id", "hour", "day_of_week", "historical_occupancy", "recent_reports_avg"]


def categorize(occupancy_percent: float) -> str:
    """Convert occupancy % into Low / Moderate / High / Overcrowded."""
    for upper, name in CATEGORY_BINS:
        if occupancy_percent <= upper:
            return name
    return "Overcrowded"
