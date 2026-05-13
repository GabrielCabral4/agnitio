from fastapi import status

def test_signup_success(client):
    payload = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == payload["email"]
    assert "id" in data

def test_signup_duplicate_email(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "password123"
    }
    client.post("/auth/signup", json=payload)
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Email already registered"

def test_login_success(client):
    payload = {
        "email": "login@example.com",
        "password": "password123"
    }
    client.post("/auth/signup", json=payload)
    response = client.post("/auth/login", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    payload = {
        "email": "wrong@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Invalid email or password"
