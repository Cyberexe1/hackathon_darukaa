"""Shared pytest fixtures.

These tests run against the real Neon Postgres/PostGIS instance
configured via DATABASE_URL (there is no separate test database
provisioned). Every fixture that creates data cleans itself up in
teardown: deleting the test user cascades (via ON DELETE CASCADE FKs) to
any projects/sites created during the test, so no test data is left
behind in the shared database.
"""

import random
import string

import pytest
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.models.user import User


def _random_suffix(n: int = 10) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def make_user(client: TestClient):
    """Factory fixture: signs up a fresh user and returns
    (auth_headers, user_id, email). Deletes the user (cascading to any
    projects/sites it owns) on teardown.
    """
    created_user_ids: list[str] = []

    def _make(name: str = "Test User") -> tuple[dict[str, str], str, str]:
        email = f"test.{_random_suffix()}@example.com"
        response = client.post(
            "/auth/signup",
            json={"name": name, "email": email, "password": "supersecret123"},
        )
        assert response.status_code == 201, response.text
        body = response.json()
        token = body["token"]
        user_id = body["user"]["id"]
        created_user_ids.append(user_id)
        return {"Authorization": f"Bearer {token}"}, user_id, email

    yield _make

    db = SessionLocal()
    try:
        for user_id in created_user_ids:
            user = db.get(User, user_id)
            if user is not None:
                db.delete(user)
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def auth_headers(make_user):
    headers, _user_id, _email = make_user()
    return headers


VALID_POLYGON = {
    "type": "Polygon",
    "coordinates": [[
        [73.0, 19.0],
        [73.01, 19.0],
        [73.01, 19.01],
        [73.0, 19.01],
        [73.0, 19.0],
    ]],
}


def make_project_payload(**overrides) -> dict:
    payload = {
        "name": "Test Forest Project",
        "description": "A project created by an automated test.",
        "project_type": "Forest Restoration",
        "status": "Active",
        "country": "India",
        "region": "Maharashtra",
        "start_date": "2024-01-01",
        "end_date": None,
    }
    payload.update(overrides)
    return payload


def make_site_payload(project_id: str, **overrides) -> dict:
    payload = {
        "project_id": project_id,
        "name": "Test Site",
        "description": "A site created by an automated test.",
        "status": "In Review",
        "geometry": VALID_POLYGON,
    }
    payload.update(overrides)
    return payload
