def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.get_json()["status"] == "UP"


def test_predict_ok(client):
    r = client.post("/predict", json={"route_id": 2, "travel_time": "18:00", "day_of_week": 2})
    assert r.status_code == 200
    assert {"predicted_occupancy_percent", "crowd_category", "route_id", "prediction_timestamp"} <= set(r.get_json())


def test_predict_bad_input_returns_400(client):
    r = client.post("/predict", json={"route_id": 500, "travel_time": "18:00"})
    assert r.status_code == 400 and "error" in r.get_json()


def test_predict_non_json_returns_400(client):
    assert client.post("/predict", data="hello").status_code == 400


def test_model_info_reports_synthetic(client):
    assert "SYNTHETIC" in client.get("/model-info").get_json()["data_source"]
