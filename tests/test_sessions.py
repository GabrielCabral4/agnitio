from unittest.mock import patch
from fastapi import status

def get_token(client):
    payload = {
        "email": "session_test@example.com",
        "password": "password123"
    }
    client.post("/auth/signup", json=payload)
    response = client.post("/auth/login", json=payload)
    return response.json()["access_token"]

def test_create_session(client):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Test Study Session",
        "source_type": "text",
        "content": "This is a test content for the session."
    }
    response = client.post("/sessions/", json=payload, headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == payload["title"]
    assert "id" in data

def test_list_sessions(client):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    for i in range(3):
        client.post("/sessions/", json={
            "title": f"Session {i}",
            "source_type": "text",
            "content": "content"
        }, headers=headers)

    response = client.get("/sessions/", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3

def test_delete_session(client):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/sessions/", json={
        "title": "To be deleted",
        "source_type": "text",
        "content": "content"
    }, headers=headers)
    session_id = resp.json()["id"]

    response = client.delete(f"/sessions/{session_id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = client.get(f"/sessions/{session_id}", headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

@patch("app.routers.sessions.process_study_material")
def test_generate_material_success(mock_ai, client):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/sessions/", json={
        "title": "AI Session",
        "source_type": "text",
        "content": "AI content"
    }, headers=headers)
    session_id = resp.json()["id"]

    response = client.post(f"/sessions/{session_id}/generate", headers=headers)
    assert response.status_code == status.HTTP_202_ACCEPTED

    mock_ai.assert_called_once()
