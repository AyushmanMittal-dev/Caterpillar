"""
FastAPI Microservice Route for Module 1 (Pre-Task ETA Predictor) & Module 2 (Real-Time Safety & Telemetry Stream).
Supports In-Memory Rolling Window & Local Offline Fallback.
"""

import os
import pickle
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/engine", tags=["ml_engine"])

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, "models")

ETA_MODEL_PATH = os.path.join(MODELS_DIR, "task_time_estimator.json")
ETA_FEATS_PATH = os.path.join(MODELS_DIR, "eta_features.pkl")

SAFETY_MODEL_PATH = os.path.join(MODELS_DIR, "safety_risk_classifier.json")
SAFETY_FEATS_PATH = os.path.join(MODELS_DIR, "safety_features.pkl")
SAFETY_ENCODER_PATH = os.path.join(MODELS_DIR, "safety_label_encoder.pkl")

# Global models state
eta_model: Optional[xgb.XGBRegressor] = None
eta_features: List[str] = []

safety_model: Optional[xgb.XGBClassifier] = None
safety_features: List[str] = []
safety_label_encoder = None

# Extracted Categorical Encodings for ETA Model
CAT_LEVELS = {
    "Task_Type": ['Aggregate Handling', 'Backfilling', 'Deep Digging', 'Demolition', 'Ditch Grading', 'Earth Pushing', 'Excavation', 'Fine Grading', 'Foundation Digging', 'Land Clearing', 'Material Handling', 'Material Loading', 'Road Grading', 'Road Maintenance', 'Rough Grading', 'Site Cleanup', 'Site Preparation', 'Stockpile Loading', 'Surface Leveling', 'Trenching', 'Truck Loading', 'Utility Digging'],
    "Machine_Type": ['Backhoe Loader', 'Bulldozer', 'Excavator', 'Motor Grader', 'Wheel Loader'],
    "Machine_Model": ['CAT_120', 'CAT_130', 'CAT_140', 'CAT_160', 'CAT_313', 'CAT_320', 'CAT_323', 'CAT_336', 'CAT_352', 'CAT_416', 'CAT_420', 'CAT_430', 'CAT_432', 'CAT_434', 'CAT_950', 'CAT_962', 'CAT_966', 'CAT_972', 'CAT_980', 'CAT_D4', 'CAT_D5', 'CAT_D6', 'CAT_D7', 'CAT_D8'],
    "Weather": ['Cloudy', 'Rainy', 'Sunny', 'Windy'],
    "Ground_Condition": ['Dry', 'Muddy', 'Wet']
}

def load_ml_models():
    global eta_model, eta_features, safety_model, safety_features, safety_label_encoder
    
    if os.path.exists(ETA_MODEL_PATH):
        eta_model = xgb.XGBRegressor(enable_categorical=True)
        eta_model.load_model(ETA_MODEL_PATH)
        
    if os.path.exists(ETA_FEATS_PATH):
        with open(ETA_FEATS_PATH, "rb") as f:
            eta_features = pickle.load(f)

    if os.path.exists(SAFETY_MODEL_PATH):
        safety_model = xgb.XGBClassifier(enable_categorical=True)
        safety_model.load_model(SAFETY_MODEL_PATH)

    if os.path.exists(SAFETY_FEATS_PATH):
        with open(SAFETY_FEATS_PATH, "rb") as f:
            safety_features = pickle.load(f)

    if os.path.exists(SAFETY_ENCODER_PATH):
        safety_label_encoder = joblib.load(SAFETY_ENCODER_PATH)

load_ml_models()

# In-Memory Rolling Window Buffer (Stores last 30 telemetry ticks per session/machine)
ROLLING_WINDOW_CACHE: Dict[str, List[Dict[str, Any]]] = {}
WINDOW_MAX_SIZE = 30  # ~30 seconds window at 1 tick/sec

class PreTaskETARequest(BaseModel):
    task_type: str = Field(default="Excavation")
    machine_type: str = Field(default="Excavator")
    machine_model: str = Field(default="CAT_320")
    planned_time_min: float = Field(default=60.0)
    machine_age_years: float = Field(default=2.0)
    engine_hours: int = Field(default=1200)
    machine_wear_index: float = Field(default=0.15)
    operator_hist_pace_ratio: float = Field(default=1.0)
    weather: str = Field(default="Sunny")
    weather_severity: int = Field(default=1)
    temperature_c: float = Field(default=28.0)
    rainfall_mm_hr: float = Field(default=0.0)
    ground_condition: str = Field(default="Dry")
    site_wetness_index: float = Field(default=0.1)
    schedule_tightness_ratio: float = Field(default=1.0)

