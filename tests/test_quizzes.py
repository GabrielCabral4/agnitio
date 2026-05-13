from unittest.mock import patch
from fastapi import status

def get_token(client):
    payload = {
        "email": "quiz_test@example.com",
        "password": "password123"
    }
    client.post("/auth/signup", json=payload)
    response = client.post("/auth/login", json=payload)
    return response.json()["access_token"]

def test_quiz_full_flow(client):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/sessions/", json={
        "title": "Quiz Session",
        "source_type": "text",
        "content": "The capital of France is Paris. The capital of Germany is Berlin."
    }, headers=headers)
    session_id = resp.json()["id"]

    with patch("app.routers.sessions.generate_quiz") as mock_gen:
        mock_gen.return_value = [
            {
                "question": "What is the capital of France?",
                "options": ["Paris", "London", "Berlin", "Madrid"],
                "correct_index": 0
            }
        ]
        response = client.post(f"/sessions/{session_id}/quiz", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        attempt_id = response.json()["id"]

    with patch("app.routers.sessions.analyze_answers") as mock_analyze:
        mock_analyze.return_value = {
            "score": 100.0,
            "feedback": "Perfect score!"
        }
        payload = {
            "answers": [0]
        }
        response = client.post(f"/sessions/{session_id}/quiz/{attempt_id}/submit", json=payload, headers=headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["score"] == 100.0
        assert response.json()["feedback"] == "Perfect score!"
