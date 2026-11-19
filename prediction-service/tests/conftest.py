import pytest
from app.generate_dataset import generate
from app.train import train_model


@pytest.fixture(scope="session")
def dataset():
    return generate()


@pytest.fixture(scope="session")
def model_path(tmp_path_factory, dataset):
    path = str(tmp_path_factory.mktemp("model") / "model.joblib")
    train_model(dataset, model_path=path)
    return path


@pytest.fixture()
def client(model_path):
    from app.main import create_app
    return create_app(model_path).test_client()
