import React, { useState, useEffect } from 'react';
import { fetchTasks, fetchMachines, runSimulation } from './services/api';
import TaskSelector from './components/TaskSelector';
import MachineCard from './components/MachineCard';
import ParameterControls from './components/ParameterControls';
import TelemetryScreen from './components/TelemetryScreen';
import AssistantAdvice from './components/AssistantAdvice';
import OperatorChatBot from './components/OperatorChatBot';
import { ShieldCheck, HardHat } from 'lucide-react';

import OperatorTaskWorkflow from './components/OperatorTaskWorkflow';
import MachineConnectTab from './components/MachineConnectTab';
import SafetyTelemetryHarness from './components/SafetyTelemetryHarness';

const CATEGORIES = [
  { id: 'Earth Excavation', label: 'Excavation', machineCode: 'CAT 320' },
  { id: 'Trenching', label: 'Trenching', machineCode: 'CAT 420' },
  { id: 'Material Loading', label: 'Loading', machineCode: 'CAT 950M' },
  { id: 'Grading', label: 'Grading', machineCode: 'CAT 140' },
  { id: 'Demolition', label: 'Demolition', machineCode: 'CAT 349' }
];

function getDefaultParametersForMachine(machine) {
  const base = {
    power_mode: 'Smart',
    engine_rpm: machine?.rpm_range?.default || 1750,
    hydraulic_response: 'Medium',
    assist_tech_enabled: true
  };
  if (machine?.cab_controls) {
    machine.cab_controls.forEach((ctrl) => {
      base[ctrl.id] = ctrl.default;
    });
  }
  return base;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Earth Excavation');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [currentMachine, setCurrentMachine] = useState(null);

  // Global Machine Pairing & Active Workflow State
  const [pairedTask, setPairedTask] = useState(null); // Active task paired with machine
  const [pairedMachineId, setPairedMachineId] = useState(null); // Active machine ID paired

  // Operator Tunable Cab Parameters
  const [parameters, setParameters] = useState({
    power_mode: 'Smart',
    engine_rpm: 1750,
    hydraulic_response: 'Medium',
    assist_tech_enabled: true
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Load initial catalog
  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, machinesData] = await Promise.all([
          fetchTasks(),
          fetchMachines()
        ]);
        setTasks(tasksData);
        setMachines(machinesData);

        if (tasksData.length > 0) {
          const firstTask = tasksData[0];
          setSelectedTaskId(firstTask.task_id);
          setSelectedCategory(firstTask.task_type);

          const machine = machinesData.find((m) => m.machine_id === firstTask.recommended_machine_id) || machinesData[0];
          setCurrentMachine(machine);
          setParameters(getDefaultParametersForMachine(machine));
        }
      } catch (err) {
        console.error(err);
        setApiError('Could not reach Cat Backend. Please ensure backend is running on port 8000.');
      }
    }
    loadData();
  }, []);

  // Filter tasks belonging to currently active category
  const categoryTasks = tasks.filter((t) => t.task_type === selectedCategory);
  const currentTask = tasks.find((t) => t.task_id === selectedTaskId) || categoryTasks[0];

  // Switch category
  const handleSelectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setSimulationResult(null);

    const matchingTasks = tasks.filter((t) => t.task_type === categoryName);
    if (matchingTasks.length > 0) {
      const nextTask = matchingTasks[0];
      setSelectedTaskId(nextTask.task_id);

      const matchingMachine = machines.find((m) => m.machine_id === nextTask.recommended_machine_id) || machines[0];
      if (matchingMachine) {
        setCurrentMachine(matchingMachine);
        setParameters(getDefaultParametersForMachine(matchingMachine));
      }
    }
  };

  // Switch mission inside the category
  const handleSelectMission = (taskId) => {
    setSelectedTaskId(taskId);
    setSimulationResult(null);

    const task = tasks.find((t) => t.task_id === taskId);
    if (task && machines.length > 0) {
      const machine = machines.find((m) => m.machine_id === task.recommended_machine_id) || currentMachine;
      setCurrentMachine(machine);
      setParameters(getDefaultParametersForMachine(machine));
    }
  };

  const handleResetParameters = () => {
    if (!currentMachine) return;
    setParameters(getDefaultParametersForMachine(currentMachine));
  };

  const handleLoadRecommended = () => {
    if (!currentTask || !currentMachine) return;
    const opt = currentTask.optimal_parameters;
    const nextParams = {
      power_mode: opt.power_mode,
      engine_rpm: opt.engine_rpm,
      hydraulic_response: opt.hydraulic_response,
      assist_tech_enabled: opt.assist_tech_enabled !== undefined ? opt.assist_tech_enabled : true
    };
    if (currentMachine?.cab_controls) {
      currentMachine.cab_controls.forEach((ctrl) => {
        if (opt[ctrl.id] !== undefined) {
          nextParams[ctrl.id] = opt[ctrl.id];
        } else {
          nextParams[ctrl.id] = ctrl.default;
        }
      });
    }
    setParameters(nextParams);
  };

  // Run test
  const handleSimulate = async () => {
    if (!currentMachine || !currentTask) return;
    setIsLoading(true);
    setApiError(null);

    const payload = {
      task_id: currentTask.task_id,
      task_type: currentTask.task_type || 'Excavation',
      machine_id: currentMachine.machine_id,
      machine_type: currentMachine.category || 'Excavator',
      machine_model: currentMachine.machine_id.replace('-', '_'),
      power_mode: parameters.power_mode,
      engine_rpm: parameters.engine_rpm,
      hydraulic_response: parameters.hydraulic_response,
      assist_tech_enabled: parameters.assist_tech_enabled,
      weather: parameters.weather || 'Sunny',
      ground_condition: parameters.ground_condition || 'Dry',
      planned_time_min: parameters.planned_time_min || currentTask.target_time_min || 60,
      machine_age_years: currentTask.machine_age_years || 2.0,
      engine_hours: currentTask.engine_hours || 1200
    };

    if (currentMachine?.cab_controls) {
      currentMachine.cab_controls.forEach((ctrl) => {
        if (parameters[ctrl.id] !== undefined) {
          payload[ctrl.id] = parameters[ctrl.id];
        }
      });
    }

    try {
      const [res] = await Promise.all([
        runSimulation(payload),
        new Promise((resolve) => setTimeout(resolve, 500))
      ]);
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Simulation test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const [activeView, setActiveView] = useState('workflow'); // 'workflow' | 'harness' | 'simulator' | 'connect'

  const handleTaskConnectTransition = (task, machineId) => {
    setPairedTask(task);
    setPairedMachineId(machineId);

    // Lock selected machine to the paired machine if found in catalog
    const matched = machines.find((m) => m.machine_id === machineId || m.name.includes(machineId.split('-')[1] || ''));
    if (matched) {
      setCurrentMachine(matched);
    }
    setActiveView('harness'); // Transition to telemetry screen once paired
  };

  return (
    <div className="cab-container">
      {/* Header with Navigation View Switcher */}
      <header className="cab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cab-brand">
          <div className="cat-logo">CAT</div>
          <div className="cab-title">
            <h1>Caterpillar Intelligent Operator Platform</h1>
            <p>Digital Twin Simulation & Safety Telemetry Suite</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Persistent Call Admin Escalation Button */}
          <button
            onClick={() => alert("🚨 EMERGENCY ADMIN CALL INITIATED: Alert dispatched to Site Supervisor & Admin Console via AWS Lambda Pipeline.")}
            style={{
              backgroundColor: '#da3633',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            📞 Call Admin
          </button>

          {/* 1st Tab: Operator Task Dashboard & Dispatch Workflow */}
          <button
            onClick={() => setActiveView('workflow')}
            style={{
              backgroundColor: activeView === 'workflow' ? 'var(--cat-yellow)' : '#21262d',
              color: activeView === 'workflow' ? '#000' : '#c9d1d9',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            📋 Operator Task Dashboard
          </button>

          {/* 2nd Tab: Real-Time Safety & Sensor Telemetry Harness */}
          <button
            onClick={() => setActiveView('harness')}
            style={{
              backgroundColor: activeView === 'harness' ? 'var(--cat-yellow)' : '#21262d',
              color: activeView === 'harness' ? '#000' : '#c9d1d9',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🛡️ Real-Time Safety Telemetry
          </button>

          {/* 3rd Tab: Digital Twin Simulator & RAG Training Module */}
          <button
            onClick={() => setActiveView('simulator')}
            style={{
              backgroundColor: activeView === 'simulator' ? 'var(--cat-yellow)' : '#21262d',
              color: activeView === 'simulator' ? '#000' : '#c9d1d9',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🎓 Digital Twin & RAG Learning
          </button>

          {/* Machine Fleet Hub */}
          <button
            onClick={() => setActiveView('connect')}
            style={{
              backgroundColor: activeView === 'connect' ? 'var(--cat-yellow)' : '#21262d',
              color: activeView === 'connect' ? '#000' : '#c9d1d9',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            📡 Fleet Connect Hub
          </button>
        </div>
      </header>

      {/* Error alert if any */}
      {apiError && (
        <div style={{
          backgroundColor: 'rgba(218, 54, 51, 0.15)',
          border: '1px solid rgba(218, 54, 51, 0.4)',
          color: '#ff7b72',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px'
        }}>
          {apiError}
        </div>
      )}

      {/* Active Machine Lock Banner */}
      {pairedMachineId && (
        <div style={{
          backgroundColor: 'rgba(210, 153, 34, 0.15)',
          border: '1px solid var(--cat-yellow)',
          color: 'var(--cat-yellow)',
          padding: '8px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            🔒 <strong>ACTIVE MACHINE LOCK:</strong> Paired to <strong>{pairedMachineId}</strong> for Task <strong>{pairedTask?.task_id || 'Active Task'}</strong> ({pairedTask?.status.replace('_', ' ') || 'IN PROGRESS'})
          </div>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to unpair from this machine? Active telemetry will stop.")) {
                setPairedMachineId(null);
                setPairedTask(null);
              }
            }}
            style={{
              backgroundColor: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Unpair Machine
          </button>
        </div>
      )}

      {activeView === 'workflow' ? (
        <OperatorTaskWorkflow
          onTaskSelectAndConnect={handleTaskConnectTransition}
          activePairedTask={pairedTask}
          activePairedMachineId={pairedMachineId}
          onUnpair={() => {
            setPairedMachineId(null);
            setPairedTask(null);
          }}
        />
      ) : activeView === 'harness' ? (
        <SafetyTelemetryHarness activeMachineId={pairedMachineId} activeTask={pairedTask} />
      ) : activeView === 'connect' ? (
        <MachineConnectTab activeMachineId={pairedMachineId} />
      ) : (
        <>
          {/* Category Tabs: Excavation, Trenching, Loading, Grading, Demolition */}
          <div className="category-nav">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`category-tab ${isActive ? 'active' : ''}`}
                >
                  <div>{cat.label}</div>
                  <div style={{ fontSize: '11px', opacity: isActive ? 0.9 : 0.6, marginTop: '2px' }}>
                    {cat.machineCode}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mission Selector Bar */}
          <div className="mission-bar">
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--cat-yellow)', whiteSpace: 'nowrap', marginRight: '6px' }}>
              Choose Mission:
            </span>
            {categoryTasks.map((t) => {
              const isSelected = t.task_id === currentTask?.task_id;
              return (
                <button
                  key={t.task_id}
                  onClick={() => handleSelectMission(t.task_id)}
                  className={`mission-btn ${isSelected ? 'active' : ''}`}
                >
                  Mission #{t.mission_number}: {t.title.split(' ')[0]} {t.title.split(' ')[1] || ''}
                </button>
              );
            })}
          </div>

          {/* 2-Column Minimalist Cab Layout */}
          <div className="cab-grid">
            {/* Left Column: Briefing, Machine, and Controls */}
            <div>
              <TaskSelector currentTask={currentTask} />

              <MachineCard
                machine={currentMachine}
                machineAge={currentTask?.machine_age_years || 2}
              />

              <ParameterControls
                parameters={parameters}
                onChange={setParameters}
                onSimulate={handleSimulate}
                onReset={handleResetParameters}
                onLoadRecommended={handleLoadRecommended}
                machine={currentMachine}
                isLoading={isLoading}
              />
            </div>

            {/* Right Column: Outcomes & Co-Pilot Advice */}
            <div>
              <TelemetryScreen
                simulationResult={simulationResult}
                isRunning={isLoading}
                targetTime={currentTask?.target_time_min || 60}
                benchmarkTime={currentTask?.actual_benchmark_min || 58}
              />

              <AssistantAdvice
                simulationResult={simulationResult}
                currentTask={currentTask}
              />
            </div>
          </div>

          {/* Floating Bottom-Right Operator RAG Chatbot */}
          <OperatorChatBot
            currentMachine={currentMachine}
            currentTask={currentTask}
          />
        </>
      )}
    </div>
  );
}
