"""Tests for site creation, geometry validation, area calculation,
retrieval, and ownership authorization.
"""

from fastapi.testclient import TestClient

from tests.conftest import VALID_POLYGON, make_project_payload, make_site_payload


def _create_project(client: TestClient, headers: dict) -> dict:
    response = client.post("/projects", json=make_project_payload(), headers=headers)
    assert response.status_code == 201
    return response.json()


def test_create_site_with_valid_polygon(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)

    response = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["project_id"] == project["id"]
    assert body["geometry"]["type"] == "Polygon"
    assert body["area_hectares"] > 0
    assert body["perimeter_km"] > 0
    assert "lat" in body["centroid"] and "lon" in body["centroid"]


def test_create_site_computes_area_authoritatively(client: TestClient, auth_headers):
    """The known ~0.01deg x 0.01deg square at ~19N should be roughly
    111km * cos(19deg) per degree of longitude and 111km per degree of
    latitude, i.e. roughly 1.11km x 1.05km ~= 116-117 hectares. This
    confirms the backend is actually computing geodesic area via PostGIS,
    not just echoing back some placeholder or trusting a client value
    (the client never sends an area at all in this payload).
    """
    project = _create_project(client, auth_headers)
    response = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers)
    assert response.status_code == 201
    area = response.json()["area_hectares"]
    assert 100 < area < 130


def test_create_site_missing_geometry_field(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    payload = make_site_payload(project["id"])
    del payload["geometry"]
    response = client.post("/sites", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_create_site_wrong_geometry_type(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    response = client.post(
        "/sites",
        json=make_site_payload(project["id"], geometry={"type": "Point", "coordinates": [73.0, 19.0]}),
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_create_site_unclosed_polygon(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    unclosed = {
        "type": "Polygon",
        "coordinates": [[[73.0, 19.0], [73.01, 19.0], [73.01, 19.01]]],
    }
    response = client.post(
        "/sites", json=make_site_payload(project["id"], geometry=unclosed), headers=auth_headers
    )
    assert response.status_code == 422
    assert "detail" in response.json()


def test_create_site_empty_coordinates(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    empty = {"type": "Polygon", "coordinates": []}
    response = client.post(
        "/sites", json=make_site_payload(project["id"], geometry=empty), headers=auth_headers
    )
    assert response.status_code == 422


def test_create_site_self_intersecting_polygon(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    # A classic bowtie/hourglass self-intersecting ring.
    bowtie = {
        "type": "Polygon",
        "coordinates": [[
            [73.0, 19.0],
            [73.01, 19.01],
            [73.01, 19.0],
            [73.0, 19.01],
            [73.0, 19.0],
        ]],
    }
    response = client.post(
        "/sites", json=make_site_payload(project["id"], geometry=bowtie), headers=auth_headers
    )
    assert response.status_code == 422


def test_create_site_for_nonexistent_project(client: TestClient, auth_headers):
    response = client.post("/sites", json=make_site_payload("does-not-exist"), headers=auth_headers)
    assert response.status_code == 404


def test_create_site_requires_auth(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    response = client.post("/sites", json=make_site_payload(project["id"]))
    assert response.status_code == 401


def test_create_site_for_another_users_project_returns_403(client: TestClient, auth_headers, make_user):
    project = _create_project(client, auth_headers)

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.post("/sites", json=make_site_payload(project["id"]), headers=other_headers)
    assert response.status_code == 403


def test_get_sites_filtered_by_project(client: TestClient, auth_headers):
    project_a = _create_project(client, auth_headers)
    project_b = _create_project(client, auth_headers)
    client.post("/sites", json=make_site_payload(project_a["id"]), headers=auth_headers)
    client.post("/sites", json=make_site_payload(project_b["id"]), headers=auth_headers)

    response = client.get("/sites", params={"project_id": project_a["id"]}, headers=auth_headers)
    assert response.status_code == 200
    sites = response.json()
    assert len(sites) == 1
    assert sites[0]["project_id"] == project_a["id"]


def test_get_sites_requires_auth(client: TestClient):
    response = client.get("/sites")
    assert response.status_code == 401


def test_get_site_by_id(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    created = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers).json()

    response = client.get(f"/sites/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]
    assert response.json()["geometry"]["coordinates"] == VALID_POLYGON["coordinates"]


def test_get_nonexistent_site_returns_404(client: TestClient, auth_headers):
    response = client.get("/sites/does-not-exist", headers=auth_headers)
    assert response.status_code == 404


def test_get_site_owned_by_another_user_returns_403(client: TestClient, auth_headers, make_user):
    project = _create_project(client, auth_headers)
    created = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers).json()

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.get(f"/sites/{created['id']}", headers=other_headers)
    assert response.status_code == 403


def test_project_site_count_and_area_update_after_site_creation(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers)

    response = client.get(f"/projects/{project['id']}", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["site_count"] == 1
    assert body["total_area_hectares"] > 0


def test_update_site_status(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    created = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers).json()

    response = client.patch(f"/sites/{created['id']}", json={"status": "Verified"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "Verified"


def test_update_site_invalid_status(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    created = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers).json()

    response = client.patch(f"/sites/{created['id']}", json={"status": "NotAStatus"}, headers=auth_headers)
    assert response.status_code == 422


def test_delete_site_success(client: TestClient, auth_headers):
    project = _create_project(client, auth_headers)
    created = client.post("/sites", json=make_site_payload(project["id"]), headers=auth_headers).json()

    response = client.delete(f"/sites/{created['id']}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get(f"/sites/{created['id']}", headers=auth_headers)
    assert response.status_code == 404
