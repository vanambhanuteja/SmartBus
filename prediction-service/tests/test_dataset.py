import pytest
from app.generate_dataset import generate
from app.train import validate_dataset


def test_dataset_is_labelled_synthetic(dataset):
    assert set(dataset["data_source"]) == {"SYNTHETIC"}


def test_dataset_valid(dataset):
    validate_dataset(dataset)


def test_dataset_reproducible():
    assert generate(1).equals(generate(1))


def test_validation_rejects_bad_range(dataset):
    bad = dataset.copy()
    bad.loc[0, "occupancy_percent"] = 150
    with pytest.raises(ValueError):
        validate_dataset(bad)


def test_validation_rejects_missing_column(dataset):
    with pytest.raises(ValueError):
        validate_dataset(dataset.drop(columns=["hour"]))
