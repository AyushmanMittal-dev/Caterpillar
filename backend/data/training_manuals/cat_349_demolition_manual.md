# Caterpillar 349 High-Reach Demolition Excavator — Operator Training Manual

## 1. Machine Overview & Technical Specifications
The **CAT 349 High-Reach Demolition Excavator** is a heavy 53.2-ton specialized machine engineered for structural demolition, reinforced concrete shearing, rock breaking, and industrial dismantling.

- **Machine Model**: CAT 349 Demolition
- **Category**: Demolition & High-Reach Processing
- **Engine**: Cat C13 ACERT Tier 4 Final / Stage V Diesel
- **Net Flywheel Power**: 432 HP (322 kW)
- **Operating Weight**: 53,200 kg (117,300 lbs)
- **High-Reach Boom Height**: Up to 28 meters vertical reach
- **Auxiliary Hydraulic Tool Flow**: Up to 570 L/min dedicated high-pressure flow
- **Reinforced Structure**: FOGS (Falling Object Guard Structure) protected cab with impact-resistant polycarbonate glass
- **Standard Base Fuel Burn Rate**: 34.0 L/hr

---

## 2. Universal Cab Controls & Engine Tuning
The cab provides an ergonomic control station with tilting cab (up to 30 degrees) for overhead structural viewing, auxiliary thumb rollers on joysticks, and an advanced electronic attachment control system.

### 2.1 Power Modes
1. **Eco Mode**:
   - Useful during ground sorting, site cleanup, and loading processed rebar into dumpsters.
   - Not recommended during active concrete shearing as hydraulic cycle times become sluggish.
2. **Smart Mode (Standard Recommended)**:
   - Senses when hydraulic shears or hammers engage heavy concrete and instantly delivers full hydraulic pump displacement.
   - Automatically settles engine RPM between bites to prevent hydraulic oil boiling.
3. **Power Mode**:
   - Full unrestricted hydraulic output.
   - Use with extreme caution on machines older than 5 years: continuous operation in Power Mode trips hydraulic relief valves and can blow cylinder packings.

### 2.2 Engine Throttle RPM Dial
- **Operating RPM Band**: 1300 to 2200 RPM.
- **Factory Default**: 1800 RPM.
- **Tuning Rule**: Lock throttle between **1750 and 1800 RPM** in Smart Mode. Revving above 1900 RPM while running continuous high-flow hydraulic attachments generates severe thermal build-up without accelerating jaw cutting speed.

### 2.3 Joystick Speed / Hydraulic Response
1. **Fine**: Critical when precision-shearing steel I-beams or dismantling structural columns adjacent to occupied public areas.
2. **Medium (Recommended)**: Balanced flow for primary concrete pulverizers and universal shears.
3. **Quick**: Fast boom response. Only recommended during ground-level rubble sorting.

---

## 3. Machine-Specific Cab Signature Controls

### 3.1 Attachment Hydraulic Flow (`tool_flow_rate`)
Controls the volume of oil delivered through the dedicated auxiliary circuits to the front attachment:
1. **Low Flow (Light Breakers & Hydraulic Hammers)**:
   - Optimized for piston-type hydraulic hammers and impact breakers.
   - Prevents hydraulic fluid cavitation and piston seal blowouts.
2. **Medium Flow (Universal Processors & Pulverizers)**:
   - Delivers moderate flow and high pressure to secondary concrete crushers.
   - Ideal for separating rebar from demolished slab sections on the ground.
3. **High Flow (Heavy Hydraulic Concrete Shears)**:
   - Delivers full dual-pump auxiliary flow (500+ L/min) to massive steel and concrete shears (e.g. Cat S3050).
   - Provides the cutting speed needed to chew through reinforced structural columns within job schedules.

### 3.2 Tool Work Duty Cycle (`duty_cycle_pct`)
Controls the ratio of active tool hammering/shearing versus hydraulic rest intervals:
- **Tuning Range**: 65% to 100% (Default: 85%).
- **Cautious (65%–75%)**: Recommended during hot weather or when operating high-hour (5+ year old) machinery to prevent thermal oil breakdown.
- **Steady (80%–85%)**: Industry best practice. Provides 8.5 minutes of active cutting out of every 10 minutes, allowing hydraulic oil to circulate through the oil coolers.
- **Continuous (95%–100%)**:
  - DANGER on older machines: Continuous hammering without rest intervals superheats the hydraulic oil above 95°C, destroys cylinder wiper seals, and trips hydraulic relief alarms.

---

## 4. Integrated Caterpillar Smart Technology

### 4.1 Cat Hydraulic Relief Thermal Protection
- Electronic pressure relief monitor that detects excessive back-pressure and oil temperature spikes.
- Automatically vents hydraulic circuits to the tank and sounds a cab alarm before cylinder packings rupture.

### 4.2 Cat Heavy Lift Mode
- Increases main hydraulic system pressure from 35,000 kPa to 38,000 kPa while reducing cylinder speed.
- Gives the operator maximum breakout and crane capacity when lowering heavy fallen structural steel beams to the ground.

### 4.3 High-Reach Stability Monitoring System
- Real-time sensors calculate the center of gravity and front tool payload weight.
- Displays color-coded stability margins on the cab monitor and automatically restricts boom lowering if tipping thresholds are approached.

---

## 5. Job Site Task Procedures & Operational Guidelines

### Task 1: 2-Story Reinforced Concrete Warehouse Demolition (Windy Conditions)
- **Objective**: Dismantle industrial concrete warehouse frame using high-flow shear in 35 km/h wind gusts within 90 minutes.
- **Optimal Configuration**:
  - Power Mode: **Smart**
  - Engine RPM: **1800 RPM**
  - Joystick Response: **Medium**
  - Attachment Flow: **High Flow**
  - Tool Duty Cycle: **85%**
  - Hydraulic Relief Protection: **ON**
- **Operator Technique**: Cut from the top down, one structural bay at a time. In windy weather, do not lift heavy severed concrete blocks high in the air; shear them in place and let rubble fall into the exclusion zone. Keep duty cycle at 85% to protect the 6-year-old machine's hydraulic cooler.

### Task 2: Heavy Concrete Foundation Pulverizing & Rebar Separation
- **Objective**: Process 600 tons of slab rubble on the ground to separate rebar from concrete.
- **Optimal Configuration**:
  - Power Mode: **Smart**
  - Engine RPM: **1750 RPM**
  - Joystick Response: **Medium**
  - Attachment Flow: **Medium Flow**
  - Tool Duty Cycle: **80%**
- **Operator Technique**: Rest the pulverizer jaws on the slab, crush concrete along rebar seams, and pull clean steel out for scrap loading.

---

## 6. Safety, Thermal Management & Environmental Protection
- **Wind Gust Precautions**: High-reach demolition attachments possess large surface areas. Operations must cease if wind gusts exceed 45 km/h.
- **Hydraulic Thermal Warning Response**: If the hydraulic temperature indicator reaches the red sector (>90°C), stop attachment hammering immediately. Idle engine at 1200 RPM for 3 minutes to allow the cooling fan to dissipate heat.
