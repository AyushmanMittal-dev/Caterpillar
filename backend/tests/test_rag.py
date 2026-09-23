"""
Automated Integration and Guardrail Tests for Caterpillar Operator RAG Chatbot.
Verifies FAISS indexing, grounded technical queries, and strict refusal on out-of-domain prompts.
"""

import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
ROOT_DIR = os.path.dirname(PARENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_chat_status():
    response = client.get("/api/chat/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "total_chunks" in data
    assert data["total_chunks"] > 0
    assert data["index_initialized"] is True
    print(f"[PASS] /api/chat/status check passed (FAISS indexed chunks: {data['total_chunks']}, Ollama: {data['ollama_online']})")

def test_grounded_machine_query_grader():
    # Query regarding CAT-140 Motor Grader blade angle and washboarding
    payload = {
        "message": "What moldboard blade angle should I set on the CAT 140 for highway finish grading, and how do I prevent washboarding ripples?",
        "machine_id": "CAT-140",
        "task_id": "T004"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["retrieved"] is True
    assert data["is_grounded"] is True
    assert data["similarity_score"] >= 0.58
    assert len(data["sources"]) > 0
    # Must cite CAT 140 manual
    assert any("140" in s["doc_title"] or s["machine_id"] == "CAT-140" for s in data["sources"])
    print(f"\n[PASS] CAT-140 Grounded Query: Similarity Score = {data['similarity_score']}, Sources = {len(data['sources'])}")
    print(f"Sample response snippet: {data['reply'][:140]}...")

def test_grounded_machine_query_loader_rimpull():
    # Query regarding CAT-950M Wheel Loader rimpull anti-slip in wet mud
    payload = {
        "message": "Why should I avoid 100% Rimpull on the CAT 950M in wet mud, and what setting prevents tire spin?",
        "machine_id": "CAT-950M",
        "task_id": "T003"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["retrieved"] is True
    assert data["is_grounded"] is True
    assert data["similarity_score"] >= 0.58
    assert any("950" in s["doc_title"] or s["machine_id"] == "CAT-950M" for s in data["sources"])
    print(f"\n[PASS] CAT-950M Grounded Query: Similarity Score = {data['similarity_score']}, Sources = {len(data['sources'])}")

def test_guardrail_rejection_out_of_domain():
    # Irrelevant / Out-of-Domain query that must trigger the anti-hallucination guardrail
    payload = {
        "message": "Can you give me a recipe for baking chocolate fudge cookies with vanilla icing?",
        "machine_id": "CAT-320"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_grounded"] is False
    assert data["retrieved"] is False
    assert data["similarity_score"] < 0.58
    assert "Caterpillar Operator Assistant" in data["reply"]
    assert "No relevant documentation was found" in data["reply"]
    print(f"\n[PASS] Guardrail Out-Of-Domain Rejection verified: Similarity Score = {data['similarity_score']} (below cutoff 0.58)")
    print(f"Refusal Message: {data['reply'][:100]}...")

if __name__ == "__main__":
    test_chat_status()
    test_grounded_machine_query_grader()
    test_grounded_machine_query_loader_rimpull()
    test_guardrail_rejection_out_of_domain()
    print("\nALL RAG CHATBOT AND GUARDRAIL TESTS PASSED SUCCESSFULLY!")