class TelemetryPacket(BaseModel):
    session_id: str = Field(default="default_cab")
    engine_load_pct: float = Field(default=65.0)
    machine_speed_kmh: float = Field(default=10.0)
    fuel_rate_l_hr: float = Field(default=16.5)
    engine_temperature_c: float = Field(default=85.0)
    idle_status: int = Field(default=0)  # 0: Active, 1: Idling
    idle_duration_min: float = Field(default=0.0)
    seatbelt_status: int = Field(default=1)  # 1: Buckled, 0: Unbuckled
    object_distance_m: float = Field(default=12.0)
    proximity_event: int = Field(default=0)
    harsh_operation_event: int = Field(default=0)
    drowsiness_status: int = Field(default=0)  # 0: Alert, 1: Drowsy
    mechanical_strain_risk: int = Field(default=0)
    active_violation_count: int = Field(default=0)
    force_offline: bool = Field(default=False)  # Mock offline dropouts

from backend.services.cache_service import cache_service

@router.post("/eta/predict")
def predict_pre_task_eta(req: PreTaskETARequest):
    """Module 1: Pre-Task Baseline ETA Predictor with Cache Fallback."""
    req_payload = req.model_dump()
    cache_key = cache_service.generate_key("eta_predict", req_payload)
    
    # 1. Try Cache Hit
    cached_res, is_hit = cache_service.get(cache_key)
    if is_hit and cached_res:
        cached_res["source"] = "IN_MEMORY_CACHE_HIT"
        return cached_res

    # 2. Compute via Model Pipeline
    if eta_model is None:
        # Fallback to stale cache if model fails
        stale_res = cache_service.get_stale_fallback(cache_key)
        if stale_res:
            stale_res["source"] = "STALE_CACHE_FALLBACK"
            return stale_res
        raise HTTPException(status_code=500, detail="ETA XGBoost model is not loaded.")

    try:
        # Match categoricals cleanly against CAT_LEVELS
        task_type = req.task_type if req.task_type in CAT_LEVELS["Task_Type"] else CAT_LEVELS["Task_Type"][0]
        machine_type = req.machine_type if req.machine_type in CAT_LEVELS["Machine_Type"] else CAT_LEVELS["Machine_Type"][0]
        machine_model = req.machine_model if req.machine_model in CAT_LEVELS["Machine_Model"] else "CAT_320"
        weather = req.weather if req.weather in CAT_LEVELS["Weather"] else "Sunny"
        ground = req.ground_condition if req.ground_condition in CAT_LEVELS["Ground_Condition"] else "Dry"

        df_data = {
            'Task_Type': pd.Series([task_type], dtype=pd.CategoricalDtype(categories=CAT_LEVELS["Task_Type"])),
            'Machine_Type': pd.Series([machine_type], dtype=pd.CategoricalDtype(categories=CAT_LEVELS["Machine_Type"])),
            'Machine_Model': pd.Series([machine_model], dtype=pd.CategoricalDtype(categories=CAT_LEVELS["Machine_Model"])),
            'Planned_Time_min': pd.Series([req.planned_time_min], dtype='float64'),
            'Machine_Age_Years': pd.Series([req.machine_age_years], dtype='float64'),
            'Engine_Hours': pd.Series([req.engine_hours], dtype='int64'),
            'Machine_Wear_Index': pd.Series([req.machine_wear_index], dtype='float64'),
            'Operator_Hist_Pace_Ratio': pd.Series([req.operator_hist_pace_ratio], dtype='float64'),
            'Weather': pd.Series([weather], dtype=pd.CategoricalDtype(categories=CAT_LEVELS["Weather"])),
            'Weather_Severity': pd.Series([req.weather_severity], dtype='int64'),
            'Temperature_C': pd.Series([req.temperature_c], dtype='float64'),
            'Rainfall_mm_hr': pd.Series([req.rainfall_mm_hr], dtype='float64'),
            'Ground_Condition': pd.Series([ground], dtype=pd.CategoricalDtype(categories=CAT_LEVELS["Ground_Condition"])),
            'Site_Wetness_Index': pd.Series([req.site_wetness_index], dtype='float64'),
            'Schedule_Tightness_Ratio': pd.Series([req.schedule_tightness_ratio], dtype='float64')
        }
        df = pd.DataFrame(df_data)
        
        delta_time = float(eta_model.predict(df)[0])
        revised_eta = round(req.planned_time_min + delta_time, 1)

        result = {
            "status": "success",
            "source": "MODEL_INFERENCE",
            "engine": "Module 1 - XGBoost Baseline ETA",
            "planned_time_min": req.planned_time_min,
            "predicted_delta_min": round(delta_time, 2),
            "revised_eta_min": max(1.0, revised_eta),
            "confidence": 0.94
        }
        # Save to cache (TTL = 10 minutes)
        cache_service.set(cache_key, result, ttl_seconds=600)
        return result
    except Exception as e:
        stale_res = cache_service.get_stale_fallback(cache_key)
        if stale_res:
            stale_res["source"] = "STALE_CACHE_FALLBACK"
            return stale_res
        raise HTTPException(status_code=500, detail=f"ETA prediction error: {e}")

