"""Flask REST API for the prediction service."""
import os
from flask import Flask, jsonify, request
from .predictor import Predictor, InvalidInput
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import pandas as pd


def create_app(model_path=None) -> Flask:
    app = Flask(__name__)
    try:
        app.config["PREDICTOR"] = Predictor(model_path) if model_path else Predictor()
    except FileNotFoundError:
        app.config["PREDICTOR"] = None  # /health will report DOWN

    @app.get("/health")
    def health():
        ok = app.config["PREDICTOR"] is not None
        return jsonify(status="UP" if ok else "DOWN", model_loaded=ok), (200 if ok else 503)

    @app.get("/model-info")
    def info():
        p = app.config["PREDICTOR"]
        if p is None:
            return jsonify(error="model not loaded"), 503
        return jsonify(p.metrics)

    @app.post("/predict")
    def predict():
        p = app.config["PREDICTOR"]
        if p is None:
            return jsonify(error="model not loaded"), 503
        try:
            return jsonify(p.predict(request.get_json(silent=True)))
        except InvalidInput as e:
            return jsonify(error=str(e)), 400

    @app.post("/predict/gtfs")
    def predict_gtfs():
        """Train only on passenger observations supplied by the backend."""
        body = request.get_json(silent=True)
        if not isinstance(body, dict) or not isinstance(body.get("reports"), list) or len(body["reports"]) < 5:
            return jsonify(error="At least 5 real passenger reports are required"), 400
        try:
            route_id = str(body["route_id"])
            target_hour = int(str(body["travel_time"]).split(":")[0])
            target_dow = int(body["day_of_week"])
            if not 0 <= target_hour <= 23 or not 0 <= target_dow <= 6:
                raise ValueError()
            frame = pd.DataFrame(body["reports"])
            frame = frame[["route_id", "hour", "dow", "occupancy_percent"]].dropna()
            frame["route_id"] = frame["route_id"].astype(str)
            frame["occupancy_percent"] = pd.to_numeric(frame["occupancy_percent"], errors="raise")
            if len(frame) < 5 or not frame["occupancy_percent"].between(0, 100).all():
                raise ValueError()
            features = ColumnTransformer([("route", OneHotEncoder(handle_unknown="ignore"), ["route_id"]),
                                          ("time", StandardScaler(), ["hour", "dow"])])
            model = make_pipeline(features, RandomForestRegressor(n_estimators=160, min_samples_leaf=2, random_state=29, n_jobs=1))
            model.fit(frame[["route_id", "hour", "dow"]], frame["occupancy_percent"])
            estimate = round(float(model.predict(pd.DataFrame([[route_id, target_hour, target_dow]], columns=["route_id", "hour", "dow"]))[0]), 1)
            estimate = min(100.0, max(0.0, estimate))
            level = "LOW" if estimate <= 30 else "MODERATE" if estimate <= 60 else "HIGH" if estimate <= 85 else "OVERCROWDED"
            return jsonify(available=True, routeId=route_id, predictedOccupancyPercent=estimate,
                           crowdLevel=level, travelTime=f"{target_hour:02d}:00", dayOfWeek=target_dow,
                           reportsUsed=len(frame), dataSource="Passenger reports only")
        except (KeyError, TypeError, ValueError):
            return jsonify(error="Invalid route prediction request"), 400

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
