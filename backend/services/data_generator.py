"""
Synthetic Dataset Generator for Caterpillar Operator Relation Module.
Calibrated accurately to the Hackathon Tasks sample dataset and Caterpillar equipment handbooks.
Includes machine-specific cab controls:
- CAT 320: Bucket Fill % + Dig Priority (Swing / Balanced / Boom)
- CAT 420: Bucket Fill % + Stabilizer Stance (Soft Ground / Standard / Locked Down)
- CAT 950M: Bucket Fill % + Rimpull Anti-Slip (60% Mud / 80% Gravel / 100% Max)
- CAT 140: Moldboard Blade Angle (25° / 35° / 45°) + Working Gear (1st / 2nd / 3rd)
- CAT 349: Tool Flow Rate (Low / Medium / High) + Work Duty Cycle (65% - 100%)
"""

import json
import os
import random
import numpy as np
import pandas as pd

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "data")

def load_tasks_and_machines():
    tasks_path = os.path.join(DATA_DIR, "tasks_catalog.json")
    machines_path = os.path.join(DATA_DIR, "cat_machines.json")
    
    with open(tasks_path, "r", encoding="utf-8") as f:
        tasks = json.load(f)
    with open(machines_path, "r", encoding="utf-8") as f:
        machines = {m["machine_id"]: m for m in json.load(f)}
        
    return tasks, machines

