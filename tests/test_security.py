from fastapi import status

def get_token(client, email="user1@example.com", password="password123"):
    payload = {"email": email, "password": password}
    client.post("/auth/signup", json=payload)
    response = client.post("/auth/login", json=payload)
    return response.json()["access_token"]

def test_unauthorized_access_to_session(client):
    token_a = get_token(client, "user_a@example.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    resp_a = client.post("/sessions/", json={
        "title": "User A Private Session",
        "source_type": "text",
        "content": "Private content"
    }, headers=headers_a)
    session_id = resp_a.json()["id"]

    token_b = get_token(client, "user_b@example.com")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    response = client.get(f"/sessions/{session_id}", headers=headers_b)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_unauthorized_delete_session(client):
    token_a = get_token(client, "user_a@example.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    resp_a = client.post("/sessions/", json={
        "title": "User A Private Session",
        "source_type": "text",
        "content": "Private content"
    }, headers=headers_a)
    session_id = resp_a.json()["id"]

    token_b = get_token(client, "user_b@example.com")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    response = client.delete(f"/sessions/{session_id}", headers=headers_b)
    assert response.status_code == status.HTTP_404_NOT_FOUND
