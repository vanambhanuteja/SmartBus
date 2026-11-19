"""Loads the trained model and turns a request into a prediction."""
from datetime import datetime, timezone
import joblib
import pandas as pd
from .config import MODEL_PATH, ROUTE_IDS, FEATURES, categorize


class InvalidInput(ValueError):
    pass


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


class Predictor:
    def __init__(self, model_path: str = MODEL_PATH):
        bundle = joblib.load(model_path)  # FileNotFoundError if the model is missing
        self.model = bundle["model"]
        self.history = bundle["history"].set_index(["route_id", "day_of_week", "hour"])["historical_occupancy"]
        self.global_mean = bundle["global_mean"]
        self.metrics = bundle["metrics"]

    @staticmethod
    def parse_hour(value) -> int:
        """Accept 'HH:MM' or an int hour; return an hour 0-23."""
        try:
            hour = int(str(value).split(":")[0])
        except (ValueError, TypeError):
            raise InvalidInput("travel_time must look like 'HH:MM' (e.g. '08:30')")
        if not 0 <= hour <= 23:
            raise InvalidInput("travel_time hour must be between 0 and 23")
        return hour

    def predict(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            raise InvalidInput("Request body must be a JSON object")
        route_id = payload.get("route_id")
        if not _is_int(route_id) or route_id not in ROUTE_IDS:
            raise InvalidInput(f"route_id must be an integer in {ROUTE_IDS[0]}..{ROUTE_IDS[-1]}")
        hour = self.parse_hour(payload.get("travel_time"))
        dow = payload.get("day_of_week", datetime.now().weekday())
        if not _is_int(dow) or not 0 <= dow <= 6:
            raise InvalidInput("day_of_week must be an integer 0 (Mon) - 6 (Sun)")
        hist = float(self.history.get((route_id, dow, hour), self.global_mean))
        recent = payload.get("recent_reports_avg")
        if recent is None:
            recent = hist  # no recent reports -> fall back to history
        if isinstance(recent, bool) or not isinstance(recent, (int, float)) or not 0 <= recent <= 100:
            raise InvalidInput("recent_reports_avg must be a number between 0 and 100")
        row = pd.DataFrame([[route_id, hour, dow, hist, float(recent)]], columns=FEATURES)
        trees = getattr(self.model, "estimators_", [])
        samples = [float(tree.predict(row)[0]) for tree in trees] if len(trees) else [float(self.model.predict(row)[0])]
        occ = round(float(min(100.0, max(0.0, sum(samples) / len(samples)))), 1)
        confidence = [round(float(min(100.0, max(0.0, value))), 1) for value in pd.Series(samples).quantile([0.1, 0.9]).tolist()]
        return {"route_id": route_id, "predicted_occupancy_percent": occ, "crowd_category": categorize(occ),
                "confidence_range": confidence,
                "travel_time": f"{hour:02d}:00", "day_of_week": dow, "historical_occupancy": round(hist, 1),
                "prediction_timestamp": datetime.now(timezone.utc).isoformat(), "model": "RandomForestRegressor",
                "data_source": "SYNTHETIC training data"}
