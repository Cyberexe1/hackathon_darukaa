"""Tests for site metric CRUD, validation, and authorization."""

from fastapi.testclient import TestClient

from tests.conftest import make_project_payload, make_site_payload


def _create_project_and_site(client: TestClient, headers: dict) -> tuple[str, str]:
    project = client.post("/projects", json=make_project_payload(), headers=headers).json()
    site = client.post("/sites", json=make_site_payload(project["id"]), headers=headers).json()
    return project["id"], site["id"]


def _metric_payload(**overrides) -> dict:
    payload = {
        "recorded_at": "2024-01-01",
        "carbon_tco2e": 1200,
        "biodiversity_score": 78,
        "vegetation_index": 0.65,
        "tree_cover_percentage": 64.5,
    }
    payload.update(overrides)
    return payload


def test_create_metric_success(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)

    response = client.post(f"/sites/{site_id}/metrics", json=_metric_payload(), headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["site_id"] == site_id
    assert body["carbon_tco2e"] == 1200
    assert body["biodiversity_score"] == 78


def test_create_metric_requires_auth(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.post(f"/sites/{site_id}/metrics", json=_metric_payload())
    assert response.status_code == 401


def test_create_metric_negative_carbon_rejected(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.post(f"/sites/{site_id}/metrics", json=_metric_payload(carbon_tco2e=-1), headers=auth_headers)
    assert response.status_code == 422


def test_create_metric_biodiversity_out_of_range(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.post(
        f"/sites/{site_id}/metrics", json=_metric_payload(biodiversity_score=101), headers=auth_headers
    )
    assert response.status_code == 422

    response = client.post(
        f"/sites/{site_id}/metrics", json=_metric_payload(biodiversity_score=-1), headers=auth_headers
    )
    assert response.status_code == 422


def test_create_metric_vegetation_out_of_range(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.post(
        f"/sites/{site_id}/metrics", json=_metric_payload(vegetation_index=1.5), headers=auth_headers
    )
    assert response.status_code == 422


def test_create_metric_tree_cover_out_of_range(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.post(
        f"/sites/{site_id}/metrics", json=_metric_payload(tree_cover_percentage=150), headers=auth_headers
    )
    assert response.status_code == 422


def test_create_metric_invalid_date(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.post(
        f"/sites/{site_id}/metrics", json=_metric_payload(recorded_at="not-a-date"), headers=auth_headers
    )
    assert response.status_code == 422


def test_create_metric_for_nonexistent_site(client: TestClient, auth_headers):
    response = client.post("/sites/does-not-exist/metrics", json=_metric_payload(), headers=auth_headers)
    assert response.status_code == 404


def test_create_metric_for_another_users_site_returns_403(client: TestClient, auth_headers, make_user):
    _project_id, site_id = _create_project_and_site(client, auth_headers)

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.post(f"/sites/{site_id}/metrics", json=_metric_payload(), headers=other_headers)
    assert response.status_code == 403


def test_list_metrics_ordered_ascending(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    client.post(f"/sites/{site_id}/metrics", json=_metric_payload(recorded_at="2025-01-01"), headers=auth_headers)
    client.post(f"/sites/{site_id}/metrics", json=_metric_payload(recorded_at="2022-01-01"), headers=auth_headers)
    client.post(f"/sites/{site_id}/metrics", json=_metric_payload(recorded_at="2023-01-01"), headers=auth_headers)

    response = client.get(f"/sites/{site_id}/metrics", headers=auth_headers)
    assert response.status_code == 200
    dates = [m["recorded_at"] for m in response.json()]
    assert dates == sorted(dates)


def test_list_metrics_requires_auth(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.get(f"/sites/{site_id}/metrics")
    assert response.status_code == 401


def test_list_metrics_for_another_users_site_returns_403(client: TestClient, auth_headers, make_user):
    _project_id, site_id = _create_project_and_site(client, auth_headers)

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.get(f"/sites/{site_id}/metrics", headers=other_headers)
    assert response.status_code == 403


def test_update_metric_success(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    created = client.post(f"/sites/{site_id}/metrics", json=_metric_payload(), headers=auth_headers).json()

    response = client.patch(
        f"/sites/{site_id}/metrics/{created['id']}", json={"carbon_tco2e": 1500}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["carbon_tco2e"] == 1500


def test_update_metric_invalid_value_rejected(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    created = client.post(f"/sites/{site_id}/metrics", json=_metric_payload(), headers=auth_headers).json()

    response = client.patch(
        f"/sites/{site_id}/metrics/{created['id']}", json={"biodiversity_score": 200}, headers=auth_headers
    )
    assert response.status_code == 422


def test_update_nonexistent_metric_returns_404(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.patch(
        f"/sites/{site_id}/metrics/does-not-exist", json={"carbon_tco2e": 1500}, headers=auth_headers
    )
    assert response.status_code == 404


def test_delete_metric_success(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    created = client.post(f"/sites/{site_id}/metrics", json=_metric_payload(), headers=auth_headers).json()

    response = client.delete(f"/sites/{site_id}/metrics/{created['id']}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get(f"/sites/{site_id}/metrics", headers=auth_headers)
    assert response.json() == []


def test_delete_metric_for_another_users_site_returns_403(client: TestClient, auth_headers, make_user):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    created = client.post(f"/sites/{site_id}/metrics", json=_metric_payload(), headers=auth_headers).json()

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.delete(f"/sites/{site_id}/metrics/{created['id']}", headers=other_headers)
    assert response.status_code == 403
