"""
API Routes for CAT Simulator: Tasks, Machines, Simulation Runs, and Optimal Benchmarks.
Supports machine-specific controls for Excavators, Backhoes, Wheel Loaders, Motor Graders, and Demolition machines.
"""

import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.ml_engine import ml_engine
from backend.services.evaluator import SimulationEvaluator

router = APIRouter(prefix="/api", tags=["simulation"])

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")

def get_tasks_data():
    path = os.path.join(DATA_DIR, "tasks_catalog.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_machines_data():
    path = os.path.join(DATA_DIR, "cat_machines.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

class SimulationRequest(BaseModel):
    task_id: str = Field(..., example="T001")
    machine_id: str = Field(..., example="CAT-320")
    power_mode: str = Field(..., example="Smart")
    engine_rpm: int = Field(..., ge=1000, le=2400, example=1850)
    hydraulic_response: str = Field(..., example="Quick")
    assist_tech_enabled: bool = Field(default=True, example=True)
    
    # Machine-Specific Dynamic Parameters
    payload_target_pct: Optional[float] = Field(default=None, ge=40.0, le=120.0)
    dig_priority: Optional[str] = Field(default=None)
    stabilizer_stance: Optional[str] = Field(default=None)
    rimpull_control: Optional[str] = Field(default=None)
    blade_angle: Optional[str] = Field(default=None)
    working_gear: Optional[str] = Field(default=None)
    tool_flow_rate: Optional[str] = Field(default=None)
    duty_cycle_pct: Optional[float] = Field(default=None, ge=50.0, le=100.0)

@router.get("/tasks")
def list_tasks():
    """Retrieve all available simulation tasks with problem statements and benchmarks."""
    return get_tasks_data()

@router.get("/tasks/{task_id}")
def get_task(task_id: str):
    tasks = get_tasks_data()
    for t in tasks:
        if t["task_id"] == task_id:
            return t
    raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

@router.get("/machines")
def list_machines():
    """Retrieve all Caterpillar machine profiles with technical bounds and specs."""
    return get_machines_data()

@router.get("/machines/{machine_id}")
def get_machine(machine_id: str):
    machines = get_machines_data()
    for m in machines:
        if m["machine_id"] == machine_id:
            return m
    raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

@router.post("/simulate")
def run_simulation(req: SimulationRequest):
    """
    Executes a step-by-step simulation run:
    1. Preprocesses task context and machine parameters
    2. Runs ML inference with machine-specific controls
    3. Evaluates operator score and generates CAT coaching
    """
    tasks = {t["task_id"]: t for t in get_tasks_data()}
    machines = {m["machine_id"]: m for m in get_machines_data()}
    
    if req.task_id not in tasks:
        raise HTTPException(status_code=404, detail=f"Task {req.task_id} not found")
    if req.machine_id not in machines:
        raise HTTPException(status_code=404, detail=f"Machine {req.machine_id} not found")
        
    task = tasks[req.task_id]
    machine = machines[req.machine_id]
    
    cab_controls = machine.get("cab_controls", [])
    cab_defaults = {ctrl["id"]: ctrl.get("default") for ctrl in cab_controls}
    
    # Resolve machine-specific controls based on machine capabilities
    payload_target_pct = (
        req.payload_target_pct if req.payload_target_pct is not None
        else (cab_defaults["payload_target_pct"] if "payload_target_pct" in cab_defaults else 90.0)
    )
    duty_cycle_pct = (
        req.duty_cycle_pct if req.duty_cycle_pct is not None
        else (cab_defaults["duty_cycle_pct"] if "duty_cycle_pct" in cab_defaults else 85.0)
    )
    dig_priority = (
        req.dig_priority if req.dig_priority is not None
        else cab_defaults.get("dig_priority", "None")
    ) if "dig_priority" in cab_defaults else "None"
    
    stabilizer_stance = (
        req.stabilizer_stance if req.stabilizer_stance is not None
        else cab_defaults.get("stabilizer_stance", "None")
    ) if "stabilizer_stance" in cab_defaults else "None"
    
    rimpull_control = (
        req.rimpull_control if req.rimpull_control is not None
        else cab_defaults.get("rimpull_control", "None")
    ) if "rimpull_control" in cab_defaults else "None"
    
    blade_angle = (
        req.blade_angle if req.blade_angle is not None
        else cab_defaults.get("blade_angle", "None")
    ) if "blade_angle" in cab_defaults else "None"
    
    working_gear = (
        req.working_gear if req.working_gear is not None
        else cab_defaults.get("working_gear", "None")
    ) if "working_gear" in cab_defaults else "None"
    
    tool_flow_rate = (
        req.tool_flow_rate if req.tool_flow_rate is not None
        else cab_defaults.get("tool_flow_rate", "None")
    ) if "tool_flow_rate" in cab_defaults else "None"

    # Feature input for ML engine
    ml_input = {
        "task_id": req.task_id,
        "task_type": task["task_type"],
        "machine_model": req.machine_id,
        "weather": task["weather"],
        "power_mode": req.power_mode,
        "hydraulic_response": req.hydraulic_response,
        "operator_skill": task["operator_skill"],
        "machine_age": task["machine_age_years"],
        "engine_rpm": req.engine_rpm,
        "assist_tech_enabled": req.assist_tech_enabled,
        
        # Machine-specific controls
        "payload_target_pct": payload_target_pct,
        "dig_priority": dig_priority,
        "stabilizer_stance": stabilizer_stance,
        "rimpull_control": rimpull_control,
        "blade_angle": blade_angle,
        "working_gear": working_gear,
        "tool_flow_rate": tool_flow_rate,
        "duty_cycle_pct": duty_cycle_pct
    }
    
    predictions = ml_engine.predict(ml_input)
    
    active_parameters = {
        "task_id": req.task_id,
        "machine_id": req.machine_id,
        "power_mode": req.power_mode,
        "engine_rpm": req.engine_rpm,
        "hydraulic_response": req.hydraulic_response,
        "assist_tech_enabled": req.assist_tech_enabled,
        "payload_target_pct": payload_target_pct,
        "dig_priority": dig_priority,
        "stabilizer_stance": stabilizer_stance,
        "rimpull_control": rimpull_control,
        "blade_angle": blade_angle,
        "working_gear": working_gear,
        "tool_flow_rate": tool_flow_rate,
        "duty_cycle_pct": duty_cycle_pct
    }
    
    eval_result = SimulationEvaluator.evaluate_run(
        task=task,
        machine=machine,
        parameters=active_parameters,
        predictions=predictions
    )
    
    return {
        "task": {
            "task_id": task["task_id"],
            "task_type": task["task_type"],
            "title": task["title"],
            "weather": task["weather"],
            "machine_age_years": task["machine_age_years"],
            "target_time_min": task["target_time_min"],
            "actual_benchmark_min": task["actual_benchmark_min"]
        },
        "machine": {
            "machine_id": machine["machine_id"],
            "name": machine["name"],
            "category": machine["category"]
        },
        "submitted_parameters": active_parameters,
        "predictions": predictions,
        "evaluation": eval_result
    }

@router.get("/tasks/{task_id}/optimal")
def get_optimal_solution(task_id: str):
    """Retrieve the engineering-recommended optimal parameters for a task."""
    tasks = {t["task_id"]: t for t in get_tasks_data()}
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    task = tasks[task_id]
    return {
        "task_id": task_id,
        "task_type": task["task_type"],
        "optimal_parameters": task["optimal_parameters"],
        "learning_objective": task["learning_objective"]
    }
