import React, { useState, useEffect } from 'react';
import { fetchPreTaskETA, sendTelemetryTick, resetTelemetryWindow } from '../services/api';
import { Shield, ShieldAlert, ShieldCheck, Activity, Wifi, WifiOff, Play, Square, AlertOctagon, UserX, Clock, Cpu, RotateCcw } from 'lucide-react';

export default function SafetyTelemetryHarness({ activeMachineId, activeTask }) {
  // Module 1 Parameters
  const [taskType, setTaskType] = useState(activeTask?.category || 'Earth Excavation');
  const [machineType, setMachineType] = useState(activeTask?.category?.includes('Trench') ? 'Backhoe Loader' : activeTask?.category?.includes('Loading') ? 'Wheel Loader' : activeTask?.category?.includes('Grading') ? 'Motor Grader' : 'Excavator');
  const [machineModel, setMachineModel] = useState(activeMachineId ? activeMachineId.replace(/-/g, '_') : 'CAT_320');
  const [plannedTime, setPlannedTime] = useState(activeTask?.target_time_min || 60);
  const [weather, setWeather] = useState('Sunny');
  const [ground, setGround] = useState('Dry');

  // Sync state if activeTask or activeMachineId props change
  useEffect(() => {
    if (activeTask) {
      setTaskType(activeTask.category || 'Earth Excavation');
      setPlannedTime(activeTask.target_time_min || 60);
      if (activeTask.category?.includes('Trench')) setMachineType('Backhoe Loader');
      else if (activeTask.category?.includes('Loading')) setMachineType('Wheel Loader');
      else if (activeTask.category?.includes('Grading')) setMachineType('Motor Grader');
      else setMachineType('Excavator');
    }
    if (activeMachineId) {
      setMachineModel(activeMachineId.replace(/-/g, '_'));
    }
  }, [activeMachineId, activeTask]);

  const [etaResult, setEtaResult] = useState(null);
  const [isEtaLoading, setIsEtaLoading] = useState(false);

  // Module 2 Sensor Telemetry Controls
  const [isStreaming, setIsStreaming] = useState(false);
  const [forceOffline, setForceOffline] = useState(false);
  const [engineLoad, setEngineLoad] = useState(65);
  const [speed, setSpeed] = useState(12);
  const [fuelRate, setFuelRate] = useState(16.5);
  const [engineTemp, setEngineTemp] = useState(85);
  const [seatbelt, setSeatbelt] = useState(1); // 1: Buckled, 0: Unbuckled
  const [drowsiness, setDrowsiness] = useState(0); // 0: Alert, 1: Drowsy
  const [objectDist, setObjectDist] = useState(12.0);

  const [telemetryResult, setTelemetryResult] = useState(null);
  const [tickCount, setTickCount] = useState(0);

  const handleResetBuffer = async () => {
    try {
      await resetTelemetryWindow();
      setTickCount(0);
      setTelemetryResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStream = async () => {
    if (!isStreaming) {
      // Clear buffer on fresh stream restart
      await handleResetBuffer();
    }
    setIsStreaming(!isStreaming);
  };

  // Run Module 1 baseline ETA calculation
  const handleCalculateETA = async () => {
    setIsEtaLoading(true);
    try {
      const res = await fetchPreTaskETA({
        task_type: taskType,
        machine_type: machineType,
        machine_model: machineModel,
        planned_time_min: Number(plannedTime),
        weather: weather,
        ground_condition: ground
      });
      setEtaResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEtaLoading(false);
    }
  };

  // Initial ETA calculation
  useEffect(() => {
    handleCalculateETA();
  }, [taskType, machineType, machineModel, plannedTime, weather, ground]);

  // Auto-play Scenario Simulation Script
  const [autoPlayMode, setAutoPlayMode] = useState(true);
  const [historyBuffer, setHistoryBuffer] = useState([]); // Stores history for sparkline
  const [incidentLogs, setIncidentLogs] = useState([
    { id: 1, time: '04:15:10', type: 'SHIFT_START', desc: 'Telemetry stream initialized for machine CAT-320', status: 'LOGGED_CLOUDTRAIL' }
  ]);
  const [voiceAlertToast, setVoiceAlertToast] = useState(null);

  // Dynamic revised ETA calculated based on cumulative risk & idle time
  const dynamicETA = etaResult?.revised_eta_min
    ? Math.round((etaResult.revised_eta_min + (drowsiness === 1 ? 8 : 0) + (objectDist <= 4 ? 12 : 0) + (engineLoad > 85 ? 5 : 0)) * 10) / 10
    : plannedTime;

  // Auto-Play Script Driver (Cycles through realistic site scenarios every 3 seconds)
  useEffect(() => {
    let scriptTimer = null;
    if (autoPlayMode && isStreaming) {
      scriptTimer = setInterval(() => {
        const step = tickCount % 20;
        if (step < 5) {
          // Normal Operation
          setEngineLoad(55 + Math.floor(Math.random() * 10));
          setObjectDist(12.0 + (Math.random() * 2 - 1));
          setSeatbelt(1);
          setDrowsiness(0);
          setEngineTemp(82);
        } else if (step < 10) {
          // Proximity Hazard Warning
          setObjectDist(3.5);
          setEngineLoad(88);
          setEngineTemp(92);
        } else if (step < 15) {
          // Drowsiness & Fatigue Breach
          setDrowsiness(1);
          setSeatbelt(1);
          setObjectDist(8.0);
        } else {
          // Recovery back to normal
          setObjectDist(14.0);
          setDrowsiness(0);
          setEngineLoad(60);
          setEngineTemp(85);
        }
      }, 3000);
    }
    return () => {
      if (scriptTimer) clearInterval(scriptTimer);
    };
  }, [autoPlayMode, isStreaming, tickCount]);

  // Telemetry Stream Interval (Pushes tick every 1.5s when toggled)
  useEffect(() => {
    let interval = null;
    if (isStreaming) {
      interval = setInterval(async () => {
        setTickCount((prev) => prev + 1);

        const loadJitter = Math.min(100, Math.max(20, engineLoad + (Math.random() * 4 - 2)));
        const tempJitter = Math.min(115, Math.max(60, engineTemp + (Math.random() * 2 - 1)));

        try {
          const res = await sendTelemetryTick({
            session_id: 'harness_demo_session',
            engine_load_pct: Number(loadJitter.toFixed(1)),
            machine_speed_kmh: Number(speed),
            fuel_rate_l_hr: Number(fuelRate),
            engine_temperature_c: Number(tempJitter.toFixed(1)),
            idle_status: engineLoad < 30 ? 1 : 0,
            idle_duration_min: engineLoad < 30 ? 2.5 : 0.0,
            seatbelt_status: Number(seatbelt),
            object_distance_m: Number(objectDist),
            proximity_event: objectDist < 4.0 ? 1 : 0,
            harsh_operation_event: engineLoad > 90 ? 1 : 0,
            drowsiness_status: Number(drowsiness),
            force_offline: forceOffline
          });
          setTelemetryResult(res);

          // Update sparkline history
          setHistoryBuffer((prev) => {
            const next = [...prev, { temp: tempJitter, risk: res.risk_level === 'High' ? 100 : res.risk_level === 'Medium' ? 50 : 10 }];
            return next.slice(-25);
          });

          // Trigger Voice Alert & AWS CloudTrail Audit Log when risk is High or Medium
          if (res.risk_level === 'High' || res.risk_level === 'Medium') {
            const alertMsg = res.risk_level === 'High'
              ? `🚨 HIGH RISK BREACH: ${res.active_violations?.[0] || 'Proximity hazard'}! Voice alert dispatched to Cab Speaker & AWS SNS Lambda.`
              : `⚠️ WARNING: Elevated engine load & proximity warning (${objectDist}m).`;
            setVoiceAlertToast(alertMsg);

            // Log to incident audit trail
            setIncidentLogs((prevLogs) => [
              {
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                type: res.risk_level === 'High' ? 'CRITICAL_HAZARD' : 'WARNING',
                desc: res.active_violations?.join(' | ') || `Proximity ${objectDist}m hazard`,
                status: 'AWS_SNS_FANOUT_SENT'
              },
              ...prevLogs.slice(0, 14)
            ]);
          } else {
            setVoiceAlertToast(null);
          }
        } catch (err) {
          console.error('Telemetry tick error:', err);
        }
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, engineLoad, speed, fuelRate, engineTemp, seatbelt, drowsiness, objectDist, forceOffline]);

  const risk = telemetryResult?.risk_level || 'Low';
  const connStatus = telemetryResult?.connection_status || 'ONLINE';

  const [sosState, setSosState] = useState(null);
  const [fatigueAlertCount, setFatigueAlertCount] = useState(3);
  const [showFatigueNudge, setShowFatigueNudge] = useState(true);

  const getExplainabilityReason = () => {
    if (!telemetryResult || risk === "Low") return null;
    const v = telemetryResult.active_violations || [];
    if (v.length > 0) return v.join(" • ");
    if (seatbelt === 0) return "Seatbelt unfastened for 12s in cab";
    if (drowsiness === 1) return "Operator fatigue / drowsiness detected";
    if (objectDist <= 4.0) return `Imminent obstacle collision (${objectDist}m away)`;
    if (engineTemp >= 90.0) return `High engine hydraulic temperature (${engineTemp}°C)`;
    return "Elevated mechanical strain & engine load";
  };

  const reasonLine = getExplainabilityReason();

  return (
    <div style={{ padding: '20px', color: '#e6edf3' }}>
      {/* Feature #4: Fatigue-Break Nudge Card */}
      {showFatigueNudge && drowsiness === 1 && (
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
            <strong>⚠️ Fatigue Alert Nudge:</strong> You've had repeated fatigue alerts ({fatigueAlertCount} this shift) — consider taking a 15-minute rest break.
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

      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--cat-yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} /> Module 1 & Module 2 Real-Time Telemetry Harness
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8b949e' }}>
            XGBoost Pre-Task Baseline ETA Estimator & In-Memory Rolling Window Safety Risk Classifier
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Autoplay Demo Scenario Toggle */}
          <button
            onClick={() => setAutoPlayMode(!autoPlayMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: autoPlayMode ? 'rgba(88, 166, 255, 0.2)' : '#21262d',
              border: `1px solid ${autoPlayMode ? '#58a6ff' : '#30363d'}`,
              color: autoPlayMode ? '#58a6ff' : '#c9d1d9',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            🎬 {autoPlayMode ? 'Autoplay Script: Active (Scenario Auto-cycle)' : 'Autoplay Script: Off (Manual Sliders)'}
          </button>

          <button
            onClick={() => setForceOffline(!forceOffline)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: forceOffline ? 'rgba(218, 54, 51, 0.2)' : 'rgba(46, 160, 67, 0.2)',
              border: `1px solid ${forceOffline ? '#ff7b72' : '#3fb950'}`,
              color: forceOffline ? '#ff7b72' : '#3fb950',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            {forceOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {forceOffline ? 'Simulating Cellular Dropout (Offline Fallback)' : 'Cloud Backend Connected (Online)'}
          </button>
        </div>
      </div>

      {/* Voice Alert Toast Banner */}
      {voiceAlertToast && (
        <div style={{
          backgroundColor: '#da3633',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(218,54,51,0.4)'
        }}>
          <div>🔊 {voiceAlertToast}</div>
          <button
            onClick={() => alert("🔊 AUDIO PLAYBACK: Playing synthetic audio alert: 'Warning — hazard detected, reduce throttle and apply service brake immediately!'")}
            style={{ backgroundColor: '#fff', color: '#da3633', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
          >
            ▶️ Listen Voice Alert
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* LEFT COLUMN: MODULE 1 & SENSOR CONTROLS */}
        <div>
          {/* Module 1 & Module 2 Dynamic Bridge: Recalculated ETA Card */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--cat-yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> Module 1 & 2 Bridge: Dynamic ETA Recalculator
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: '#8b949e', marginBottom: '4px' }}>Task Assignment</label>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)} style={{ width: '100%', padding: '6px', backgroundColor: '#0d1117', color: '#fff', border: '1px solid #30363d', borderRadius: '4px' }}>
                  <option value="Excavation">Excavation</option>
                  <option value="Trenching">Trenching</option>
                  <option value="Material Loading">Material Loading</option>
                  <option value="Demolition">Demolition</option>
                  <option value="Fine Grading">Fine Grading</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#8b949e', marginBottom: '4px' }}>Caterpillar Model</label>
                <select value={machineModel} onChange={(e) => setMachineModel(e.target.value)} style={{ width: '100%', padding: '6px', backgroundColor: '#0d1117', color: '#fff', border: '1px solid #30363d', borderRadius: '4px' }}>
                  <option value="CAT_320">CAT 320 Next Gen</option>
                  <option value="CAT_420">CAT 420 Backhoe</option>
                  <option value="CAT_950">CAT 950M Loader</option>
                  <option value="CAT_140">CAT 140 Grader</option>
                  <option value="CAT_349">CAT 349 Excavator</option>
                </select>
              </div>
            </div>

            {/* Dynamic ETA recalculation display based on telemetry */}
            <div style={{ marginTop: '14px', padding: '12px', backgroundColor: '#0d1117', borderRadius: '6px', borderLeft: '4px solid var(--cat-yellow)' }}>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Live Operational ETA (Recalculating with telemetry hazards)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: dynamicETA > plannedTime ? '#d29922' : 'var(--cat-yellow)' }}>
                  {dynamicETA} min
                </span>
                <span style={{ fontSize: '13px', color: '#8b949e' }}>
                  (Planned: {plannedTime}m &rarr; Revised: {dynamicETA}m)
                </span>
              </div>
              {dynamicETA > plannedTime && (
                <div style={{ fontSize: '11px', color: '#ff7b72', marginTop: '4px' }}>
                  ⚠️ +{(dynamicETA - plannedTime).toFixed(1)}m delay added due to active proximity slowdowns & fatigue breaks.
                </div>
              )}
            </div>
          </div>

          {/* Module 2: Telemetry Mock Controls */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={16} /> Real-Time Sensor Telemetry Controls
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleResetBuffer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#21262d',
                    color: '#c9d1d9',
                    border: '1px solid #30363d',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <RotateCcw size={13} /> Reset Buffer
                </button>

                <button
                  onClick={handleToggleStream}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isStreaming ? '#da3633' : '#238636',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}
                >
                  {isStreaming ? <Square size={14} /> : <Play size={14} />}
                  {isStreaming ? 'Stop Stream' : 'Start Sensor Stream (1.5s)'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e' }}>
                  <span>Engine Load</span> <strong>{engineLoad}%</strong>
                </label>
                <input type="range" min="20" max="100" value={engineLoad} onChange={(e) => setEngineLoad(Number(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e' }}>
                  <span>Engine Temperature</span> <strong>{engineTemp} °C</strong>
                </label>
                <input type="range" min="60" max="115" value={engineTemp} onChange={(e) => setEngineTemp(Number(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e' }}>
                  <span>Obstacle Proximity Distance</span> <strong>{objectDist} meters</strong>
                </label>
                <input type="range" min="1" max="25" step="0.5" value={objectDist} onChange={(e) => setObjectDist(Number(e.target.value))} style={{ width: '100%' }} />
              </div>

              {/* Safety Toggles & Drowsiness AI Camera Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => setSeatbelt(seatbelt === 1 ? 0 : 1)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${seatbelt === 0 ? '#ff7b72' : '#30363d'}`,
                    backgroundColor: seatbelt === 0 ? 'rgba(218, 54, 51, 0.2)' : '#0d1117',
                    color: seatbelt === 0 ? '#ff7b72' : '#8b949e',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  Seatbelt: {seatbelt === 1 ? 'Buckled ✅' : 'UNFASTENED ❌'}
                </button>

                <button
                  onClick={() => setDrowsiness(drowsiness === 1 ? 0 : 1)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${drowsiness === 1 ? '#ff7b72' : '#30363d'}`,
                    backgroundColor: drowsiness === 1 ? 'rgba(218, 54, 51, 0.2)' : '#0d1117',
                    color: drowsiness === 1 ? '#ff7b72' : '#8b949e',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  Operator: {drowsiness === 1 ? 'DROWSY / FATIGUED ⚠️' : 'Alert ✅'}
                </button>
              </div>

              {/* AI Camera Drowsiness Visualizer Box */}
              <div style={{
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '10px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '4px',
                  backgroundColor: drowsiness === 1 ? 'rgba(218, 54, 51, 0.3)' : 'rgba(46, 160, 67, 0.2)',
                  border: `1px solid ${drowsiness === 1 ? '#ff7b72' : '#3fb950'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  📷
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                    In-Cab Vision AI Subsystem: {drowsiness === 1 ? 'FATIGUE BREACH DETECTED' : 'EYES ON ROAD'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>
                    Facial Mesh Confidence: <strong>{drowsiness === 1 ? '94.2% (Drowsy)' : '12.0% (Normal)'}</strong> &bull; PERCLOS Score: {drowsiness === 1 ? '0.42' : '0.08'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ROLLING WINDOW TICKS, SPARKLINE & INCIDENT AUDIT LOG */}
        <div>
          {/* Rolling Window Buffer Telemetry & Sparkline */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="#58a6ff" /> In-Memory Rolling Window Metrics (30-Sec Buffer)
              </h3>
              <span style={{ fontSize: '12px', fontWeight: '700', color: isStreaming ? '#3fb950' : '#8b949e' }}>
                {isStreaming ? '● STREAMING LIVE' : '○ PAUSED'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ backgroundColor: '#0d1117', padding: '12px', borderRadius: '6px', border: '1px solid #30363d' }}>
                <div style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600' }}>Buffered Ticks</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#58a6ff', marginTop: '2px' }}>
                  {telemetryResult?.rolling_window_metrics?.buffered_ticks || (tickCount % 30)} / 30
                </div>
              </div>

              <div style={{ backgroundColor: '#0d1117', padding: '12px', borderRadius: '6px', border: '1px solid #30363d' }}>
                <div style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600' }}>Avg Engine Load</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#e6edf3', marginTop: '2px' }}>
                  {telemetryResult?.rolling_window_metrics?.avg_engine_load_pct || engineLoad}%
                </div>
              </div>
            </div>

            {/* Sparkline Visualizer for Rolling Window Buffer */}
            <div style={{ marginTop: '12px', backgroundColor: '#0d1117', padding: '10px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '6px', fontWeight: '600' }}>
                📈 Real-Time Engine Temperature Sparkline (Last {historyBuffer.length} Ticks)
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '36px' }}>
                {historyBuffer.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#484f58' }}>Accumulating stream ticks...</div>
                ) : (
                  historyBuffer.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        backgroundColor: item.temp >= 95 ? '#da3633' : item.temp >= 88 ? '#d29922' : '#3fb950',
                        height: `${Math.min(100, Math.max(15, (item.temp - 60) * 1.8))}%`,
                        borderRadius: '2px'
                      }}
                      title={`Tick ${idx + 1}: ${item.temp.toFixed(1)}°C`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Visual Risk HUD Card */}
          <div style={{
            backgroundColor: '#161b22',
            border: `2px solid ${risk === 'High' ? '#da3633' : risk === 'Medium' ? '#d29922' : '#238636'}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Real-Time Operator HUD Risk Status
              </div>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0d1117', color: '#8b949e' }}>
                Ticks: {tickCount}
              </span>
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
                <div style={{ fontSize: '28px', fontWeight: '900', color: risk === 'High' ? '#ff7b72' : risk === 'Medium' ? '#d29922' : '#3fb950' }}>
                  {risk.toUpperCase()} RISK
                </div>
                <div style={{ fontSize: '13px', color: '#8b949e' }}>
                  Evaluator: {telemetryResult?.evaluator || 'Awaiting Sensor Stream...'}
                </div>
              </div>
            </div>

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
          </div>

          {/* Incident Audit Log & AWS CloudTrail Pipeline Box */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📋 AWS CloudTrail Incident Audit Log (Shift Telemetry)
            </h3>

            <div style={{ maxHeight: '140px', overflowY: 'auto', backgroundColor: '#0d1117', borderRadius: '6px', border: '1px solid #30363d', padding: '8px' }}>
              {incidentLogs.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#8b949e' }}>No incidents logged this shift.</div>
              ) : (
                incidentLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 0', borderBottom: '1px dashed #21262d' }}>
                    <span style={{ color: '#8b949e' }}>[{log.time}]</span>
                    <span style={{ color: log.type === 'CRITICAL_HAZARD' ? '#ff7b72' : log.type === 'WARNING' ? '#d29922' : '#58a6ff', fontWeight: '600' }}>
                      {log.type}
                    </span>
                    <span style={{ color: '#c9d1d9', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.desc}
                    </span>
                    <span style={{ color: '#3fb950', fontSize: '10px' }}>{log.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