def generate_simulation_dataset(num_samples: int = 4500, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)
    
    tasks, machines = load_tasks_and_machines()
    
    power_modes = ["Eco", "Smart", "Power"]
    hydraulic_modes = ["Fine", "Medium", "Quick"]
    skills = ["Beginner", "Intermediate", "Expert"]
    weathers = ["Sunny", "Rainy", "Cloudy", "Windy"]
    
    records = []
    
    # 1. Anchor records for exact task benchmarks
    for task in tasks:
        tid = task["task_id"]
        mid = task["recommended_machine_id"]
        opt = task["optimal_parameters"]
        m_spec = machines[mid]
        
        for _ in range(25):
            rec = {
                "task_id": tid,
                "task_type": task["task_type"],
                "machine_model": mid,
                "weather": task["weather"],
                "operator_skill": task["operator_skill"],
                "machine_age": task["machine_age_years"],
                "power_mode": opt["power_mode"],
                "engine_rpm": opt["engine_rpm"],
                "hydraulic_response": opt["hydraulic_response"],
                "assist_tech_enabled": 1 if opt.get("assist_tech_enabled", True) else 0,
                
                # Machine-specific parameters
                "payload_target_pct": float(opt.get("payload_target_pct", 90.0)),
                "dig_priority": opt.get("dig_priority", "None"),
                "stabilizer_stance": opt.get("stabilizer_stance", "None"),
                "rimpull_control": opt.get("rimpull_control", "None"),
                "blade_angle": opt.get("blade_angle", "None"),
                "working_gear": opt.get("working_gear", "None"),
                "tool_flow_rate": opt.get("tool_flow_rate", "None"),
                "duty_cycle_pct": float(opt.get("duty_cycle_pct", 85.0)),
                
                "completion_time_min": float(task["actual_benchmark_min"]) + np.random.normal(0, 0.25),
                "fuel_burn_rate_lph": round(m_spec["base_fuel_burn_lph"] * 1.02 + np.random.normal(0, 0.15), 1),
                "machine_stress_score": round(15.0 + task["machine_age_years"] * 3.2 + np.random.normal(0, 0.8), 1),
                "is_anchor": 1
            }
            records.append(rec)

    # 2. Parametric Simulation Runs
    for _ in range(num_samples):
        task = random.choice(tasks)
        tid = task["task_id"]
        ttype = task["task_type"]
        mid = task["recommended_machine_id"]
        m_spec = machines[mid]
        opt = task["optimal_parameters"]
        
        if random.random() < 0.70:
            weather = task["weather"]
            machine_age = task["machine_age_years"]
            skill = task["operator_skill"]
        else:
            weather = random.choice(weathers)
            machine_age = random.randint(1, 8)
            skill = random.choice(skills)
            
        power_mode = random.choice(power_modes)
        rpm_min, rpm_max = m_spec["rpm_range"]["min"], m_spec["rpm_range"]["max"]
        engine_rpm = int(np.random.uniform(rpm_min, rpm_max))
        hydraulic_response = random.choice(hydraulic_modes)
        assist_tech = 1 if random.random() > 0.40 else 0
        
        # Machine specific knob selections
        payload_pct = 90.0
        dig_priority = "None"
        stabilizer_stance = "None"
        rimpull_control = "None"
        blade_angle = "None"
        working_gear = "None"
        tool_flow_rate = "None"
        duty_cycle_pct = 85.0
        
        mach_factor_time = 1.0
        mach_factor_stress = 0.0
        mach_factor_fuel = 1.0
        
        if mid == "CAT-320":
            payload_pct = round(np.random.uniform(50, 110), 1)
            dig_priority = random.choice(["Swing Priority", "Balanced", "Boom Power"])
            if dig_priority != opt.get("dig_priority"):
                mach_factor_time *= 1.06
            if payload_pct < 75:
                mach_factor_time *= 1.15
            elif payload_pct > 102:
                mach_factor_time *= 1.05
                mach_factor_stress += 8.0
                
        elif mid == "CAT-420":
            payload_pct = round(np.random.uniform(50, 105), 1)
            stabilizer_stance = random.choice(["Soft Ground", "Standard", "Locked Down"])
            if weather == "Rainy" and stabilizer_stance != "Soft Ground":
                mach_factor_time *= 1.14
                mach_factor_stress += 14.0  # tipping / sink risk
            elif stabilizer_stance != opt.get("stabilizer_stance"):
                mach_factor_time *= 1.05
                
        elif mid == "CAT-950M":
            payload_pct = round(np.random.uniform(50, 110), 1)
            rimpull_control = random.choice(["60% Mud", "80% Gravel", "100% Max"])
            if (weather == "Rainy" or "Wet" in task["title"]) and rimpull_control == "100% Max":
                mach_factor_time *= 1.15  # tire slip
                mach_factor_stress += 18.0  # tire shredding & torque strain
                mach_factor_fuel *= 1.12
            elif rimpull_control != opt.get("rimpull_control"):
                mach_factor_time *= 1.05
                
        elif mid == "CAT-140":
            blade_angle = random.choice(["Spread 25°", "Normal 35°", "Deep Cut 45°"])
            working_gear = random.choice(["1st Gear", "2nd Gear", "3rd Gear"])
            # Grading physics
            if ("Precision" in task["title"] or "Finish" in task["title"]) and working_gear == "3rd Gear":
                mach_factor_time *= 1.35  # washboarding penalty rework!
                mach_factor_stress += 16.0
            elif working_gear != opt.get("working_gear"):
                mach_factor_time *= 1.08
            if blade_angle != opt.get("blade_angle"):
                mach_factor_time *= 1.07
                
        elif mid == "CAT-349":
            tool_flow_rate = random.choice(["Low Flow", "Medium Flow", "High Flow"])
            duty_cycle_pct = round(np.random.uniform(65, 100), 1)
            # Demolition attachment physics
            if tool_flow_rate != opt.get("tool_flow_rate"):
                mach_factor_time *= 1.12
                mach_factor_stress += 10.0
            if duty_cycle_pct > 92:
                # Continuous hammering
                mach_factor_stress += (duty_cycle_pct - 90) * 2.2
                if machine_age >= 6:
                    mach_factor_stress += 15.0  # thermal hazard on old machine!
                    
        # General physics
        base_benchmark = float(task["actual_benchmark_min"])
        opt_rpm = opt["engine_rpm"]
        rpm_diff = engine_rpm - opt_rpm
        if rpm_diff < 0:
            rpm_factor = 1.0 + abs(rpm_diff) / 1100.0 * 0.40
        else:
            if ttype in ["Grading", "Trenching"]:
                rpm_factor = 1.0 + (rpm_diff / 500.0) * 0.16
            else:
                rpm_factor = 1.0 - (rpm_diff / 500.0) * 0.05
                
        opt_mode = opt["power_mode"]
        if power_mode == opt_mode:
            mode_factor = 1.0
        elif power_mode == "Eco":
            mode_factor = 1.14
        elif power_mode == "Power":
            mode_factor = 0.96 if ttype != "Grading" else 1.08
        else:
            mode_factor = 1.02
            
        opt_hyd = opt["hydraulic_response"]
        if hydraulic_response == opt_hyd:
            hyd_factor = 1.0
        elif hydraulic_response == "Fine":
            hyd_factor = 1.14 if ttype in ["Earth Excavation", "Demolition", "Material Loading"] else 1.0
        elif hydraulic_response == "Quick":
            hyd_factor = 1.18 if ttype in ["Grading", "Trenching"] else 0.98
        else:
            hyd_factor = 1.04
            
        assist_factor = 1.0 if assist_tech == 1 else 1.14
        
        env_factor = 1.0
        if weather != task["weather"]:
            if weather == "Rainy":
                env_factor *= 1.12
            elif weather == "Windy":
                env_factor *= 1.08
        if machine_age != task["machine_age_years"]:
            age_diff = machine_age - task["machine_age_years"]
            env_factor *= (1.0 + age_diff * 0.02)
            
        time_calc = base_benchmark * rpm_factor * mode_factor * hyd_factor * assist_factor * mach_factor_time * env_factor
        simulated_time = round(max(15.0, time_calc + np.random.normal(0, 0.7)), 1)
        
        # Fuel burn
        base_fuel = m_spec["base_fuel_burn_lph"]
        mode_fuel = {"Eco": 0.80, "Smart": 0.98, "Power": 1.25}[power_mode]
        rpm_fuel = (engine_rpm / 1650.0) ** 1.5
        age_fuel = 1.0 + (machine_age * 0.015)
        fuel_burn = round(base_fuel * mode_fuel * rpm_fuel * mach_factor_fuel * age_fuel + np.random.normal(0, 0.3), 1)
        fuel_burn = max(4.0, fuel_burn)
        
        # Stress
        base_stress = 10.0 + (machine_age * 3.5)
        if power_mode == "Power":
            base_stress += 18.0
        elif power_mode == "Smart":
            base_stress += 6.0
        if engine_rpm > 1850:
            base_stress += ((engine_rpm - 1850) / 300.0) * 22.0
        if assist_tech == 1:
            base_stress -= 7.0
            
        stress = max(5.0, min(99.0, round(base_stress + mach_factor_stress + np.random.normal(0, 1.2), 1)))
        
        records.append({
            "task_id": tid,
            "task_type": ttype,
            "machine_model": mid,
            "weather": weather,
            "operator_skill": skill,
            "machine_age": machine_age,
            "power_mode": power_mode,
            "engine_rpm": engine_rpm,
            "hydraulic_response": hydraulic_response,
            "assist_tech_enabled": assist_tech,
            "payload_target_pct": payload_pct,
            "dig_priority": dig_priority,
            "stabilizer_stance": stabilizer_stance,
            "rimpull_control": rimpull_control,
            "blade_angle": blade_angle,
            "working_gear": working_gear,
            "tool_flow_rate": tool_flow_rate,
            "duty_cycle_pct": duty_cycle_pct,
            "completion_time_min": simulated_time,
            "fuel_burn_rate_lph": fuel_burn,
            "machine_stress_score": stress,
            "is_anchor": 0
        })
        
    df = pd.DataFrame(records)
    output_path = os.path.join(DATA_DIR, "simulation_dataset.csv")
    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"Generated {len(df)} machine-specific simulation records saved to {output_path}")
    return df

if __name__ == "__main__":
    generate_simulation_dataset()
