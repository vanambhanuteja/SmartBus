"""Train a reviewed candidate from passenger exports; never replace the live model here."""
import json
import os
import sys
from collections import defaultdict, deque

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

from .config import FEATURES, MODEL_PATH, categorize
from .predictor import Predictor


def candidate_from_csv(csv_path: str, output_path: str | None = None) -> dict:
    frame = pd.read_csv(csv_path)
    required = {"network", "source", "route_id", "occupancy_percent"}
    if not required.issubset(frame.columns):
        raise ValueError(f"Export is missing columns: {sorted(required - set(frame.columns))}")
    frame = frame[(frame.network == "Mysuru demo") & (frame.source == "PASSENGER")].copy()
    time_col = "observed_at" if "observed_at" in frame.columns else "reported_at"
    frame["time"] = pd.to_datetime(frame[time_col], errors="coerce", utc=True)
    frame["route_id"] = pd.to_numeric(frame.route_id, errors="coerce")
    frame["occupancy_percent"] = pd.to_numeric(frame.occupancy_percent, errors="coerce")
    frame = frame.dropna(subset=["time", "route_id", "occupancy_percent"])
    frame = frame[frame.occupancy_percent.between(0, 100)].sort_values("time").reset_index(drop=True)
    if len(frame) < 100 or (frame.time.max() - frame.time.min()).days < 28:
        raise ValueError("Need at least 100 demo passenger reports spanning 28 days before retraining")

    route_history = defaultdict(deque)
    key_history = defaultdict(list)
    global_history = []
    features = []
    labels = []
    for row in frame.itertuples(index=False):
        hour = int(row.time.hour)
        dow = int(row.time.weekday())
        route = int(row.route_id)
        prior = key_history[(route, dow, hour)]
        history = float(np.mean(prior if prior else global_history)) if prior or global_history else 0.0
        cutoff = row.time - pd.Timedelta(hours=2)
        while route_history[route] and route_history[route][0][0] < cutoff:
            route_history[route].popleft()
        recent = [value for _, value in route_history[route]]
        recent_avg = float(np.mean(recent)) if recent else history
        features.append([route, hour, dow, history, recent_avg])
        labels.append(float(row.occupancy_percent))
        key_history[(route, dow, hour)].append(float(row.occupancy_percent))
        route_history[route].append((row.time, float(row.occupancy_percent)))
        global_history.append(float(row.occupancy_percent))

    x = pd.DataFrame(features, columns=FEATURES)
    y = np.asarray(labels)
    cut = int(len(frame) * 0.8)
    if cut < 50 or len(frame) - cut < 20:
        raise ValueError("Not enough records in the chronological validation split")
    train_x, test_x, train_y, test_y = x.iloc[:cut], x.iloc[cut:], y[:cut], y[cut:]
    candidate = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=1)
    candidate.fit(train_x, train_y)
    candidate_pred = np.clip(candidate.predict(test_x), 0, 100)

    baseline = Predictor(MODEL_PATH)
    baseline_pred = []
    for values in test_x.itertuples(index=False, name=None):
        route, hour, dow, _, recent_avg = values
        baseline_pred.append(baseline.predict({"route_id": int(route), "travel_time": f"{int(hour):02d}:00",
                                                "day_of_week": int(dow), "recent_reports_avg": float(recent_avg)})["predicted_occupancy_percent"])
    baseline_mae = float(mean_absolute_error(test_y, baseline_pred))
    candidate_mae = float(mean_absolute_error(test_y, candidate_pred))
    metrics = {"data_source": "PASSENGER reports only", "training_rows": cut,
               "validation_rows": len(frame) - cut, "baseline_mae": round(baseline_mae, 2),
               "candidate_mae": round(candidate_mae, 2), "candidate_category_accuracy": round(float(np.mean([
                   categorize(a) == categorize(b) for a, b in zip(test_y, candidate_pred)])), 3),
               "candidate_feature_importance": [{"feature": k, "importance": round(float(v), 4)}
                                                for k, v in zip(FEATURES, candidate.feature_importances_)],
               "promotable": candidate_mae <= baseline_mae - 1.0,
               "note": "Chronological holdout. Candidate is not promoted automatically."}
    path = output_path or os.getenv("CANDIDATE_MODEL_PATH", "models/real-candidate.joblib")
    if metrics["promotable"]:
        final = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=1).fit(x, y)
        hist = frame.assign(hour=frame.time.dt.hour, day_of_week=frame.time.dt.weekday).groupby(
            ["route_id", "day_of_week", "hour"], as_index=False).occupancy_percent.mean().rename(
            columns={"occupancy_percent": "historical_occupancy"})
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        joblib.dump({"model": final, "history": hist, "features": FEATURES,
                     "global_mean": float(np.mean(y)), "metrics": metrics}, path)
        metrics["candidate_path"] = path
    else:
        metrics["candidate_path"] = None
    out = os.path.splitext(path)[0] + "-metrics.json"
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    return metrics


if __name__ == "__main__":
    result = candidate_from_csv(sys.argv[1])
    print(json.dumps(result, indent=2))
