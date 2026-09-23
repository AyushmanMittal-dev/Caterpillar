import React, { useState } from 'react';
import { ClipboardList, Play, CheckCircle2, Lock, Radio, Bluetooth, Wifi, Key, AlertCircle, ShieldAlert, Check } from 'lucide-react';

const INITIAL_TASKS = [
  {
    task_id: "TASK-101",
    title: "Commercial Foundation Earth Excavation",
    category: "Earth Excavation",
    priority: "HIGH",
    assigned_machine_id: "CAT-320-EXC-001",
    machine_model: "CAT 320 Next Gen Excavator",
    target_time_min: 60,
    status: "ASSIGNED", // ASSIGNED -> IN_PROGRESS -> PENDING_APPROVAL -> COMPLETED
    site: "Alpha Mining Sector - Trench 4B",
    description: "Excavate 450m³ of compacted clay for building foundation."
  },
  {
    task_id: "TASK-102",
    title: "Highway Embankment Conduit Trenching",
    category: "Trenching",
    priority: "HIGH",
    assigned_machine_id: "CAT-420-BKH-002",
    machine_model: "CAT 420 Backhoe Loader",
    target_time_min: 45,
    status: "ASSIGNED",
    site: "Highway 9 Sub-Base Expansion",
    description: "Dig 80m conduit trench along rainy roadside bank."
  },
  {
    task_id: "TASK-103",
    title: "Quarry Depot Haul Truck Loading",
    category: "Material Loading",
    priority: "MEDIUM",
    assigned_machine_id: "CAT-950-WLD-003",
    machine_model: "CAT 950M Wheel Loader",
    target_time_min: 30,
    status: "ASSIGNED",
    site: "Quarry Depot Aggregate Yard",
    description: "Load 12 haul trucks (25t each) with limestone."
  },
  {
    task_id: "TASK-104",
    title: "Highway Sub-Base Precision Finish Grading",
    category: "Grading",
    priority: "LOW",
    assigned_machine_id: "CAT-140-GRD-004",
    machine_model: "CAT 140 Motor Grader",
    target_time_min: 35,
    status: "ASSIGNED",
    site: "Commercial Foundation Sub-Grade",
    description: "Grade 1.2km sub-base to elevation tolerance ±5mm."
  }
];

