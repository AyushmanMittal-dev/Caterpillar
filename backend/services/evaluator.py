"""
Simulation Evaluator and Operator Cab Companion Engine.
Computes operator scoring, completion delta, and machine-specific coaching advice.
"""

from typing import Dict, Any

class SimulationEvaluator:
    @staticmethod
    def evaluate_run(
        task: Dict[str, Any],
        machine: Dict[str, Any],
        parameters: Dict[str, Any],
        predictions: Dict[str, Any]
    ) -> Dict[str, Any]:
        target_time = float(task["target_time_min"])
        actual_benchmark = float(task["actual_benchmark_min"])
        pred_time = float(predictions["predicted_completion_time_min"])
        pred_fuel_rate = float(predictions["predicted_fuel_burn_rate_lph"])
        stress_score = float(predictions["predicted_machine_stress_score"])
        
        # Calculate time difference
        time_delta_actual = round(pred_time - actual_benchmark, 1)
        
        # Compute Operator Score (0 to 100)
        time_penalty = abs(time_delta_actual) * 2.5
        
        stress_penalty = 0.0
        if stress_score > 60.0:
            stress_penalty = (stress_score - 60.0) * 0.95
            
        base_fuel = float(machine["base_fuel_burn_lph"])
        fuel_ratio = pred_fuel_rate / max(1.0, base_fuel)
        fuel_penalty = max(0.0, (fuel_ratio - 1.15) * 12.0)
        
        raw_score = 100.0 - time_penalty - stress_penalty - fuel_penalty
        final_score = max(10.0, min(100.0, round(raw_score, 1)))
        
        # Rating Tier
        if final_score >= 88.0:
            rating_tier = "Master Operator"
            status_color = "emerald"
        elif final_score >= 72.0:
            rating_tier = "Good Operator"
            status_color = "amber"
        elif final_score >= 50.0:
            rating_tier = "Needs Practice"
            status_color = "orange"
        else:
            rating_tier = "Check Cab Settings"
            status_color = "rose"
            
        # Machine-Specific Operator Coaching
        tips = []
        alerts = []
        
        opt = task["optimal_parameters"]
        mid = machine["machine_id"]
        current_rpm = int(parameters["engine_rpm"])
        current_mode = parameters["power_mode"]
        current_hyd = parameters["hydraulic_response"]
        assist_enabled = bool(parameters.get("assist_tech_enabled", False))
        machine_age = int(task["machine_age_years"])
        weather = task["weather"]
        ttype = task["task_type"]
        
        # 1. Thermal & Stress Hazard Checks
        if stress_score >= 75.0:
            alerts.append(
                f"OVERHEATING HAZARD! Machine is {machine_age} yrs old. "
                f"Running {current_rpm} RPM in {current_mode} Mode under {weather} conditions "
                f"risks severe hydraulic overheating. Back off throttle!"
            )
        elif stress_score >= 58.0:
            alerts.append(
                "High Machine Strain: The hydraulic pump is working under heavy load. Ease off peak throttle."
            )
            
        # 2. General Engine & Mode Advice
        if time_delta_actual > 4.0:
            if current_rpm < opt["engine_rpm"] - 120:
                tips.append(
                    f"Too slow! Engine RPM ({current_rpm}) is throttled too low. Dial throttle closer to {opt['engine_rpm']} RPM."
                )
            if current_mode == "Eco" and opt["power_mode"] in ["Smart", "Power"]:
                tips.append(
                    f"Power Mode: Eco Mode is choking hydraulic speed in this heavy material. Switch to '{opt['power_mode']}' mode."
                )
        elif time_delta_actual < -4.0:
            tips.append(
                f"You finished quickly, but diesel burn is high ({pred_fuel_rate} L/h). You can hit benchmark with less throttle."
            )
            
        # 3. Machine-Specific Control Diagnostics
        if mid == "CAT-320":
            # Excavator: Dig Priority & Bucket Fill
            user_prio = parameters.get("dig_priority")
            opt_prio = opt.get("dig_priority")
            if user_prio and opt_prio and user_prio != opt_prio:
                if opt_prio == "Boom Power":
                    tips.append("Dig Priority: Switch to 'Boom Power' priority to direct oil flow into the stick cylinders for hard breakout.")
                elif opt_prio == "Swing Priority":
                    tips.append("Dig Priority: Switch to 'Swing Priority' to speed up the 90-degree casting rotation.")
            payload = float(parameters.get("payload_target_pct", 90))
            if payload < 75:
                tips.append(f"Light Bucket ({payload}%): You are taking extra passes with half-empty buckets. Target 90% full.")
            elif payload > 102:
                tips.append(f"Heaped Bucket ({payload}%): Overfilled bucket is spilling clay and slowing swing acceleration.")
                
        elif mid == "CAT-420":
            # Backhoe: Stabilizer Stance & Bucket Fill
            user_stance = parameters.get("stabilizer_stance")
            opt_stance = opt.get("stabilizer_stance")
            if weather == "Rainy" and user_stance != "Soft Ground":
                alerts.append("Stabilizer Sinking Warning! On muddy roadside banks, engage 'Soft Mud' stabilizer stance to prevent cab tilting.")
            elif user_stance and opt_stance and user_stance != opt_stance:
                tips.append(f"Stabilizer Stance: Setting stabilizers to '{opt_stance}' gives optimal stability for this trench.")
                
        elif mid == "CAT-950M":
            # Wheel Loader: Rimpull & Bucket Load
            user_rimpull = parameters.get("rimpull_control")
            opt_rimpull = opt.get("rimpull_control")
            if (weather == "Rainy" or "Wet" in task["title"]) and user_rimpull == "100% Max":
                alerts.append("Tire Spin Hazard! 100% Rimpull in wet yard causes heavy tire spin. Reduce Rimpull to '60% Mud'.")
            elif user_rimpull and opt_rimpull and user_rimpull != opt_rimpull:
                tips.append(f"Rimpull Control: Adjust tire torque to '{opt_rimpull}' to maximize pile penetration without tire slip.")
                
        elif mid == "CAT-140":
            # Motor Grader: Blade Angle & Working Gear
            user_gear = parameters.get("working_gear")
            opt_gear = opt.get("working_gear")
            user_blade = parameters.get("blade_angle")
            opt_blade = opt.get("blade_angle")
            if user_gear == "3rd Gear" and ("Precision" in task["title"] or "Finish" in task["title"]):
                alerts.append("Blade Chatter Alert! 3rd Gear is too fast for finish grading, creating washboard ripples on the sub-base.")
            elif user_gear and opt_gear and user_gear != opt_gear:
                tips.append(f"Transmission Gear: Select '{opt_gear}' for optimal moldboard material roll.")
            if user_blade and opt_blade and user_blade != opt_blade:
                tips.append(f"Moldboard Angle: Adjust blade to '{opt_blade}' to guide windrow discharge cleanly.")
                
        elif mid == "CAT-349":
            # Demolition: Tool Flow Rate & Duty Cycle
            user_flow = parameters.get("tool_flow_rate")
            opt_flow = opt.get("tool_flow_rate")
            duty = float(parameters.get("duty_cycle_pct", 85))
            if duty > 92 and machine_age >= 5:
                alerts.append("Hydraulic Thermal Alarm! Running continuous 95%+ duty cycle on older demolition shear will blow cylinder packings.")
            elif duty < 70:
                tips.append("Tool Duty Cycle: Tool pace is overly conservative (under 70%), which drags out total demolition hours.")
            if user_flow and opt_flow and user_flow != opt_flow:
                tips.append(f"Attachment Flow: Set tool flow to '{opt_flow}' to match the attachment manufacturer specification.")
                
        # 4. Cat Smart Assist
        if not assist_enabled and opt.get("assist_tech_enabled", True):
            tips.append(f"Turn on Cat Smart Assist ({machine['assist_technology']}) to automate cylinder positioning.")
            
        if not tips and not alerts:
            tips.append("Spot-on settings! The machine ran smoothly, fuel was clean, and you hit the job benchmark.")
            
        is_target_achieved = abs(time_delta_actual) <= 3.5 and stress_score < 70.0
        
        return {
            "score": final_score,
            "rating_tier": rating_tier,
            "status_color": status_color,
            "is_target_achieved": is_target_achieved,
            "time_delta_target": round(pred_time - target_time, 1),
            "time_delta_actual": time_delta_actual,
            "target_time_min": target_time,
            "actual_benchmark_min": actual_benchmark,
            "predicted_time_min": pred_time,
            "predicted_fuel_burn_rate_lph": pred_fuel_rate,
            "predicted_total_fuel_liters": predictions["predicted_total_fuel_liters"],
            "machine_stress_score": stress_score,
            "alerts": alerts,
            "coaching_tips": tips,
            "optimal_parameters": opt
        }
