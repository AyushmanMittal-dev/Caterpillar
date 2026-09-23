import React, { useState, useEffect } from 'react';
import { fetchPreTaskETA, sendTelemetryTick } from '../services/api';
import { Radio, Wifi, ShieldAlert, ShieldCheck, AlertOctagon, Activity, Clock, Cpu, Server, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

const DUMMY_FLEET_MACHINES = {
  "CAT-320-EXC-001": {
    machine_id: "CAT-320-EXC-001",
    model: "CAT 320 Next Gen Excavator",
    machine_type: "Excavator",
    serial: "CAT320-2024-8841",
    job_site: "Alpha Mining Sector - Trench 4B",
    operator: "John Doe (ID: OP-4921)",
    operator_skill: "Expert",
    machine_age_years: 2.0,
    engine_hours: 1420,
    planned_task: "Deep Trench Excavation",
    planned_time_min: 60.0,
    live_telemetry: {
      engine_load_pct: 74.5,
      machine_speed_kmh: 8.2,
      fuel_rate_l_hr: 17.8,
      engine_temperature_c: 88.0,
      idle_status: 0,
      idle_duration_min: 0.0,
      seatbelt_status: 1,
      object_distance_m: 6.5,
      proximity_event: 0,
      harsh_operation_event: 0,
      drowsiness_status: 0,
      mechanical_strain_risk: 0,
      active_violation_count: 0
    }
  },
  "CAT-420-BKH-002": {
    machine_id: "CAT-420-BKH-002",
    model: "CAT 420 Backhoe Loader",
    machine_type: "Backhoe Loader",
    serial: "CAT420-2022-3109",
    job_site: "Highway 9 Sub-Base Expansion",
    operator: "Mike Smith (ID: OP-1048)",
    operator_skill: "Intermediate",
    machine_age_years: 4.0,
    engine_hours: 3210,
    planned_task: "Roadside Conduit Trenching",
    planned_time_min: 45.0,
    live_telemetry: {
      engine_load_pct: 88.0,
      machine_speed_kmh: 14.5,
      fuel_rate_l_hr: 21.4,
      engine_temperature_c: 94.5,
      idle_status: 0,
      idle_duration_min: 0.0,
      seatbelt_status: 1,
      object_distance_m: 4.8,
      proximity_event: 0,
      harsh_operation_event: 1,
      drowsiness_status: 0,
      mechanical_strain_risk: 1,
      active_violation_count: 1
    }
  },
  "CAT-950-WLD-003": {
    machine_id: "CAT-950-WLD-003",
    model: "CAT 950M Wheel Loader",
    machine_type: "Wheel Loader",
    serial: "CAT950-2023-7721",
    job_site: "Quarry Depot - Aggregate Yard",
    operator: "Sarah Jenkins (ID: OP-8812)",
    operator_skill: "Beginner",
    machine_age_years: 3.0,
    engine_hours: 2150,
    planned_task: "Haul Truck Aggregate Loading",
    planned_time_min: 30.0,
    live_telemetry: {
      engine_load_pct: 95.0,
      machine_speed_kmh: 18.0,
      fuel_rate_l_hr: 26.5,
      engine_temperature_c: 101.2,
      idle_status: 0,
      idle_duration_min: 0.0,
      seatbelt_status: 0, // Unbuckled!
      object_distance_m: 2.5, // Proximity hazard!
      proximity_event: 1,
      harsh_operation_event: 1,
      drowsiness_status: 1, // Drowsy!
      mechanical_strain_risk: 1,
      active_violation_count: 3
    }
  },
  "CAT-140-GRD-004": {
    machine_id: "CAT-140-GRD-004",
    model: "CAT 140 Motor Grader",
    machine_type: "Motor Grader",
    serial: "CAT140-2021-5502",
    job_site: "Commercial Foundation Sub-Grade",
    operator: "Alex Vance (ID: OP-3391)",
    operator_skill: "Expert",
    machine_age_years: 5.0,
    engine_hours: 4890,
    planned_task: "Precision Sub-Base Grading",
    planned_time_min: 35.0,
    live_telemetry: {
      engine_load_pct: 52.0,
      machine_speed_kmh: 6.0,
      fuel_rate_l_hr: 13.2,
      engine_temperature_c: 82.5,
      idle_status: 0,
      idle_duration_min: 0.0,
      seatbelt_status: 1,
      object_distance_m: 15.0,
      proximity_event: 0,
      harsh_operation_event: 0,
      drowsiness_status: 0,
      mechanical_strain_risk: 0,
      active_violation_count: 0
    }
  }
};

export default function MachineConnectTab({ activeMachineId }) {
  const [selectedMachineId, setSelectedMachineId] = useState(activeMachineId || "CAT-320-EXC-001");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (activeMachineId && DUMMY_FLEET_MACHINES[activeMachineId]) {
      setSelectedMachineId(activeMachineId);
    }
  }, [activeMachineId]);

  const [etaData, setEtaData] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);

  const activeMachine = DUMMY_FLEET_MACHINES[selectedMachineId];

  // Connect to machine telemetry stream
  const handleConnectMachine = async (machineId) => {
    setIsConnecting(true);
    setIsConnected(false);
    setSelectedMachineId(machineId);

    const m = DUMMY_FLEET_MACHINES[machineId];

    try {
      // Fetch Module 1 ETA & Module 2 Telemetry in parallel
      const [etaRes, telemetryRes] = await Promise.all([
        fetchPreTaskETA({
          task_type: "Excavation",
          machine_type: m.machine_type,
          machine_model: "CAT_320",
          planned_time_min: m.planned_time_min,
          machine_age_years: m.machine_age_years,
          engine_hours: m.engine_hours,
          weather: "Sunny",
          ground_condition: "Dry"
        }),
        sendTelemetryTick({
          session_id: m.machine_id,
          ...m.live_telemetry
        }),
        new Promise((resolve) => setTimeout(resolve, 800)) // Mock connection handshake latency
      ]);

      setEtaData(etaRes);
      setTelemetryData(telemetryRes);
      setIsConnected(true);
    } catch (err) {
      console.error("Machine connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    handleConnectMachine("CAT-320-EXC-001");
  }, []);

  const [sosState, setSosState] = useState(null); // 'acknowledged' | 'help'
  const [fatigueAlertCount, setFatigueAlertCount] = useState(3); // Mock fatigue count >= 3
  const [showFatigueNudge, setShowFatigueNudge] = useState(true);

  const risk = telemetryData?.risk_level || "Low";

  // Feature #2 Explainability Line Helper
  const getExplainabilityReason = () => {
    if (!telemetryData || risk === "Low") return null;
    const v = telemetryData.active_violations || [];
    if (v.length > 0) return v.join(" • ");
    if (activeMachine.live_telemetry.seatbelt_status === 0) return "Seatbelt unfastened in cab";
    if (activeMachine.live_telemetry.drowsiness_status === 1) return "Operator fatigue / drowsiness detected";
    if (activeMachine.live_telemetry.object_distance_m <= 4.0) return `Imminent obstacle collision (${activeMachine.live_telemetry.object_distance_m}m away)`;
    if (activeMachine.live_telemetry.engine_temperature_c >= 90.0) return `High engine hydraulic temperature (${activeMachine.live_telemetry.engine_temperature_c}°C)`;
    return "Elevated mechanical stress & engine load";
  };

  const reasonLine = getExplainabilityReason();

  return (
    <div style={{ padding: '20px', color: '#e6edf3' }}>
      {/* Feature #6: Shift Handover Summary Card */}
      <div style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderLeft: '4px solid var(--cat-yellow)',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '16px',
        fontSize: '13px'
      }}>
        <div style={{ fontWeight: '700', color: 'var(--cat-yellow)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={16} /> Shift Handover Summary — {activeMachine?.operator} logged in
        </div>
        <div style={{ color: '#c9d1d9' }}>
          • <strong>Last Shift Completed:</strong> 3 excavation cycles (Foundation Alpha) &bull; 
          <strong> Pending Tasks:</strong> 1 Trenching Mission (#T002) &bull; 
          <strong> Open Safety Flags:</strong> {telemetryData?.active_violations?.length || 0} active flags on machine
        </div>
      </div>

      {/* Feature #4: Fatigue-Break Nudge Card */}
      {showFatigueNudge && activeMachine.live_telemetry.drowsiness_status === 1 && (
        <div style={{
          backgroundColor: 'rgba(210, 153, 34, 0.15)',
          border: '1px solid rgba(210, 153, 34, 0.4)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          color: '#d29922',
          fontSize: '13px'
        }}>
          <div>
            <strong>⚠️ Fatigue Alert Nudge:</strong> You have accumulated {fatigueAlertCount} drowsiness alerts this shift. Please consider taking a 15-minute rest break.
          </div>
          <button
            onClick={() => setShowFatigueNudge(false)}
            style={{
              backgroundColor: '#21262d',
              border: '1px solid #30363d',
              color: '#c9d1d9',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Machine ID Selection Header */}
      <div style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--cat-yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={24} /> Telematics & Machine ID Connection Hub
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8b949e' }}>
              Select a Caterpillar Machine ID from the active fleet to pair and stream live telematic diagnostics.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8b949e' }}>Connection Status:</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isConnected ? 'rgba(46, 160, 67, 0.2)' : 'rgba(218, 54, 51, 0.2)',
              border: `1px solid ${isConnected ? '#3fb950' : '#ff7b72'}`,
              color: isConnected ? '#3fb950' : '#ff7b72',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12px'
            }}>
              <Wifi size={14} />
              {isConnecting ? 'CONNECTING HANDSHAKE...' : isConnected ? 'PAIRED & STREAMING' : 'DISCONNECTED'}
            </div>
          </div>
        </div>

        {/* Fleet Select Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
          {Object.keys(DUMMY_FLEET_MACHINES).map((mid) => {
            const isSelected = selectedMachineId === mid;
            const m = DUMMY_FLEET_MACHINES[mid];
            return (
              <button
                key={mid}
                onClick={() => handleConnectMachine(mid)}
                style={{
                  backgroundColor: isSelected ? 'rgba(218, 165, 32, 0.15)' : '#0d1117',
                  border: `2px solid ${isSelected ? 'var(--cat-yellow)' : '#30363d'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? 'var(--cat-yellow)' : '#e6edf3' }}>
                  {m.machine_id}
                </div>
                <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '2px' }}>
                  {m.model}
                </div>
                <div style={{ fontSize: '11px', color: '#58a6ff', marginTop: '4px' }}>
                  Operator: {m.operator.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Connected Dashboard */}
      {isConnected && activeMachine && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Column: Machine & Operator Telematics Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Machine Identification Profile */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--cat-yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={16} /> Connected Machine Specs & Operator Metadata
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e', fontSize: '11px' }}>Machine Model</div>
                  <div style={{ fontWeight: '700', color: '#fff' }}>{activeMachine.model}</div>
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e', fontSize: '11px' }}>Serial Number</div>
                  <div style={{ fontWeight: '700', color: '#58a6ff' }}>{activeMachine.serial}</div>
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e', fontSize: '11px' }}>Assigned Job Site</div>
                  <div style={{ fontWeight: '600', color: '#e6edf3' }}>{activeMachine.job_site}</div>
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e', fontSize: '11px' }}>Active Operator</div>
                  <div style={{ fontWeight: '600', color: '#3fb950' }}>{activeMachine.operator}</div>
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e', fontSize: '11px' }}>Machine Age & Engine Hours</div>
                  <div style={{ fontWeight: '600', color: '#e6edf3' }}>{activeMachine.machine_age_years} yrs ({activeMachine.engine_hours} hrs)</div>
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e', fontSize: '11px' }}>Operator Skill Level</div>
                  <div style={{ fontWeight: '600', color: '#e6edf3' }}>{activeMachine.operator_skill}</div>
                </div>
              </div>
            </div>

            {/* Module 1 Baseline Pre-Task ETA Card */}
            {etaData && (
              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--cat-yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} /> Module 1: Pre-Task Task ETA Engine
                </h3>

                <div style={{ backgroundColor: '#0d1117', padding: '14px', borderRadius: '6px', borderLeft: '4px solid var(--cat-yellow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8b949e' }}>
                    <span>Assigned Mission: {activeMachine.planned_task}</span>
                    <span>Planned Target: {activeMachine.planned_time_min} min</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--cat-yellow)' }}>
                      {etaData.revised_eta_min} min
                    </span>
                    <span style={{ fontSize: '13px', color: etaData.predicted_delta_min > 0 ? '#d29922' : '#58a6ff' }}>
                      ({etaData.predicted_delta_min > 0 ? `+${etaData.predicted_delta_min}` : etaData.predicted_delta_min}m XGBoost delta)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Module 2 Sensor Telemetry Card & Violation Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Visual Risk Card */}
            <div style={{
              backgroundColor: '#161b22',
              border: `2px solid ${risk === 'High' ? '#da3633' : risk === 'Medium' ? '#d29922' : '#238636'}`,
              borderRadius: '8px',
              padding: '20px'
            }}>
              <div style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Module 2 Real-Time Telematic Risk Output
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px' }}>
                {risk === 'High' ? (
                  <ShieldAlert size={48} color="#da3633" />
                ) : risk === 'Medium' ? (
                  <AlertOctagon size={48} color="#d29922" />
                ) : (
                  <ShieldCheck size={48} color="#238636" />
                )}
                <div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: risk === 'High' ? '#ff7b72' : risk === 'Medium' ? '#d29922' : '#3fb950' }}>
                    {risk.toUpperCase()} RISK
                  </div>
                  <div style={{ fontSize: '13px', color: '#8b949e' }}>
                    Machine Stream: {activeMachine.machine_id}
                  </div>
                </div>
              </div>

              {/* Feature #2: Plain-Language Explainability Line */}
              {reasonLine && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: risk === 'High' ? '#ff7b72' : '#d29922',
                  backgroundColor: '#0d1117',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${risk === 'High' ? '#da3633' : '#d29922'}`
                }}>
                  🔍 Primary Cause: {reasonLine}
                </div>
              )}

              {/* Feature #1: SOS / Acknowledge Button for Amber or Red Risk */}
              {risk !== 'Low' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
                  <button
                    onClick={() => setSosState('acknowledged')}
                    style={{
                      backgroundColor: sosState === 'acknowledged' ? '#238636' : '#21262d',
                      border: `1px solid ${sosState === 'acknowledged' ? '#3fb950' : '#30363d'}`,
                      color: sosState === 'acknowledged' ? '#fff' : '#c9d1d9',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {sosState === 'acknowledged' ? '✅ Acknowledged, Continuing' : 'Acknowledge Risk'}
                  </button>

                  <button
                    onClick={() => {
                      setSosState('help');
                      alert("🚨 SOS EMERGENCY: Escalated to Admin Console & Nearby Equipment Operators via AWS Lambda pipeline!");
                    }}
                    style={{
                      backgroundColor: '#da3633',
                      border: 'none',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🚨 NEED HELP (SOS)
                  </button>
                </div>
              )}

              {/* Sensor Parameters Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '16px', fontSize: '12px' }}>
                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e' }}>Engine Load</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                    {activeMachine.live_telemetry.engine_load_pct}%
                  </div>
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e' }}>Engine Temp</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: activeMachine.live_telemetry.engine_temperature_c >= 95 ? '#ff7b72' : '#3fb950' }}>
                    {activeMachine.live_telemetry.engine_temperature_c} °C
                  </div>
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: '#8b949e' }}>Obstacle Dist</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: activeMachine.live_telemetry.object_distance_m <= 4.0 ? '#ff7b72' : '#58a6ff' }}>
                    {activeMachine.live_telemetry.object_distance_m} m
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