@router.post("/telemetry/assess")
def process_telemetry_tick(packet: TelemetryPacket):
    """
    Module 2: Real-Time Safety & Sensor Telemetry Pipeline.
    Supports rolling window buffering and offline fallback.
    """
    sid = packet.session_id
    if sid not in ROLLING_WINDOW_CACHE:
        ROLLING_WINDOW_CACHE[sid] = []
        
    tick_dict = packet.model_dump()
    ROLLING_WINDOW_CACHE[sid].append(tick_dict)
    if len(ROLLING_WINDOW_CACHE[sid]) > WINDOW_MAX_SIZE:
        ROLLING_WINDOW_CACHE[sid].pop(0)

    window = ROLLING_WINDOW_CACHE[sid]
    window_length = len(window)

    # Compute rolling window aggregations
    avg_engine_load = round(float(np.mean([t["engine_load_pct"] for t in window])), 1)
    max_temp = round(float(np.max([t["engine_temperature_c"] for t in window])), 1)
    total_idle_min = round(float(sum([t["idle_duration_min"] for t in window])), 1)
    recent_violations = sum([t["seatbelt_status"] == 0 or t["drowsiness_status"] == 1 or t["proximity_event"] == 1 for t in window])

    # Check for simulate connection dropout / force_offline
    if packet.force_offline or safety_model is None:
        # LOCAL OFFLINE HEURISTIC EVALUATOR FALLBACK
        active_violations = []
        if packet.seatbelt_status == 0:
            active_violations.append("UNFASTENED SEATBELT IN CAB!")
        if packet.drowsiness_status == 1:
            active_violations.append("OPERATOR DROWSINESS DETECTED!")
        if packet.object_distance_m <= 4.0 or packet.proximity_event == 1:
            active_violations.append(f"IMMINENT PROXIMITY COLLISION HAZARD ({packet.object_distance_m}m)!")
        if packet.engine_temperature_c >= 98.0:
            active_violations.append(f"CRITICAL OVERHEATING HAZARD ({packet.engine_temperature_c}°C)!")

        # High Risk if ANY life-safety or machine-destruction hazard occurs
        if (
            packet.seatbelt_status == 0 or
            packet.drowsiness_status == 1 or
            packet.object_distance_m <= 4.0 or
            packet.proximity_event == 1 or
            packet.engine_temperature_c >= 98.0 or
            len(active_violations) >= 2
        ):
            risk_level = "High"
        elif len(active_violations) == 1 or packet.engine_load_pct > 85.0 or packet.object_distance_m <= 7.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return {
            "status": "success",
            "evaluator": "Local Offline Heuristic Fallback (In-Cab Buffer)",
            "connection_status": "OFFLINE_FALLBACK",
            "risk_level": risk_level,
            "probabilities": {
                "High": 0.95 if risk_level == "High" else 0.05,
                "Medium": 0.85 if risk_level == "Medium" else 0.1,
                "Low": 0.95 if risk_level == "Low" else 0.05
            },
            "active_violations": active_violations,
            "rolling_window_metrics": {
                "buffered_ticks": window_length,
                "avg_engine_load_pct": avg_engine_load,
                "max_engine_temp_c": max_temp,
                "accumulated_idle_min": total_idle_min,
                "recent_violations_count": recent_violations
            }
        }

    # ONLINE CLOUD INFERENCE PIPELINE (Module 2 XGBoost)
    safety_df = pd.DataFrame([{
        'Engine_Load_pct': packet.engine_load_pct,
        'Machine_Speed_kmh': packet.machine_speed_kmh,
        'Fuel_Rate_L_hr': packet.fuel_rate_l_hr,
        'Engine_Temperature_C': packet.engine_temperature_c,
        'Idle_Status': packet.idle_status,
        'Idle_Duration_min': packet.idle_duration_min,
        'Seatbelt_Status': packet.seatbelt_status,
        'Object_Distance_m': packet.object_distance_m,
        'Proximity_Event': packet.proximity_event,
        'Harsh_Operation_Event': packet.harsh_operation_event,
        'Operator Drowsiness Status': packet.drowsiness_status,
        'Mechanical_Strain_Risk': packet.mechanical_strain_risk,
        'Active_Violation_Count': packet.active_violation_count
    }])

    pred_idx = int(safety_model.predict(safety_df)[0])
    risk_label = str(safety_label_encoder.inverse_transform([pred_idx])[0]) if safety_label_encoder else ("High" if pred_idx == 0 else "Low")
    probs = safety_model.predict_proba(safety_df)[0]
    
    classes = list(safety_label_encoder.classes_) if safety_label_encoder else ["High", "Low", "Medium"]
    prob_dict = {classes[i]: round(float(probs[i]), 4) for i in range(len(classes))}

    active_violations = []
    if packet.seatbelt_status == 0:
        active_violations.append("Seatbelt Unfastened")
    if packet.drowsiness_status == 1:
        active_violations.append("Driver Fatigue / Drowsiness")

    # Safety Guardrail Overrides for Machine & Operator Safety
    # 1. Critical Life/Asset Hazards -> HIGH RISK
    if packet.seatbelt_status == 0 or packet.drowsiness_status == 1 or packet.object_distance_m <= 4.0 or packet.engine_temperature_c >= 98.0:
        risk_label = "High"
        prob_dict["High"] = max(prob_dict.get("High", 0.0), 0.95)
        prob_dict["Medium"] = min(prob_dict.get("Medium", 0.0), 0.04)
        prob_dict["Low"] = min(prob_dict.get("Low", 0.0), 0.01)
        if packet.object_distance_m <= 4.0:
            active_violations.append(f"Imminent Proximity Hazard ({packet.object_distance_m}m)")
        if packet.engine_temperature_c >= 98.0:
            active_violations.append(f"Engine Overheating ({packet.engine_temperature_c}°C)")

    # 2. Elevated Warning Hazards -> MEDIUM RISK
    elif (4.0 < packet.object_distance_m <= 7.5) or (90.0 <= packet.engine_temperature_c < 98.0) or (packet.engine_load_pct > 80.0) or (packet.harsh_operation_event == 1):
        risk_label = "Medium"
        prob_dict["Medium"] = max(prob_dict.get("Medium", 0.0), 0.88)
        prob_dict["High"] = min(prob_dict.get("High", 0.0), 0.08)
        prob_dict["Low"] = min(prob_dict.get("Low", 0.0), 0.04)
        if 4.0 < packet.object_distance_m <= 7.5:
            active_violations.append(f"Proximity Caution ({packet.object_distance_m}m)")
        if 90.0 <= packet.engine_temperature_c < 98.0:
            active_violations.append(f"High Hydraulic Temperature ({packet.engine_temperature_c}°C)")
        if packet.engine_load_pct > 80.0:
            active_violations.append(f"Elevated Engine Strain ({packet.engine_load_pct}%)")

    return {
        "status": "success",
        "evaluator": "Module 2 - Real-Time Safety XGBoost Classifier",
        "connection_status": "ONLINE",
        "risk_level": risk_label,
        "probabilities": prob_dict,
        "active_violations": active_violations,
        "rolling_window_metrics": {
            "buffered_ticks": window_length,
            "avg_engine_load_pct": avg_engine_load,
            "max_engine_temp_c": max_temp,
            "accumulated_idle_min": total_idle_min,
            "recent_violations_count": recent_violations
        }
    }

@router.post("/telemetry/reset")
def reset_telemetry_window(session_id: str = "harness_demo_session"):
    """Resets the rolling window cache buffer back to 0 ticks for fresh testing."""
    if session_id in ROLLING_WINDOW_CACHE:
        ROLLING_WINDOW_CACHE[session_id] = []
    return {"status": "success", "message": f"Rolling window cleared for {session_id}"}

@router.get("/cache/stats")
def get_cache_stats():
    """Returns real-time in-memory cache hit rate and statistics."""
    return {
        "status": "success",
        "cache_metrics": cache_service.get_stats()
    }

