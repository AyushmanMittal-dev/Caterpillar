# Caterpillar 950M Medium Wheel Loader — Operator Training Manual

## 1. Machine Overview & Technical Specifications
The **CAT 950M Medium Wheel Loader** is a 19.2-ton production workhorse engineered for aggregate handling, quarry truck loading, railcar filling, and bulk material transport.

- **Machine Model**: CAT 950M
- **Category**: Material Loading
- **Engine**: Cat C7.1 ACERT Tier 4 Final Diesel
- **Net Flywheel Power**: 250 HP (186 kW)
- **Operating Weight**: 19,213 kg (42,357 lbs)
- **Standard Bucket Capacity**: 3.1 to 3.6 m³ (4.0 to 4.75 yd³)
- **Breakout Force**: 181 kN (40,690 lbf)
- **Transmission**: 4-Speed Countershaft Powershift with Lock-Up Clutch
- **Standard Base Fuel Burn Rate**: 18.0 L/hr

---

## 2. Universal Cab Controls & Engine Tuning
The pressurized sound-suppressed cab features electro-hydraulic seat-mounted joystick steering, a responsive powershift lever, and an integrated color touchscreen.

### 2.1 Power Modes
1. **Eco Mode**:
   - Reduces torque converter slip and trims maximum engine revs.
   - Ideal for light stockpile maintenance, clean-up work, and long flat load-and-carry runs.
2. **Smart Mode (Standard Recommended)**:
   - Modulates hydraulic displacement and engine speed dynamically.
   - Provides peak hydraulic flow and torque converter rimpull when penetrating the pile, and drops RPM during transit.
   - Delivers the fastest V-pattern truck loading cycle times with lowest fuel consumption.
3. **Power Mode**:
   - Maintains continuous high hydraulic pressure and maximum engine RPM.
   - Useful for heavy quarry shot-rock and steep grade climbs, but risks severe tire spin if tire anti-slip is not properly set.

### 2.2 Engine Throttle RPM Dial
- **Operating RPM Band**: 1300 to 2100 RPM.
- **Factory Default**: 1700 RPM.
- **Tuning Rule**: Lock throttle between **1700 and 1800 RPM** in Smart Mode for high-production truck loading. Revving above 1900 RPM against the pile causes torque converter overheating and tire slipping.

### 2.3 Joystick Speed / Hydraulic Response
1. **Fine**: Smooth, cushioned bucket tilt and lift; prevents aggregate spillage when loading fragile or narrow haul truck bodies.
2. **Medium**: Balanced response for standard stockpile loading.
3. **Quick**: Fast lift and dump valve actuation for high-speed quarry cycles.

---

## 3. Machine-Specific Cab Signature Controls

### 3.1 Bucket Target Load (`payload_target_pct`)
- **Tuning Range**: 50% to 110% (Default: 90%).
- **Underfilling (<75%)**: Demands 5 or 6 passes to fill a 25-ton truck instead of 3 or 4, drastically increasing turnaround time.
- **Optimal Target (90%–95%)**: Fills the bucket heel cleanly, centers mass on the front axle, and prevents material rollover onto the lift arm cylinders.

### 3.2 Rimpull Anti-Slip Control (`rimpull_control`)
Rimpull control manages the maximum torque sent to the heavy loader tires when penetrating a material stockpile:
1. **60% Mud (Wet & Slippery)**:
   - Reduces torque output to the wheels to 60%.
   - Prevents tire spin on wet clay, mud, or unpaved quarry distribution floors during rain.
   - Saves expensive loader tires from cutting and shredding.
2. **80% Gravel (Loose Stone & Aggregate)**:
   - Sets torque to 80%.
   - Optimal setting for crushed rock, 20mm gravel, and sand stockpiles.
   - Allows steady pile penetration without breaking tire traction.
3. **100% Max (Dry Pavement & Concrete)**:
   - Full 100% engine torque delivered to the wheels.
   - Only to be used on clean, dry concrete aprons or hard dry quarry rock where tire slip cannot occur.
   - Warning: Using 100% rimpull in mud will spin tires into the ground, burying the axle and burning diesel.

---

## 4. Integrated Caterpillar Smart Technology

### 4.1 Cat Auto-Dig
- Automates the bucket loading process: as the loader approaches the pile, sensors detect resistance and automatically trigger the optimum lift and tilt sequence to fill the bucket completely on the first pass.
- Eliminates operator fatigue and standardizes loading consistency.

### 4.2 Cat Production Measurement (Payload Assist)
- Weighs material on the fly as the bucket lifts past the boom sensor.
- Displays target truck payload on the cab screen, ensuring legal payload without under- or over-loading.

### 4.3 Ride Control System
- Hydraulic accumulator dampens boom bounce during loaded travel.
- Prevents aggregate spillage during high-speed load-and-carry transport across rough site terrain.

---

## 5. Job Site Task Procedures & Operational Guidelines

### Task 1: 12-Truck Commercial Aggregate Loading (Quarry Limestone)
- **Objective**: Rapidly load twelve 25-ton highway haul trucks with crushed 20mm limestone within 42 minutes.
- **Optimal Configuration**:
  - Power Mode: **Smart**
  - Engine RPM: **1750 RPM**
  - Joystick Response: **Quick**
  - Bucket Fill: **90%–95%**
  - Rimpull Control: **80% Gravel**
  - Cat Auto-Dig: **ON**
- **Operator Technique**: Execute tight 45-degree V-pattern loading cycles. Approach the pile perpendicular in 1st gear. Crowd into the toe of the pile, initiate smooth lift and tilt back, reverse, and spot into the truck body in a continuous fluid rhythm.

### Task 2: Wet Yard Sand Stockpiling in Heavy Rain
- **Objective**: Move and load saturated river sand into rail hoppers during rainfall.
- **Optimal Configuration**:
  - Power Mode: **Eco**
  - Engine RPM: **1650 RPM**
  - Joystick Response: **Medium**
  - Bucket Fill: **85%**
  - Rimpull Control: **60% Mud**
- **Operator Technique**: Set Rimpull to 60% immediately. Saturated sand is dense; lower bucket fill to 85% to avoid tipping when swinging with the boom elevated.

---

## 6. Safety, Thermal Management & Tire Care
- **Tire Shredding Hazard**: Tires represent one of the highest operating costs on wheel loaders. Spinning tires under heavy torque while digging cuts the tread against sharp rock in seconds. Always back off throttle if wheels slip.
- **Torque Converter Overheating**: Pushing against a pile at high RPM in stalled condition causes torque converter fluid to overheat rapidly. Engage Auto-Dig or modulate throttle smoothly.
