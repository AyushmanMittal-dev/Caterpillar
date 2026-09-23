# Caterpillar Intelligent Operator Assistant — Simulation Module

> **Hackathon Solution**: Multifunctional Digital Twin & Simulation Training Module for Caterpillar (CAT) Machinery Operators.

---

## 🏗️ 1. Problem Statement & Mission

Modern Caterpillar equipment (excavators, backhoe loaders, wheel loaders, motor graders) features advanced electro-hydraulics, telematics, and automated assist technologies. However, machine operators are often trained through trial-and-error on the job site. Sub-optimal machine settings lead to:
- Excessive cycle times and schedule slippage
- Elevated fuel consumption
- Severe mechanical fatigue and hydraulic overheating on older equipment (e.g., operating high-hour machines at peak RPM in harsh weather)

This **Simulation Module** puts the operator inside an intelligent Caterpillar digital cab console. The operator chooses a task, inspects the environmental constraints (weather, machine age, soil condition), selects the designated machine, and tunes key operating parameters. The integrated Machine Learning engine predicts completion time, fuel burn rate, and machine stress, while the **CAT Intelligent Assistant** provides real-time coaching feedback.

---

## 🚜 2. Task Categories, Machines & Problem Statements

Directly calibrated against `Tasks_sample_dataset.jpeg`:

| Task ID | Task Category | Caterpillar Machine | Weather | Machine Age | Skill Level | Target Time | Actual Benchmark |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T001** | Earth Excavation | **CAT 320 Next Gen Excavator** | Sunny | 2 years | Expert | 60 min | 58 min |
| **T002** | Trenching | **CAT 420 Backhoe Loader** | Rainy | 4 years | Intermediate | 45 min | 52 min |
| **T003** | Material Loading | **CAT 950M Wheel Loader** | Cloudy | 3 years | Beginner | 30 min | 42 min |
| **T004** | Grading | **CAT 140 Motor Grader** | Sunny | 5 years | Expert | 35 min | 33 min |
| **T005** | Demolition | **CAT 349 Demolition Excavator**| Windy | 6 years | Intermediate | 90 min | 105 min |

### Specific Problem Statements

1. **Earth Excavation (T001) – CAT 320 Next Gen Excavator**:
   * *Problem Statement*: Excavate 450 m³ of compacted clay for a commercial building foundation. Weather is sunny (28°C) and dry. The machine is 2 years old and in prime mechanical health. Target cycle completion is 60 minutes. Your objective is to achieve the 58–60 minute completion window while balancing fuel efficiency and preventing unnecessary hydraulic pressure spikes.
   * *Optimal Parameters*: Power Mode: **Smart**, RPM: **1850**, Hydraulics: **Quick**, Payload: **95%**, Cat Grade Assist: **ON**.

2. **Trenching (T002) – CAT 420 Backhoe Loader**:
   * *Problem Statement*: Excavate an 80-meter continuous conduit trench (depth: 1.5m, width: 0.6m) along a roadside embankment during steady rainfall. Saturated mud creates high risk of sidewall slumping and wheel slippage. Excessive RPM causes wheel spin and trench collapse.
   * *Optimal Parameters*: Power Mode: **Eco**, RPM: **1650**, Hydraulics: **Fine**, Payload: **80%**, Differential Lock: **ON**.

3. **Material Loading (T003) – CAT 950M Wheel Loader**:
   * *Problem Statement*: Load 12 highway haul trucks (25 tons each) with crushed 20mm limestone at a distribution quarry. Beginners frequently slip tires into the pile and suffer incomplete bucket fills, causing the run to drag out to 42 minutes.
   * *Optimal Parameters*: Power Mode: **Smart**, RPM: **1750**, Hydraulics: **Quick**, Payload: **90%**, Auto-Dig / Payload Assist: **ON**.

4. **Grading (T004) – CAT 140 Motor Grader**:
   * *Problem Statement*: Perform precision finish grading across 1.2 kilometers of highway sub-base to an elevation tolerance of ±5mm. Running at excessive speed or high RPM causes moldboard blade washboarding and hydraulic chatter.
   * *Optimal Parameters*: Power Mode: **Eco**, RPM: **1550**, Hydraulics: **Fine**, Payload: **85%**, Cat Grade with Cross Slope: **ON**.

5. **Demolition (T005) – CAT 349 Demolition Excavator**:
   * *Problem Statement*: Demolish a 2-story reinforced concrete industrial warehouse frame using a high-flow hydraulic shear under strong 35 km/h wind gusts. The machine is 6 years old with high operating hours. Running in Power Mode at max 2100+ RPM will overheat hydraulic oil and trip relief valve warnings.
   * *Optimal Parameters*: Power Mode: **Smart**, RPM: **1800**, Hydraulics: **Medium**, Duty Cycle: **85%**, Relief Protection: **ON**.

---

## 🤖 3. Machine Learning Architecture

- **Dataset**: `backend/data/simulation_dataset.csv` (5,125 calibrated records).
- **Ensemble Model**: Multi-Target `RandomForestRegressor` with `StandardScaler` and `OneHotEncoder`.
- **Target Performance Metrics**:
  - **Task Completion Time (min)**: $R^2 = 0.9554$, $MAE = 4.69$ min
  - **Fuel Burn Rate (L/hr)**: $R^2 = 0.9793$, $MAE = 1.18$ L/hr
  - **Machine Stress Score (%)**: $R^2 = 0.9384$, $MAE = 2.61$%
- **Artifact**: Serialized model saved at `backend/models/cat_simulator_models.joblib`.

---

## ⚡ 4. Technology Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib, Pydantic.
- **Frontend**: React 18, Framer Motion, Lucide React, Vite.
- **Styling**: Minimalist, industrial Caterpillar digital cab aesthetic.

---

## 🚀 5. How to Run

### Quick Launch (Windows):
Double click `start_all.bat` or run:
```powershell
.\start_all.bat
```

### Manual Launch:
1. **Start Backend**:
   ```powershell
   backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --reload
   ```
   API Docs available at: `http://localhost:8000/docs`

2. **Start Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
   Access Web Interface at: `http://localhost:5173`

---

## 🧪 6. Automated Verification

Run unit & integration tests:
```powershell
backend\.venv\Scripts\python.exe backend\tests\test_simulation.py
```
Outputs validation across all endpoints, verifying model predictions, stress alerts, and coaching diagnostics.
