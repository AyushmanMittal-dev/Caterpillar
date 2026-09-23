"""
Automated unit and integration test for CAT Operator Simulation API.
Tests dynamic machine-specific controls for Excavators, Loaders, Graders, and Demolition.
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

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ml_engine_loaded"] is True
    print("[PASS] /api/health check passed")

def test_list_tasks():
    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 25
    print(f"[PASS] /api/tasks check passed: {len(tasks)} missions")

def test_list_machines():
    response = client.get("/api/machines")
    assert response.status_code == 200
    machines = response.json()
    assert len(machines) == 5
    for m in machines:
        assert "cab_controls" in m
        assert len(m["cab_controls"]) == 2
    print("[PASS] /api/machines check passed: All machines have 2 custom cab_controls defined")

def test_simulate_grader_blade_controls():
    # Test CAT-140 Grader with Blade Angle & Working Gear
    payload = {
        "task_id": "T004",
        "machine_id": "CAT-140",
        "power_mode": "Eco",
        "engine_rpm": 1550,
        "hydraulic_response": "Fine",
        "blade_angle": "Normal 35°",
        "working_gear": "2nd Gear",
        "assist_tech_enabled": True
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    preds = data["predictions"]
    eval_res = data["evaluation"]
    print("\n--- CAT-140 Grader Blade Test ---")
    print(f"Target: {data['task']['target_time_min']}m | Predicted: {preds['predicted_completion_time_min']}m")
    print(f"Score: {eval_res['score']}% ({eval_res['rating_tier']})")
    assert 30.0 <= preds["predicted_completion_time_min"] <= 40.0
    print("[PASS] CAT-140 Grader simulation with Blade Angle & Working Gear passed!")

def test_simulate_loader_rimpull_controls():
    # Test CAT-950M Wheel Loader with Rimpull Control
    payload = {
        "task_id": "T003",
        "machine_id": "CAT-950M",
        "power_mode": "Smart",
        "engine_rpm": 1750,
        "hydraulic_response": "Quick",
        "payload_target_pct": 90,
        "rimpull_control": "80% Gravel",
        "assist_tech_enabled": True
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    preds = data["predictions"]
    eval_res = data["evaluation"]
    print("\n--- CAT-950M Loader Rimpull Test ---")
    print(f"Target: {data['task']['target_time_min']}m | Benchmark: {data['task']['actual_benchmark_min']}m | Predicted: {preds['predicted_completion_time_min']}m")
    print(f"Score: {eval_res['score']}% ({eval_res['rating_tier']})")
    assert eval_res["score"] >= 75.0
    print("[PASS] CAT-950M Loader simulation with Rimpull passed!")

def test_simulate_demolition_attachment_controls():
    # Test CAT-349 Demolition with Tool Flow & Duty Cycle
    payload = {
        "task_id": "T005",
        "machine_id": "CAT-349",
        "power_mode": "Smart",
        "engine_rpm": 1800,
        "hydraulic_response": "Medium",
        "tool_flow_rate": "High Flow",
        "duty_cycle_pct": 85,
        "assist_tech_enabled": True
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    preds = data["predictions"]
    eval_res = data["evaluation"]
    print("\n--- CAT-349 Demolition Tool Flow Test ---")
    print(f"Target: {data['task']['target_time_min']}m | Benchmark: {data['task']['actual_benchmark_min']}m | Predicted: {preds['predicted_completion_time_min']}m")
    print(f"Stress Score: {preds['predicted_machine_stress_score']}%")
    print(f"Score: {eval_res['score']}%")
    assert preds["predicted_machine_stress_score"] < 65.0
    print("[PASS] CAT-349 Demolition tool flow test passed!")

def test_simulate_excavator_controls():
    # Test CAT-320 Excavator with Payload Target and Dig Priority
    payload = {
        "task_id": "T001",
        "machine_id": "CAT-320",
        "power_mode": "Smart",
        "engine_rpm": 1850,
        "hydraulic_response": "Quick",
        "payload_target_pct": 95,
        "dig_priority": "Balanced",
        "assist_tech_enabled": True
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    eval_res = data["evaluation"]
    print("\n--- CAT-320 Excavator Dig Priority Test ---")
    print(f"Target: {data['task']['target_time_min']}m | Benchmark: {data['task']['actual_benchmark_min']}m | Predicted: {data['predictions']['predicted_completion_time_min']}m")
    print(f"Score: {eval_res['score']}% ({eval_res['rating_tier']})")
    assert eval_res["score"] >= 80.0
    print("[PASS] CAT-320 Excavator simulation with Dig Priority passed!")

def test_simulate_backhoe_controls():
    # Test CAT-420 Backhoe with Stabilizer Stance
    payload = {
        "task_id": "T002",
        "machine_id": "CAT-420",
        "power_mode": "Eco",
        "engine_rpm": 1650,
        "hydraulic_response": "Fine",
        "payload_target_pct": 80,
        "stabilizer_stance": "Soft Ground",
        "assist_tech_enabled": True
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    eval_res = data["evaluation"]
    print("\n--- CAT-420 Backhoe Stabilizer Stance Test ---")
    print(f"Target: {data['task']['target_time_min']}m | Benchmark: {data['task']['actual_benchmark_min']}m | Predicted: {data['predictions']['predicted_completion_time_min']}m")
    print(f"Score: {eval_res['score']}% ({eval_res['rating_tier']})")
    assert eval_res["score"] >= 80.0
    print("[PASS] CAT-420 Backhoe simulation with Stabilizer Stance passed!")

if __name__ == "__main__":
    test_health()
    test_list_tasks()
    test_list_machines()
    test_simulate_excavator_controls()
    test_simulate_backhoe_controls()
    test_simulate_grader_blade_controls()
    test_simulate_loader_rimpull_controls()
    test_simulate_demolition_attachment_controls()
    print("\nALL MACHINE-SPECIFIC BACKEND TESTS PASSED SUCCESSFULLY!")
