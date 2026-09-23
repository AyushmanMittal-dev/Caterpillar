import { useState } from "react";

// ==========================================
// TYPES
// ==========================================

type Priority = "Urgent" | "Normal";
type TaskStatus = "In Progress" | "Queued" | "Blocked" | "Completed";
type MachineStatus = "Active" | "Idle" | "Maintenance";

interface Report {
  submittedAt: string;
  hoursWorked: number;
  notes: string;
  outcome: string;
}

interface Task {
  id: number;
  title: string;
  machine: string;
  machineType: string;
  priority: Priority;
  status: TaskStatus;
  eta: string;
  zone: string;
  description: string;
  report?: Report;
}

interface FleetMachine {
  tag: string;
  model: string;
  type: string;
  fuelPct: number;
  hours: number;
  status: MachineStatus;
  operator: string;
  notes?: string;
}

// ==========================================
// DATA INVENTORY
// ==========================================

const INITIAL_FLEET: FleetMachine[] = [
  {
    tag: "320",
    model: "CAT-320",
    type: "Hydraulic Excavator",
    fuelPct: 82,
    hours: 6.5,
    status: "Active",
    operator: "James D.",
    notes: "Operating in Zone A · Foundation trenches"
  },
  {
    tag: "966",
    model: "CAT-966",
    type: "Wheel Loader",
    fuelPct: 61,
    hours: 2.0,
    status: "Idle",
    operator: "Unassigned",
    notes: "Standby in Stockpile Area B"
  },
  {
    tag: "D6",
    model: "CAT-D6",
    type: "Bulldozer",
    fuelPct: 45,
    hours: 0.0,
    status: "Maintenance",
    operator: "Tech Service",
    notes: "Scheduled hydraulic fluid & track inspection"
  },
  {
    tag: "140",
    model: "CAT-140",
    type: "Motor Grader",
    fuelPct: 74,
    hours: 4.2,
    status: "Active",
    operator: "Elena R.",
    notes: "Grading Road Section 4 · Blade pitch 42°"
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: "Excavate foundation — Zone A",
    machine: "CAT-320",
    machineType: "Hydraulic Excavator",
    priority: "Urgent",
    status: "In Progress",
    eta: "2h 30m",
    zone: "Zone A",
    description: "Dig foundation trenches to 3.5m depth. Follow survey markers. Watch for underground utilities on the east edge. Hydraulic load expected 65–75%."
  },
  {
    id: 2,
    title: "Load stockpile to trucks",
    machine: "CAT-966",
    machineType: "Wheel Loader",
    priority: "Normal",
    status: "Queued",
    eta: "1h 15m",
    zone: "Zone B",
    description: "Load excavated material from stockpile onto 4 waiting dump trucks. Target bucket fill utilization above 85%. Coordinate with truck drivers for timing."
  },
  {
    id: 3,
    title: "Fine grade road section 4",
    machine: "CAT-140",
    machineType: "Motor Grader",
    priority: "Urgent",
    status: "In Progress",
    eta: "3h 00m",
    zone: "Road Sec. 4",
    description: "Grade road surface to ±10mm tolerance. Blade pitch 38–48°. Maintain slow steady passes. Material is slightly damp — adjust pass count accordingly."
  },
  {
    id: 4,
    title: "Clear vegetation — Zone B",
    machine: "CAT-D6",
    machineType: "Bulldozer",
    priority: "Normal",
    status: "Blocked",
    eta: "—",
    zone: "Zone B",
    description: "Machine in maintenance. Task on hold until CAT-D6 is cleared by the service team. Do not start until green light from site supervisor."
  },
  {
    id: 5,
    title: "Trench utility line west",
    machine: "CAT-320",
    machineType: "Hydraulic Excavator",
    priority: "Normal",
    status: "Queued",
    eta: "4h 45m",
    zone: "West Perimeter",
    description: "Trench 120m utility corridor along western fence line. Depth 1.8m, width 0.6m. Blue survey flags mark the line. Soil is firm — expect normal dig cycles."
  }
];

// ==========================================
// ICONS
// ==========================================

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    alert: <><path d="m10.3 3.3 8.4 14.5c.8 1.4-.2 3.2-1.8 3.2H7.1c-1.6 0-2.6-1.8-1.8-3.2L13.7 3.3c.8-1.4 2.8-1.4 3.6 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    fuel: <><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" /><path d="M15 11h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9l-3-3" /><path d="M6 8h6" /></>,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    chevron: <path d="m6 9 6 6 6-6" />,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.info}
    </svg>
  );
}

// ==========================================
// MODAL FOR TASK DETAILS & REPORTING
// ==========================================

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSubmitReport: (id: number, report: Report) => void;
}

