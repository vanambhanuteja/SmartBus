"""Flask REST API for the prediction service."""
import os
from flask import Flask, jsonify, request
from .predictor import Predictor, InvalidInput


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

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
