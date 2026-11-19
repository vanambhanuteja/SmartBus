"""Train and evaluate the occupancy model.

Split is TEMPORAL: the last 2 weeks are the test set (never seen in training).
historical_occupancy is computed from training weeks only, so no test leakage.
"""
import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import (accuracy_score, mean_absolute_error, precision_recall_fscore_support,
                             r2_score, confusion_matrix)
from .config import DATASET_PATH, MODEL_PATH, FEATURES, categorize

CATS = ["Low", "Moderate", "High", "Overcrowded"]


def validate_dataset(df: pd.DataFrame) -> None:
    required = {"route_id", "day_of_week", "hour", "occupancy_percent", "recent_reports_avg", "week", "data_source"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Dataset missing columns: {sorted(missing)}")
    if df[list(required)].isnull().any().any():
        raise ValueError("Dataset contains null values")
    if not df["occupancy_percent"].between(0, 100).all():
        raise ValueError("occupancy_percent must be within 0-100")
    if not df["day_of_week"].between(0, 6).all():
        raise ValueError("day_of_week must be 0-6")


def load_dataset(path: str = DATASET_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    validate_dataset(df)
    return df


def build_history(train: pd.DataFrame) -> pd.DataFrame:
    return (train.groupby(["route_id", "day_of_week", "hour"])["occupancy_percent"].mean()
            .rename("historical_occupancy").reset_index())


def train_model(df: pd.DataFrame, model_path: str = MODEL_PATH, seed: int = 42) -> dict:
    cut = df["week"].max() - 1
    train, test = df[df["week"] < cut].copy(), df[df["week"] >= cut].copy()
    hist = build_history(train)
    train = train.merge(hist, on=["route_id", "day_of_week", "hour"])
    test = test.merge(hist, on=["route_id", "day_of_week", "hour"], how="left")
    test["historical_occupancy"] = test["historical_occupancy"].fillna(train["occupancy_percent"].mean())

    model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=seed, n_jobs=1)
    model.fit(train[FEATURES], train["occupancy_percent"])
    pred = np.clip(model.predict(test[FEATURES]), 0, 100)

    y_true = test["occupancy_percent"].map(categorize)
    y_pred = pd.Series(pred, index=test.index).map(categorize)
    p, r, f, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
    metrics = {
        "data_source": "SYNTHETIC (simulated, not real KSRTC measurements)",
        "train_rows": int(len(train)), "test_rows": int(len(test)),
        "mae_percentage_points": round(float(mean_absolute_error(test["occupancy_percent"], pred)), 2),
        "r2": round(float(r2_score(test["occupancy_percent"], pred)), 3),
        "category_accuracy": round(float(accuracy_score(y_true, y_pred)), 3),
        "category_precision_weighted": round(float(p), 3),
        "category_recall_weighted": round(float(r), 3),
        "category_f1_weighted": round(float(f), 3),
        "confusion_matrix_labels": CATS,
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=CATS).tolist(),
    }
    comparisons = []
    for name, candidate in [
        ("Decision Tree", DecisionTreeRegressor(max_depth=12, random_state=seed)),
        ("Random Forest", model),
        ("Gradient Boosting", GradientBoostingRegressor(n_estimators=100, max_depth=3, random_state=seed)),
    ]:
        candidate.fit(train[FEATURES], train["occupancy_percent"])
        candidate_pred = np.clip(candidate.predict(test[FEATURES]), 0, 100)
        comparisons.append({"model": name, "mae_percentage_points": round(float(mean_absolute_error(test["occupancy_percent"], candidate_pred)), 2),
                            "r2": round(float(r2_score(test["occupancy_percent"], candidate_pred)), 3)})
    metrics["model_comparison"] = comparisons
    metrics["feature_importance"] = [{"feature": feature, "importance": round(float(value), 4)}
                                     for feature, value in zip(FEATURES, model.feature_importances_)]
    os.makedirs(os.path.dirname(os.path.abspath(model_path)), exist_ok=True)
    joblib.dump({"model": model, "history": hist, "features": FEATURES,
                 "global_mean": float(train["occupancy_percent"].mean()), "metrics": metrics}, model_path)
    return metrics


if __name__ == "__main__":
    m = train_model(load_dataset())
    out = os.path.join(os.path.dirname(os.path.abspath(MODEL_PATH)), "metrics.json")
    with open(out, "w") as fh:
        json.dump(m, fh, indent=2)
    print(json.dumps(m, indent=2))
