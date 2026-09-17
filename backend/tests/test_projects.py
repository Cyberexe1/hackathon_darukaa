"""Tests for project creation, retrieval, and ownership authorization."""

from fastapi.testclient import TestClient

from tests.conftest import make_project_payload


def test_create_project_success(client: TestClient, auth_headers):
    response = client.post("/projects", json=make_project_payload(), headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Test Forest Project"
    assert body["site_count"] == 0
    assert body["total_area_hectares"] == 0
    assert "id" in body


def test_create_project_requires_auth(client: TestClient):
    response = client.post("/projects", json=make_project_payload())
    assert response.status_code == 401


def test_create_project_invalid_status(client: TestClient, auth_headers):
    response = client.post("/projects", json=make_project_payload(status="NotARealStatus"), headers=auth_headers)
    assert response.status_code == 422


def test_create_project_invalid_project_type(client: TestClient, auth_headers):
    response = client.post(
        "/projects", json=make_project_payload(project_type="Not A Real Type"), headers=auth_headers
    )
    assert response.status_code == 422


def test_create_project_missing_name(client: TestClient, auth_headers):
    payload = make_project_payload()
    del payload["name"]
    response = client.post("/projects", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_create_project_end_date_before_start_date(client: TestClient, auth_headers):
    response = client.post(
        "/projects",
        json=make_project_payload(start_date="2024-06-01", end_date="2024-01-01"),
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_get_projects_returns_own_projects(client: TestClient, auth_headers):
    created = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    response = client.get("/projects", headers=auth_headers)
    assert response.status_code == 200
    ids = [p["id"] for p in response.json()]
    assert created["id"] in ids


def test_get_projects_requires_auth(client: TestClient):
    response = client.get("/projects")
    assert response.status_code == 401


def test_get_project_by_id(client: TestClient, auth_headers):
    created = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    response = client.get(f"/projects/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_nonexistent_project_returns_404(client: TestClient, auth_headers):
    response = client.get("/projects/does-not-exist", headers=auth_headers)
    assert response.status_code == 404


def test_get_project_owned_by_another_user_returns_403(client: TestClient, auth_headers, make_user):
    created = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.get(f"/projects/{created['id']}", headers=other_headers)
    assert response.status_code == 403


def test_update_project_owned_by_another_user_returns_403(client: TestClient, auth_headers, make_user):
    created = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.patch(f"/projects/{created['id']}", json={"status": "Completed"}, headers=other_headers)
    assert response.status_code == 403


def test_delete_project_owned_by_another_user_returns_403(client: TestClient, auth_headers, make_user):
    created = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    other_headers, _uid, _email = make_user("Someone Else")
    response = client.delete(f"/projects/{created['id']}", headers=other_headers)
    assert response.status_code == 403


def test_update_project_success(client: TestClient, auth_headers):
    created = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    response = client.patch(f"/projects/{created['id']}", json={"status": "Completed"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "Completed"


def test_delete_project_success(client: TestClient, auth_headers):
    created = client.post("/projects", json=make_project_payload(), headers=auth_headers).json()

    response = client.delete(f"/projects/{created['id']}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get(f"/projects/{created['id']}", headers=auth_headers)
    assert response.status_code == 404
