"""Tests for site/project/dashboard analytics aggregation."""

from fastapi.testclient import TestClient

from tests.conftest import make_project_payload, make_site_payload


def _create_project_and_site(client: TestClient, headers: dict, **project_overrides) -> tuple[str, str]:
    project = client.post("/projects", json=make_project_payload(**project_overrides), headers=headers).json()
    site = client.post("/sites", json=make_site_payload(project["id"]), headers=headers).json()
    return project["id"], site["id"]


def _add_metric(
    client: TestClient,
    site_id: str,
    headers: dict,
    recorded_at: str,
    carbon: float,
    bio: float,
    veg: float,
    tree: float,
):
    payload = {
        "recorded_at": recorded_at,
        "carbon_tco2e": carbon,
        "biodiversity_score": bio,
        "vegetation_index": veg,
        "tree_cover_percentage": tree,
    }
    response = client.post(f"/sites/{site_id}/metrics", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_site_analytics_empty_state(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)

    response = client.get(f"/sites/{site_id}/analytics", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["carbon_total"] is None
    assert body["performance"]["has_sufficient_data"] is False
    assert body["historical"] == []


def test_site_analytics_requires_auth(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    response = client.get(f"/sites/{site_id}/analytics")
    assert response.status_code == 401


def test_site_analytics_cross_user_returns_403(client: TestClient, auth_headers, make_user):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    other_headers, _uid, _email = make_user("Someone Else")
    response = client.get(f"/sites/{site_id}/analytics", headers=other_headers)
    assert response.status_code == 403


def test_site_analytics_insufficient_data_with_one_metric(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    _add_metric(client, site_id, auth_headers, "2024-01-01", 1000, 70, 0.6, 60)

    response = client.get(f"/sites/{site_id}/analytics", headers=auth_headers)
    body = response.json()
    assert body["summary"]["carbon_total"] == 1000
    assert body["performance"]["has_sufficient_data"] is False
    assert body["performance"]["carbon_change_pct"] is None


def test_site_analytics_performance_change_calculated_from_real_data(client: TestClient, auth_headers):
    _project_id, site_id = _create_project_and_site(client, auth_headers)
    _add_metric(client, site_id, auth_headers, "2022-01-01", 840, 72, 0.58, 61.2)
    _add_metric(client, site_id, auth_headers, "2026-01-01", 2840, 86, 0.78, 74.2)

    response = client.get(f"/sites/{site_id}/analytics", headers=auth_headers)
    body = response.json()
    assert body["performance"]["has_sufficient_data"] is True
    expected_carbon_pct = round(((2840 - 840) / 840) * 100, 1)
    assert body["performance"]["carbon_change_pct"] == expected_carbon_pct
    assert len(body["historical"]) == 2
    # Historical must be sorted ascending by date.
    assert body["historical"][0]["recorded_at"] == "2022-01-01"
    assert body["historical"][1]["recorded_at"] == "2026-01-01"


def test_project_analytics_empty_state_no_sites(client: TestClient, auth_headers):
    project = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    response = client.get(f"/projects/{project['id']}/analytics", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["project"]["site_count"] == 0
    assert body["summary"]["carbon_total"] is None
    assert body["historical"] == []


def test_project_analytics_aggregates_across_sites(client: TestClient, auth_headers):
    project = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()
    site_a = client.post("/sites", json=make_site_payload(project["id"], name="Site A"), headers=auth_headers).json()
    site_b = client.post("/sites", json=make_site_payload(project["id"], name="Site B"), headers=auth_headers).json()

    _add_metric(client, site_a["id"], auth_headers, "2024-01-01", 500, 60, 0.5, 50)
    _add_metric(client, site_b["id"], auth_headers, "2024-01-01", 700, 80, 0.7, 70)

    response = client.get(f"/projects/{project['id']}/analytics", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["project"]["site_count"] == 2
    assert body["summary"]["carbon_total"] == 1200
    assert body["summary"]["avg_biodiversity_score"] == 70
    assert len(body["historical"]) == 1
    assert body["historical"][0]["year"] == 2024
    assert body["historical"][0]["carbon_tco2e"] == 1200


def test_project_analytics_requires_auth(client: TestClient, auth_headers):
    project = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()
    response = client.get(f"/projects/{project['id']}/analytics")
    assert response.status_code == 401


def test_project_analytics_cross_user_returns_403(client: TestClient, auth_headers, make_user):
    project = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()
    other_headers, _uid, _email = make_user("Someone Else")
    response = client.get(f"/projects/{project['id']}/analytics", headers=other_headers)
    assert response.status_code == 403


def test_project_analytics_nonexistent_project_returns_404(client: TestClient, auth_headers):
    response = client.get("/projects/does-not-exist/analytics", headers=auth_headers)
    assert response.status_code == 404


def test_dashboard_analytics_requires_auth(client: TestClient):
    response = client.get("/analytics/dashboard")
    assert response.status_code == 401


def test_dashboard_analytics_reflects_owned_data_only(client: TestClient, auth_headers, make_user):
    project = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()
    site = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers).json()
    _add_metric(client, site["id"], auth_headers, "2024-01-01", 1000, 75, 0.6, 60)

    # A second user's data must not leak into the first user's dashboard totals.
    other_headers, _uid, _email = make_user("Someone Else")
    other_project = client.post(
        "/projects", json=make_project_payload(name="Other Project"), headers=other_headers
    ).json()
    other_site = client.post("/sites", json=make_site_payload(other_project["id"]), headers=other_headers).json()
    _add_metric(client, other_site["id"], other_headers, "2024-01-01", 99999, 10, 0.1, 10)

    response = client.get("/analytics/dashboard", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["carbon_total"] == 1000


def test_site_analytics_missing_site_returns_404(client: TestClient, auth_headers):
    response = client.get("/sites/does-not-exist/analytics", headers=auth_headers)
    assert response.status_code == 404