function TaskModal({ task, onClose, onSubmitReport }: TaskModalProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = hours.trim() && notes.trim() && outcome.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    const report: Report = {
      submittedAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      hoursWorked: parseFloat(hours),
      notes: notes.trim(),
      outcome: outcome.trim()
    };
    setSubmitted(true);
    setTimeout(() => {
      onSubmitReport(task.id, report);
      onClose();
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-[#DEDED6] my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Top Dark Bar */}
        <div className="bg-[#151513] text-white px-6 py-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${task.priority === "Urgent" ? "bg-[#D32F2F] text-white" : "bg-[#FFCB05] text-[#151513]"}`}>
                {task.priority}
              </span>
              <h2 className="text-lg font-bold tracking-tight">{task.title}</h2>
              <span className="text-gray-400 text-xs hidden sm:inline">({task.machine} · {task.zone})</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-colors">
              ✕
            </button>
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[11px] text-gray-400 font-semibold mr-1">Status:</span>
            {(["In Progress", "Queued", "Blocked"] as TaskStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${
                  status === s
                    ? "bg-[#FFCB05] text-[#151513]"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Content (Wider and Shorter) */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left: Task Details */}
            <div className="space-y-3">
              <div className="bg-[#F7F7F3] border border-[#DEDED6] rounded-xl p-4">
                <span className="text-[10px] font-bold text-[#6D6D66] uppercase tracking-wider block mb-1.5">Operational Instructions</span>
                <p className="text-xs text-[#151513] leading-relaxed">{task.description}</p>
              </div>

              <div className="bg-[#F7F7F3] border border-[#DEDED6] rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#6D6D66]">
                  <Icon name="clock" size={15} />
                  <span>Target duration:</span>
                </div>
                <strong className="text-[#151513] font-bold text-sm">{task.eta}</strong>
              </div>

              <div className="bg-[#F7F7F3] border border-[#DEDED6] rounded-xl p-3.5 flex items-center justify-between text-xs">
                <span className="text-[#6D6D66]">Assigned Machine:</span>
                <strong className="text-[#151513] font-bold">{task.machine} ({task.machineType})</strong>
              </div>
            </div>

            {/* Right: Operator Shift Report */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#6D6D66] uppercase tracking-wider block">Operator Shift Report</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#151513] block mb-1">Hours Logged</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full border border-[#DEDED6] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#FFCB05]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#151513] block mb-1">Outcome Status</label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full border border-[#DEDED6] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#FFCB05]"
                  >
                    <option value="">Select result…</option>
                    <option>Completed successfully</option>
                    <option>Partially completed</option>
                    <option>Delayed — Conditions</option>
                    <option>Delayed — Machine issue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#151513] block mb-1">Field Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Details of progress, trench depth, ground traction, or cycle efficiency…"
                  rows={2}
                  className="w-full border border-[#DEDED6] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#FFCB05] resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitted}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                  submitted
                    ? "bg-[#2D7A4F] text-white"
                    : canSubmit
                    ? "bg-[#FFCB05] text-[#151513] hover:bg-[#F2BF00] shadow-sm active:translate-y-0.5"
                    : "bg-[#EFEFEB] text-[#A1A19B] cursor-not-allowed"
                }`}
              >
                {submitted ? "✓ Shift Report Submitted" : "Submit Report & Close Task"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [fleet] = useState<FleetMachine[]>(INITIAL_FLEET);
  const [activeTab, setActiveTab] = useState<"fleet" | "tasks" | "history">("fleet");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const activeTasks = tasks.filter((t) => t.status !== "Completed");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  function handleSubmitReport(id: number, report: Report) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Completed", report } : t))
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F3] text-[#151513]">
      {/* Top Application Header */}
      <header className="h-[74px] bg-white/90 backdrop-blur-md border-b border-[#DEDED6] sticky top-0 z-30 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#FFCB05] flex items-center justify-center font-extrabold text-xl text-[#151513] shadow-sm relative">
            C
            <span className="absolute bottom-1.5 w-4 h-0.5 bg-[#151513] -rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-base font-bold tracking-tight text-[#151513]">CAT Operator</strong>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-[#FFF4B8] text-[#8B7000] rounded">
                Jobsite #402
              </span>
            </div>
            <p className="text-[11px] text-[#6D6D66] font-medium">North Pit Operations Dashboard</p>
          </div>
        </div>

        {/* Navigation Switcher */}
        <nav className="flex items-center bg-[#EFEFEB] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "fleet" ? "bg-white text-[#151513] shadow-sm" : "text-[#6D6D66] hover:text-[#151513]"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "tasks" ? "bg-white text-[#151513] shadow-sm" : "text-[#6D6D66] hover:text-[#151513]"
            }`}
          >
            Tasks
            {activeTasks.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FFCB05] text-[#151513] text-[10px] flex items-center justify-center font-extrabold">
                {activeTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "history" ? "bg-white text-[#151513] shadow-sm" : "text-[#6D6D66] hover:text-[#151513]"
            }`}
          >
            History
            {completedTasks.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#2D7A4F] text-white text-[10px] flex items-center justify-center font-bold">
                {completedTasks.length}
              </span>
            )}
          </button>
        </nav>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#151513]">James D.</p>
            <p className="text-[10px] text-[#2D7A4F] font-semibold">● Certified Expert</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#151513] text-[#FFCB05] flex items-center justify-center font-bold text-xs border-2 border-[#FFCB05]">
            JD
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 sm:px-10 py-8">
        {/* Dashboard Heading & 4 KPI Stat Cards (Only on Dashboard Page) */}
        {activeTab === "fleet" && (
          <>
            {/* Page Title & Greeting */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#151513]">Dashboard</h1>
              <p className="text-sm sm:text-base text-[#6D6D66] mt-1 font-medium">Good morning, James. Here’s your jobsite overview.</p>
            </div>

            {/* 4 Top KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Card 1: Active Machines (Bright CAT Yellow) */}
              <div className="bg-[#FFCB05] rounded-2xl p-5 shadow-sm border border-[#EAC000] flex flex-col justify-between min-h-[128px]">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#7C6300]">
                  Active Machines
                </p>
                <div>
                  <p className="text-4xl font-extrabold text-[#151513] leading-none mb-1">2</p>
                  <p className="text-xs font-semibold text-[#6E5800]">of 4 assigned</p>
                </div>
              </div>

              {/* Card 2: Tasks Today (White) */}
              <div className="bg-white rounded-2xl p-5 border border-[#DEDED6] shadow-sm flex flex-col justify-between min-h-[128px]">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#6D6D66]">
                  Tasks Today
                </p>
                <div>
                  <p className="text-4xl font-extrabold text-[#151513] leading-none mb-1">{tasks.length}</p>
                  <p className="text-xs font-semibold text-[#6D6D66]">{activeTasks.filter(t => t.status === 'In Progress').length} in progress</p>
                </div>
              </div>

              {/* Card 3: Shift Hours (White) */}
              <div className="bg-white rounded-2xl p-5 border border-[#DEDED6] shadow-sm flex flex-col justify-between min-h-[128px]">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#6D6D66]">
                  Shift Hours
                </p>
                <div>
                  <p className="text-4xl font-extrabold text-[#151513] leading-none mb-1">4.2h</p>
                  <p className="text-xs font-semibold text-[#6D6D66]">of 10h shift</p>
                </div>
              </div>

              {/* Card 4: Fuel Alerts (White) */}
              <div className="bg-white rounded-2xl p-5 border border-[#DEDED6] shadow-sm flex flex-col justify-between min-h-[128px]">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#6D6D66]">
                  Fuel Alerts
                </p>
                <div>
                  <p className="text-4xl font-extrabold text-[#151513] leading-none mb-1">1</p>
                  <p className="text-xs font-semibold text-[#C79200]">CAT-D6 low</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* FLEET SECTION (Directly implementing "Your Machine Fleet" card from the image) */}
        {activeTab === "fleet" && (
          <section className="bg-white border border-[#DEDED6] rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-[#DEDED6] flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#151513] tracking-tight">Your Machine Fleet</h2>
              <span className="text-xs font-semibold text-[#6D6D66] bg-[#F7F7F3] border border-[#DEDED6] px-2.5 py-1 rounded-full">
                {fleet.length} machines
              </span>
            </div>

            <div className="divide-y divide-[#EFEFEB]">
              {fleet.map((m) => {
                // Color mapping for fuel bars
                let fuelColor = "bg-[#2D7A4F]";
                if (m.fuelPct <= 50) fuelColor = "bg-[#FFCB05]";
                if (m.fuelPct <= 25) fuelColor = "bg-[#D32F2F]";

                // Badge styling
                let badgeClass = "bg-[#E7F3EC] text-[#2D7A4F] border-[#CDE5D7]";
                if (m.status === "Idle") badgeClass = "bg-[#FFF9DD] text-[#8B7000] border-[#EEDF9A]";
                if (m.status === "Maintenance") badgeClass = "bg-[#FDE8E8] text-[#D32F2F] border-[#F8B4B4]";

                return (
                  <div key={m.model} className="p-5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAFAF7] transition-colors">
                    {/* Machine Badge & Name */}
                    <div className="flex items-center gap-4 min-w-[240px]">
                      <div className="w-12 h-12 rounded-xl bg-[#151513] text-[#FFCB05] flex items-center justify-center font-extrabold text-sm tracking-tight flex-shrink-0 shadow-sm">
                        {m.tag}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-[#151513] leading-tight">{m.model}</h3>
                        <p className="text-xs text-[#6D6D66] mt-0.5 font-medium">{m.type}</p>
                      </div>
                    </div>

                    {/* Fuel Progress Bar */}
                    <div className="flex-1 max-w-md">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#6D6D66] font-semibold flex items-center gap-1.5">
                          Fuel
                        </span>
                        <span className="font-extrabold text-xs text-[#151513]">{m.fuelPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#EFEFEB] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${fuelColor}`}
                          style={{ width: `${m.fuelPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Hours Logged & Status Pill */}
                    <div className="flex items-center gap-6 justify-between md:justify-end min-w-[170px]">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#6D6D66] block">Hours</span>
                        <span className="font-extrabold text-sm text-[#151513]">{m.hours}h</span>
                      </div>

                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeClass}`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TASKS VIEW */}
        {activeTab === "tasks" && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#151513]">Tasks</h1>
              <p className="text-sm sm:text-base text-[#6D6D66] mt-1 font-medium">Assigned field tasks and operational work orders.</p>
            </div>

            <section className="bg-white border border-[#DEDED6] rounded-2xl p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-extrabold text-[#151513]">Today’s Work Orders</h2>
                  <p className="text-xs text-[#6D6D66] mt-0.5">Click any task to inspect details or submit an operator shift report.</p>
                </div>
                <span className="text-xs font-bold text-[#2D7A4F] bg-[#E7F3EC] border border-[#CDE5D7] px-3 py-1 rounded-full">
                  {activeTasks.length} Active
                </span>
              </div>

              <div className="grid gap-3">
                {activeTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-4 border border-[#DEDED6] rounded-xl hover:border-[#FFCB05] hover:shadow-md transition-all cursor-pointer bg-[#FAFAF7] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-2.5 h-10 rounded-full bg-[#FFCB05]" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.priority === 'Urgent' ? 'bg-[#D32F2F] text-white' : 'bg-[#FFCB05] text-[#151513]'}`}>
                            {t.priority}
                          </span>
                          <span className="text-xs font-semibold text-[#6D6D66]">{t.zone}</span>
                        </div>
                        <h3 className="font-bold text-sm text-[#151513] truncate">{t.title}</h3>
                        <p className="text-xs text-[#6D6D66] mt-0.5">{t.machine} · {t.machineType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs text-[#6D6D66] hidden sm:block">Target: <strong>{t.eta}</strong></span>
                      <button className="px-3.5 py-1.5 text-xs font-bold bg-[#FFCB05] text-[#151513] rounded-lg hover:bg-[#F2BF00] transition">
                        Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* HISTORY VIEW */}
        {activeTab === "history" && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#151513]">History</h1>
              <p className="text-sm sm:text-base text-[#6D6D66] mt-1 font-medium">Completed tasks and audited operator shift reports.</p>
            </div>

            <section className="bg-white border border-[#DEDED6] rounded-2xl p-6 shadow-sm mb-8">
              <h2 className="text-lg font-extrabold text-[#151513] mb-4">Completed Shift Reports</h2>
            {completedTasks.length === 0 ? (
              <div className="text-center py-12 text-[#6D6D66]">
                <p className="font-bold text-base text-[#151513]">No completed tasks logged yet today.</p>
                <p className="text-xs mt-1">Open an active task and submit a report to populate this section.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EFEFEB]">
                {completedTasks.map((t) => (
                  <div key={t.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2D7A4F]">✓ Completed</span>
                        <span className="text-xs text-[#6D6D66]">{t.report?.submittedAt}</span>
                      </div>
                      <h3 className="font-bold text-sm text-[#151513] mt-1">{t.title}</h3>
                      <p className="text-xs text-[#6D6D66]">{t.machine} · Logged: {t.report?.hoursWorked}h</p>
                    </div>
                    <span className="text-xs font-semibold text-[#2D7A4F] bg-[#E7F3EC] px-3 py-1 rounded-full border border-[#CDE5D7]">
                      {t.report?.outcome}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

        {/* Ambient Site Notice */}
        <div className="bg-[#FFF4B8] border border-[#EAD267] rounded-xl p-4 flex items-start gap-3">
          <div className="text-[#8B7000] mt-0.5 flex-shrink-0">
            <Icon name="info" size={20} />
          </div>
          <div>
            <strong className="text-xs font-bold text-[#151513] block">Jobsite Weather & Ground Advisory</strong>
            <p className="text-xs text-[#6A5A17] mt-0.5 leading-relaxed">
              Ambient temperature is 31°C with clear skies. Ground traction across North Pit is currently Dry. CAT-D6 is undergoing scheduled routine servicing.
            </p>
          </div>
        </div>
      </main>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmitReport={handleSubmitReport}
        />
      )}
    </div>
  );
}
