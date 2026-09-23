"""
Machine Learning Engine for Caterpillar Operator Relation Module.
Trains and serves multi-metric regression models to predict:
1. Task Completion Time (min)
2. Fuel Burn Rate (L/hr)
3. Machine Stress & Overheating Risk (%)
Supports machine-specific controls for Excavators, Loaders, Graders, and Demolition machines.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
MODEL_FILE = os.path.join(MODELS_DIR, "cat_simulator_models.joblib")

os.makedirs(MODELS_DIR, exist_ok=True)

CATEGORICAL_FEATURES = [
    "task_id",
    "task_type",
    "machine_model",
    "weather",
    "power_mode",
    "hydraulic_response",
    "operator_skill",
    "dig_priority",
    "stabilizer_stance",
    "rimpull_control",
    "blade_angle",
    "working_gear",
    "tool_flow_rate"
]

NUMERICAL_FEATURES = [
    "machine_age",
    "engine_rpm",
    "assist_tech_enabled",
    "payload_target_pct",
    "duty_cycle_pct"
]

TARGETS = [
    "completion_time_min",
    "fuel_burn_rate_lph",
    "machine_stress_score"
]

class CatSimulationMLEngine:
    def __init__(self):
        self.pipeline = None
        self.metrics = {}
        self.is_loaded = False
        
    def build_pipeline(self):
        preprocessor = ColumnTransformer(
            transformers=[
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
                ("num", StandardScaler(), NUMERICAL_FEATURES)
            ]
        )
        
        model = RandomForestRegressor(
            n_estimators=130,
            max_depth=18,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1
        )
        
        self.pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", model)
        ])
        return self.pipeline

    def train(self, dataset_path: str = None):
        if dataset_path is None:
            dataset_path = os.path.join(DATA_DIR, "simulation_dataset.csv")
            
        print(f"Loading training data from {dataset_path}...")
        df = pd.read_csv(dataset_path, encoding="utf-8")
        df = df.fillna("None")
        
        X = df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
        y = df[TARGETS]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.18, random_state=42
        )
        
        print("Building and training Random Forest Pipeline with machine-specific controls...")
        self.build_pipeline()
        self.pipeline.fit(X_train, y_train)
        
        y_pred = self.pipeline.predict(X_test)
        
        self.metrics = {}
        for idx, target in enumerate(TARGETS):
            mae = mean_absolute_error(y_test.iloc[:, idx], y_pred[:, idx])
            r2 = r2_score(y_test.iloc[:, idx], y_pred[:, idx])
            self.metrics[target] = {
                "mae": round(float(mae), 3),
                "r2": round(float(r2), 3)
            }
            print(f"Target [{target}]: R² = {r2:.4f}, MAE = {mae:.3f}")
            
        model_payload = {
            "pipeline": self.pipeline,
            "metrics": self.metrics,
            "categorical_features": CATEGORICAL_FEATURES,
            "numerical_features": NUMERICAL_FEATURES,
            "targets": TARGETS
        }
        joblib.dump(model_payload, MODEL_FILE)
        self.is_loaded = True
        print(f"Serialized model pipeline to {MODEL_FILE}")
        return self.metrics

    def load(self):
        if not os.path.exists(MODEL_FILE):
            print(f"Model file {MODEL_FILE} not found. Running training...")
            from backend.services.data_generator import generate_simulation_dataset
            dataset_path = os.path.join(DATA_DIR, "simulation_dataset.csv")
            if not os.path.exists(dataset_path):
                generate_simulation_dataset()
            self.train(dataset_path)
            return
            
        payload = joblib.load(MODEL_FILE)
        if payload.get("categorical_features") != CATEGORICAL_FEATURES:
            print("Model schema mismatch. Retraining...")
            from backend.services.data_generator import generate_simulation_dataset
            dataset_path = os.path.join(DATA_DIR, "simulation_dataset.csv")
            if not os.path.exists(dataset_path):
                generate_simulation_dataset()
            self.train(dataset_path)
            return

        self.pipeline = payload["pipeline"]
        self.metrics = payload["metrics"]
        self.is_loaded = True
        print(f"Loaded trained models from {MODEL_FILE}")

    def predict(self, input_dict: dict) -> dict:
        if not self.is_loaded or self.pipeline is None:
            self.load()
            
        row = {
            "task_id": input_dict["task_id"],
            "task_type": input_dict["task_type"],
            "machine_model": input_dict["machine_model"],
            "weather": input_dict["weather"],
            "power_mode": input_dict["power_mode"],
            "hydraulic_response": input_dict["hydraulic_response"],
            "operator_skill": input_dict.get("operator_skill", "Intermediate"),
            "machine_age": int(input_dict["machine_age"]),
            "engine_rpm": int(input_dict["engine_rpm"]),
            "assist_tech_enabled": 1 if input_dict.get("assist_tech_enabled", True) else 0,
            
            # Dynamic machine specific controls with defaults
            "payload_target_pct": float(input_dict.get("payload_target_pct") if input_dict.get("payload_target_pct") is not None else 90.0),
            "dig_priority": str(input_dict.get("dig_priority") or "None"),
            "stabilizer_stance": str(input_dict.get("stabilizer_stance") or "None"),
            "rimpull_control": str(input_dict.get("rimpull_control") or "None"),
            "blade_angle": str(input_dict.get("blade_angle") or "None"),
            "working_gear": str(input_dict.get("working_gear") or "None"),
            "tool_flow_rate": str(input_dict.get("tool_flow_rate") or "None"),
            "duty_cycle_pct": float(input_dict.get("duty_cycle_pct") if input_dict.get("duty_cycle_pct") is not None else 85.0)
        }
        
        df_single = pd.DataFrame([row])
        pred = self.pipeline.predict(df_single)[0]
        
        pred_time_min = max(5.0, round(float(pred[0]), 1))
        pred_fuel_burn_lph = max(4.0, round(float(pred[1]), 1))
        pred_stress = max(0.0, min(100.0, round(float(pred[2]), 1)))
        total_fuel_liters = round((pred_time_min / 60.0) * pred_fuel_burn_lph, 2)
        
        return {
            "predicted_completion_time_min": pred_time_min,
            "predicted_fuel_burn_rate_lph": pred_fuel_burn_lph,
            "predicted_total_fuel_liters": total_fuel_liters,
            "predicted_machine_stress_score": pred_stress
        }

ml_engine = CatSimulationMLEngine()

if __name__ == "__main__":
    from data_generator import generate_simulation_dataset
    dataset_path = os.path.join(DATA_DIR, "simulation_dataset.csv")
    if not os.path.exists(dataset_path):
        generate_simulation_dataset()
    engine = CatSimulationMLEngine()
    engine.train(dataset_path)