export default function OperatorTaskWorkflow({ onTaskSelectAndConnect, activePairedTask, activePairedMachineId, onUnpair }) {
  const [taskList, setTaskList] = useState(() => {
    const saved = localStorage.getItem('cat_operator_task_list');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [selectedTask, setSelectedTask] = useState(null);

  // Sync with localStorage so re-renders retain status
  const updateTasks = (newTasks) => {
    setTaskList(newTasks);
    localStorage.setItem('cat_operator_task_list', JSON.stringify(newTasks));
  };
  
  // Connection Modal State
  const [connectMethod, setConnectMethod] = useState("bluetooth"); // "bluetooth" | "manual"
  const [inputMachineId, setInputMachineId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);

  // Check if any HIGH priority task is still incomplete
  const hasIncompleteHighPriority = taskList.some(
    (t) => t.priority === "HIGH" && t.status !== "COMPLETED" && t.status !== "PENDING_APPROVAL"
  );

  const handleStartTaskWorkflow = (task) => {
    if (activePairedMachineId && activePairedTask?.task_id !== task.task_id) {
      alert(`⚠️ ACTIVE TASK IN PROGRESS: You are currently paired to machine ${activePairedMachineId} for Task ${activePairedTask?.task_id}. Please complete or unpair your active task first!`);
      return;
    }

    if (task.priority !== "HIGH" && hasIncompleteHighPriority) {
      alert("⚠️ PRIORITY LOCK: You must complete all HIGH Priority admin tasks before starting Medium or Low priority tasks!");
      return;
    }
    setSelectedTask(task);
    setInputMachineId(task.assigned_machine_id);
    setConnectError(null);
  };

  const handlePairMachine = () => {
    if (!selectedTask) return;

    if (connectMethod === "manual" && inputMachineId.trim() !== selectedTask.assigned_machine_id) {
      setConnectError(`Machine ID mismatch! Assigned Machine for this task is ${selectedTask.assigned_machine_id}.`);
      return;
    }

    setIsConnecting(true);
    setConnectError(null);

    setTimeout(() => {
      setIsConnecting(false);
      
      const updated = taskList.map((t) => (t.task_id === selectedTask.task_id ? { ...t, status: "IN_PROGRESS" } : t));
      updateTasks(updated);
      
      const activeT = updated.find((t) => t.task_id === selectedTask.task_id) || selectedTask;
      setSelectedTask(null);
      
      alert(`✅ MACHINE CONNECTED: ${selectedTask.assigned_machine_id} paired via ${connectMethod.toUpperCase()}! Task status set to IN_PROGRESS.`);
      
      if (onTaskSelectAndConnect) {
        onTaskSelectAndConnect(activeT, selectedTask.assigned_machine_id);
      }
    }, 1200);
  };

  const handleCompleteTask = (taskId) => {
    const updated = taskList.map((t) => (t.task_id === taskId ? { ...t, status: "PENDING_APPROVAL" } : t));
    updateTasks(updated);
    alert("🚀 TASK SUBMITTED: Task completed! Status updated to 'PENDING APPROVAL BY ADMIN'. Alert dispatched to site supervisor.");
  };

  return (
    <div style={{ padding: '20px', color: '#e6edf3' }}>
      <div style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--cat-yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={24} /> Operator Task Dashboard & Dispatch Workflow
        </h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8b949e' }}>
          View admin-assigned tasks. HIGH priority tasks must be completed first before unlocking Medium/Low priority tasks.
        </p>
      </div>

      {/* Task List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {taskList.map((task) => {
          const isHighLocked = task.priority !== "HIGH" && hasIncompleteHighPriority && task.status === "ASSIGNED";
          return (
            <div
              key={task.task_id}
              style={{
                backgroundColor: '#161b22',
                border: `1px solid ${task.priority === 'HIGH' ? 'rgba(218, 54, 51, 0.5)' : '#30363d'}`,
                borderLeft: `5px solid ${task.priority === 'HIGH' ? '#da3633' : task.priority === 'MEDIUM' ? '#d29922' : '#58a6ff'}`,
                borderRadius: '8px',
                padding: '16px',
                opacity: isHighLocked ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: task.priority === 'HIGH' ? 'rgba(218, 54, 51, 0.2)' : 'rgba(210, 153, 34, 0.2)',
                  color: task.priority === 'HIGH' ? '#ff7b72' : '#d29922'
                }}>
                  {task.priority} PRIORITY
                </span>

                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: task.status === 'COMPLETED' ? 'rgba(46, 160, 67, 0.2)' : task.status === 'PENDING_APPROVAL' ? 'rgba(210, 153, 34, 0.2)' : task.status === 'IN_PROGRESS' ? 'rgba(88, 166, 255, 0.2)' : '#21262d',
                  color: task.status === 'COMPLETED' ? '#3fb950' : task.status === 'PENDING_APPROVAL' ? '#d29922' : task.status === 'IN_PROGRESS' ? '#58a6ff' : '#8b949e'
                }}>
                  {task.status.replace("_", " ")}
                </span>
              </div>

              <h3 style={{ margin: '10px 0 4px 0', fontSize: '16px', color: '#fff' }}>
                {task.title}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#8b949e' }}>
                {task.description}
              </p>

              <div style={{ marginTop: '12px', fontSize: '12px', color: '#c9d1d9', display: 'flex', gap: '14px' }}>
                <span>🚜 <strong>Assigned Machine:</strong> {task.assigned_machine_id}</span>
                <span>⏱️ <strong>Target:</strong> {task.target_time_min}m</span>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                {task.status === "ASSIGNED" && (
                  <button
                    disabled={isHighLocked || (!!activePairedMachineId && activePairedTask?.task_id !== task.task_id)}
                    onClick={() => handleStartTaskWorkflow(task)}
                    style={{
                      backgroundColor: isHighLocked || (!!activePairedMachineId && activePairedTask?.task_id !== task.task_id) ? '#21262d' : 'var(--cat-yellow)',
                      color: isHighLocked || (!!activePairedMachineId && activePairedTask?.task_id !== task.task_id) ? '#8b949e' : '#000',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: isHighLocked || (!!activePairedMachineId && activePairedTask?.task_id !== task.task_id) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isHighLocked ? <Lock size={14} /> : activePairedMachineId ? <Lock size={14} /> : <Play size={14} />}
                    {isHighLocked ? 'Locked (Complete HIGH Tasks First)' : activePairedMachineId ? 'Locked (Task In Progress)' : 'Select & Pair Machine'}
                  </button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => handleCompleteTask(task.task_id)}
                    style={{
                      backgroundColor: '#238636',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={14} /> Mark Task Complete (Submit for Admin Approval)
                  </button>
                )}

                {task.status === "PENDING_APPROVAL" && (
                  <div style={{ fontSize: '12px', color: '#d29922', fontWeight: '600' }}>
                    ⏳ Submitted to Admin Console for Approval
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Machine Pairing Modal when Task Selected */}
      {selectedTask && (
        <div style={{
          backgroundColor: '#161b22',
          border: '2px solid var(--cat-yellow)',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--cat-yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={18} /> Pair Assigned Machine for {selectedTask.task_id}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#8b949e' }}>
            Machine assigned by Admin: <strong>{selectedTask.assigned_machine_id}</strong> ({selectedTask.machine_model})
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            <button
              onClick={() => setConnectMethod("bluetooth")}
              style={{
                backgroundColor: connectMethod === "bluetooth" ? 'var(--cat-yellow)' : '#0d1117',
                color: connectMethod === "bluetooth" ? '#000' : '#c9d1d9',
                border: '1px solid #30363d',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bluetooth size={14} /> Connect via Bluetooth Pairing
            </button>

            <button
              onClick={() => setConnectMethod("manual")}
              style={{
                backgroundColor: connectMethod === "manual" ? 'var(--cat-yellow)' : '#0d1117',
                color: connectMethod === "manual" ? '#000' : '#c9d1d9',
                border: '1px solid #30363d',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Key size={14} /> Enter Machine ID Code
            </button>
          </div>

          {connectMethod === "manual" && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Enter Machine Serial/ID Code:</label>
              <input
                type="text"
                value={inputMachineId}
                onChange={(e) => setInputMachineId(e.target.value)}
                style={{ width: '300px', padding: '8px', backgroundColor: '#0d1117', color: '#fff', border: '1px solid #30363d', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
          )}

          {connectError && (
            <div style={{ marginTop: '10px', color: '#ff7b72', fontSize: '12px', fontWeight: '600' }}>
              ⚠️ {connectError}
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePairMachine}
              style={{
                backgroundColor: '#238636',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {isConnecting ? 'Handshake in Progress...' : 'Confirm Pairing & Start Telemetry Data Collection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
