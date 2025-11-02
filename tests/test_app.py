from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a deep copy of initial state and restore after test to keep tests isolated
    import copy
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_get_activities():
    client = TestClient(app)

    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # activities should be a dict and include at least Chess Club
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister():
    client = TestClient(app)

    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # Ensure not already signed up
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert f"Signed up {email}" in resp.json()["message"]

    # Now the participant should appear
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Unregister
    resp = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert resp.status_code == 200
    assert f"Unregistered {email}" in resp.json()["message"]

    # Participant should be gone
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
