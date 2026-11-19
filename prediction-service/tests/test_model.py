import pytest
from app.predictor import Predictor, InvalidInput
from app.config import categorize


def test_model_loads(model_path):
    assert Predictor(model_path).model is not None


def test_missing_model_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        Predictor(str(tmp_path / "nope.joblib"))


def test_categories():
    assert [categorize(x) for x in (0, 30, 31, 60, 61, 85, 86, 100)] == \
        ["Low", "Low", "Moderate", "Moderate", "High", "High", "Overcrowded", "Overcrowded"]


def test_prediction_output(model_path):
    out = Predictor(model_path).predict({"route_id": 3, "travel_time": "08:30", "day_of_week": 1})
    assert 0 <= out["predicted_occupancy_percent"] <= 100
    assert out["crowd_category"] in {"Low", "Moderate", "High", "Overcrowded"}
    assert out["route_id"] == 3 and out["prediction_timestamp"]


def test_rush_hour_busier_than_weekend_midday(model_path):
    p = Predictor(model_path)
    rush = p.predict({"route_id": 1, "travel_time": "09:00", "day_of_week": 1})
    quiet = p.predict({"route_id": 1, "travel_time": "14:00", "day_of_week": 6})
    assert rush["predicted_occupancy_percent"] > quiet["predicted_occupancy_percent"]


@pytest.mark.parametrize("payload", [
    None, [], {}, {"route_id": 99, "travel_time": "08:00"}, {"route_id": "x", "travel_time": "08:00"},
    {"route_id": 1}, {"route_id": 1, "travel_time": "25:00"}, {"route_id": 1, "travel_time": "abc"},
    {"route_id": 1, "travel_time": "08:00", "day_of_week": 9},
    {"route_id": 1, "travel_time": "08:00", "recent_reports_avg": 150},
    {"route_id": True, "travel_time": "08:00"},
])
def test_invalid_input(model_path, payload):
    with pytest.raises(InvalidInput):
        Predictor(model_path).predict(payload)
