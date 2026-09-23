import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'dispatch' | 'fleet' | 'operators' | 'safety' | 'rbac';
type MachineStatus = 'OPERATING' | 'STANDBY' | 'MAINTENANCE' | 'FAULT';
type SkillTier = 'Beginner' | 'Intermediate' | 'Expert';
type OperatorStatus = 'On Shift' | 'Standby' | 'Under Review' | 'Off Shift';

interface Machine {
  id: string;
  model: string;
  category: string;
  age: string;
  hours: string;
  status: MachineStatus;
  operator: string;
}

interface Operator {
  id: string;
  name: string;
  tier: SkillTier;
  experience: string;
  certifications: string[];
  safetyScore: string;
  status: OperatorStatus;
}

interface Incident {
  time: string;
  machine: string;
  operator: string;
  trigger: string;
  values: string;
  severity: 'critical' | 'warning' | 'info';
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const machines: Machine[] = [
  { id: 'CATM0001', model: 'CAT 320', category: 'Excavator', age: '2.1y', hours: '1,890h', status: 'OPERATING', operator: 'OP0042' },
  { id: 'CATM0002', model: 'CAT 320', category: 'Excavator', age: '5.4y', hours: '5,200h', status: 'STANDBY', operator: '—' },
  { id: 'CATM0018', model: 'CAT 950', category: 'Wheel Loader', age: '1.8y', hours: '1,420h', status: 'OPERATING', operator: 'OP0112' },
  { id: 'CATM0031', model: 'CAT D6', category: 'Bulldozer', age: '6.8y', hours: '7,100h', status: 'MAINTENANCE', operator: '— Locked —' },
  { id: 'CATM0042', model: 'CAT 336', category: 'Excavator', age: '3.2y', hours: '3,150h', status: 'FAULT', operator: 'OP0098' },
  { id: 'CATM0055', model: 'CAT 140', category: 'Motor Grader', age: '4.1y', hours: '4,300h', status: 'OPERATING', operator: 'OP0055' },
  { id: 'CATM0067', model: 'CAT 430', category: 'Backhoe', age: '2.9y', hours: '2,700h', status: 'STANDBY', operator: '—' },
];

const operators: Operator[] = [
  { id: 'OP0012', name: 'Marcus Brody', tier: 'Expert', experience: '11.5 yrs', certifications: ['Excavator', 'Bulldozer', 'Wheel Loader'], safetyScore: '99.2%', status: 'On Shift' },
  { id: 'OP0045', name: 'Elena Rostova', tier: 'Intermediate', experience: '4.8 yrs', certifications: ['Excavator', 'Backhoe'], safetyScore: '96.4%', status: 'On Shift' },
  { id: 'OP0128', name: 'Tariq Mansoor', tier: 'Beginner', experience: '1.2 yrs', certifications: ['Wheel Loader'], safetyScore: '88.1%', status: 'Standby' },
  { id: 'OP0214', name: 'David Chen', tier: 'Intermediate', experience: '5.1 yrs', certifications: ['Bulldozer', 'Motor Grader'], safetyScore: '84.0%', status: 'Under Review' },
  { id: 'OP0309', name: 'Sarah Jenkins', tier: 'Expert', experience: '14.2 yrs', certifications: ['Excavator', 'Bulldozer', 'Wheel Loader', 'Backhoe', 'Motor Grader'], safetyScore: '99.8%', status: 'Off Shift' },
];

const incidents: Incident[] = [
  { time: '10:42', machine: 'CATM0042', operator: 'OP0098', trigger: 'ENGINE TEMP CRITICAL', values: '104.2°C (Limit: 100°C)', severity: 'critical' },
  { time: '10:18', machine: 'CATM0014', operator: 'OP0128', trigger: 'PROXIMITY RADAR BREACH', values: '1.8m (Safe: >2.5m)', severity: 'critical' },
  { time: '09:55', machine: 'CATM0088', operator: 'OP0214', trigger: 'SEATBELT UNFASTENED', values: 'Fastened: FALSE (7 min)', severity: 'warning' },
  { time: '09:12', machine: 'CATM0019', operator: 'OP0055', trigger: 'EXCESSIVE IDLE', values: 'Idle: 16.4 mins', severity: 'warning' },
  { time: '08:34', machine: 'CATM0067', operator: 'OP0302', trigger: 'HARSH OPERATION SPIKE', values: 'Speed: 11.2 km/h (Muddy)', severity: 'info' },
];

// ─── Status Badges ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MachineStatus }) {
  const styles: Record<MachineStatus, string> = {
    OPERATING: 'bg-green-100 text-green-700',
    STANDBY: 'bg-gray-100 text-gray-600',
    MAINTENANCE: 'bg-yellow-100 text-yellow-700',
    FAULT: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${styles[status]}`}>{status}</span>;
}

function TierBadge({ tier }: { tier: SkillTier }) {
  const styles: Record<SkillTier, string> = {
    Expert: 'bg-black text-[#FFCD11]',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Beginner: 'bg-gray-100 text-gray-600',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${styles[tier]}`}>{tier}</span>;
}

function OperatorStatusBadge({ status }: { status: OperatorStatus }) {
  const styles: Record<OperatorStatus, string> = {
    'On Shift': 'bg-green-100 text-green-700',
    'Standby': 'bg-blue-100 text-blue-700',
    'Under Review': 'bg-red-100 text-red-700',
    'Off Shift': 'bg-gray-100 text-gray-500',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${styles[status]}`}>{status}</span>;
}

// ─── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-[#FFCD11] border-[#E5B800]' : 'bg-white border-[#E5E5E5]'}`}>
      <p className={`text-xs font-500 uppercase tracking-wide ${accent ? 'text-black/60' : 'text-[#6B7280]'}`}>{label}</p>
      <p className={`text-2xl font-700 mt-1 ${accent ? 'text-black' : 'text-[#1A1A1A]'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? 'text-black/50' : 'text-[#6B7280]'}`}>{sub}</p>}
    </div>
  );
}

// ─── Alert Item ────────────────────────────────────────────────────────────

function AlertItem({ text, action }: { text: string; action: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#E5E5E5] last:border-0">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[#DC2626] text-sm">⚠</span>
        <p className="text-sm text-[#1A1A1A]">{text}</p>
      </div>
      <button className="shrink-0 text-xs font-600 text-[#1A1A1A] bg-[#FFCD11] px-3 py-1 rounded-lg hover:bg-[#E5B800] transition-colors">
        {action}
      </button>
    </div>
  );
}

// ─── Overview Page ─────────────────────────────────────────────────────────

function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Machines" value="94 / 120" sub="78% utilization" accent />
        <KpiCard label="Operators On Shift" value="78 / 90" sub="86% staffed" />
        <KpiCard label="Hourly Fuel Burn" value="1,420.5 L" sub="per hour" />
        <KpiCard label="Open Anomalies" value="03" sub="Need review" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
          <h3 className="font-700 text-sm text-[#1A1A1A] mb-3 uppercase tracking-wide">Fleet Distribution</h3>
          <div className="space-y-2">
            {[
              { label: 'Excavators (CAT 320/336/352)', count: 28, total: 40 },
              { label: 'Wheel Loaders (CAT 950/966/980)', count: 24, total: 35 },
              { label: 'Bulldozers (CAT D6/D8)', count: 21, total: 28 },
              { label: 'Motor Graders (CAT 140/160)', count: 12, total: 17 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-[#6B7280] mb-1">
                  <span>{item.label}</span>
                  <span className="font-600 text-[#1A1A1A]">{item.count} active</span>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFCD11] rounded-full"
                    style={{ width: `${(item.count / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
          <h3 className="font-700 text-sm text-[#1A1A1A] mb-3 uppercase tracking-wide">Weather & Site Context</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Temperature', value: '32.1°C', icon: '🌡', sub: 'Clear' },
              { label: 'Rainfall', value: '0.0 mm/hr', icon: '🌧', sub: 'Dry' },
              { label: 'Ground', value: 'High Traction', icon: '🏔', sub: 'Stable' },
              { label: 'Wind', value: '8 km/h NW', icon: '💨', sub: 'Light' },
            ].map(item => (
              <div key={item.label} className="bg-[#FAFAFA] rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>{item.icon}</span>
                  <span className="text-xs text-[#6B7280]">{item.label}</span>
                </div>
                <p className="font-700 text-[#1A1A1A]">{item.value}</p>
                <p className="text-xs text-[#6B7280]">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
        <h3 className="font-700 text-sm text-[#1A1A1A] mb-3 uppercase tracking-wide">Critical Attention Queue</h3>
        <AlertItem text="CATM0042 (CAT 336) — Engine Temperature Warning: 104°C (>100°C limit)" action="Dispatch Tech" />
        <AlertItem text="OP0214 — Seatbelt sensor unfastened during Trenching cycle" action="Radio Operator" />
        <AlertItem text="TASK-1092 — High Idle Flag: CAT 966 idling >14 mins in Stockpile B" action="Reassign Task" />
      </div>
    </div>
  );
}

// ─── Dispatch Page ─────────────────────────────────────────────────────────

function DispatchPage() {
  const [category, setCategory] = useState('Excavation');
  const [task, setTask] = useState('Deep Digging');
  const [machine, setMachine] = useState('CATM0045 — CAT 336');
  const [operator, setOperator] = useState('OP0084 — Sarah K. (9 yrs)');
  const [shift, setShift] = useState('Afternoon Shift (14:00–22:00)');
  const [dispatched, setDispatched] = useState(false);

  const handleDispatch = () => {
    setDispatched(true);
    setTimeout(() => setDispatched(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-700 text-lg">Create & Dispatch Work Order</h2>
        <button className="text-sm font-600 border border-[#E5E5E5] px-4 py-2 rounded-lg hover:bg-[#FAFAFA] transition-colors">
          Batch Dispatch ▾
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-600 uppercase tracking-wide text-[#6B7280] mb-1.5">Step 1 — Task Class</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCD11]">
              <option>Excavation</option>
              <option>Loading</option>
              <option>Grading</option>
              <option>Compaction</option>
            </select>
            <select value={task} onChange={e => setTask(e.target.value)}
              className="w-full mt-2 border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCD11]">
              <option>Deep Digging</option>
              <option>Trench Cutting</option>
              <option>Rock Breaking</option>
            </select>
            <p className="text-xs text-[#6B7280] mt-1.5">Target: 90 min / 42 cycles</p>
          </div>
          <div>
            <label className="block text-xs font-600 uppercase tracking-wide text-[#6B7280] mb-1.5">Step 3 — Operator Match</label>
            <select value={operator} onChange={e => setOperator(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCD11]">
              <option>OP0084 — Sarah K. (9 yrs)</option>
              <option>OP0012 — Marcus B. (11.5 yrs)</option>
              <option>OP0309 — Sarah J. (14.2 yrs)</option>
            </select>
            <p className="text-xs text-green-600 mt-1.5">✓ Certified CAT 336 • 0 Violations</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-600 uppercase tracking-wide text-[#6B7280] mb-1.5">Step 2 — Equipment</label>
            <select value={machine} onChange={e => setMachine(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCD11]">
              <option>CATM0045 — CAT 336</option>
              <option>CATM0001 — CAT 320</option>
              <option>CATM0018 — CAT 950</option>
            </select>
            <p className="text-xs text-[#6B7280] mt-1.5">Health: 96% • Age: 2.1 yrs • 1,840 hrs</p>
          </div>
          <div>
            <label className="block text-xs font-600 uppercase tracking-wide text-[#6B7280] mb-1.5">Step 4 — Shift & Site</label>
            <select value={shift} onChange={e => setShift(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCD11]">
              <option>Afternoon Shift (14:00–22:00)</option>
              <option>Day Shift (06:00–14:00)</option>
              <option>Night Shift (22:00–06:00)</option>
            </select>
            <p className="text-xs text-[#6B7280] mt-1.5">Target: Trench Pit Bravo (Grid D-4)</p>
          </div>
        </div>
      </div>

      <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-2">
        <p className="text-xs font-700 uppercase tracking-wide text-[#6B7280] mb-2">Predictive Feasibility Check</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p><span className="text-green-600 font-600">✓</span> Planned: 90 min → Est: 88.4 min (−1.6 min)</p>
          <p><span className="text-green-600 font-600">✓</span> Predicted Fuel: 34.2 L</p>
          <p><span className="text-green-600 font-600">✓</span> Safety Risk: <strong>LOW</strong> (0.12 index)</p>
          <p><span className="text-green-600 font-600">✓</span> Operator fit: <strong>Expert Tier</strong></p>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button className="px-5 py-2.5 text-sm font-600 border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors">
          Cancel
        </button>
        <button onClick={handleDispatch}
          className={`px-6 py-2.5 text-sm font-700 rounded-lg transition-colors ${dispatched ? 'bg-green-500 text-white' : 'bg-[#FFCD11] text-black hover:bg-[#E5B800]'}`}>
          {dispatched ? '✓ Dispatched!' : 'Dispatch Work Order'}
        </button>
      </div>
    </div>
  );
}

// ─── Fleet Page ────────────────────────────────────────────────────────────

function FleetPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [fleetData, setFleetData] = useState(machines);
  const [lockModal, setLockModal] = useState<string | null>(null);

  const filtered = fleetData.filter(m =>
    (filter === 'All' || m.status === filter) &&
    (m.id.toLowerCase().includes(search.toLowerCase()) || m.model.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleMaintenance = (id: string) => {
    setFleetData(prev => prev.map(m =>
      m.id === id ? { ...m, status: m.status === 'MAINTENANCE' ? 'STANDBY' : 'MAINTENANCE' } : m
    ));
    setLockModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID or model…"
            className="border border-[#E5E5E5] rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-[#FFCD11]"
          />
          {(['All', 'OPERATING', 'STANDBY', 'MAINTENANCE', 'FAULT'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-colors ${filter === f ? 'bg-[#FFCD11] text-black' : 'bg-[#FAFAFA] text-[#6B7280] hover:bg-[#F3F4F6]'}`}>
              {f}
            </button>
          ))}
          <button className="ml-auto text-xs font-600 bg-black text-white px-4 py-2 rounded-lg hover:bg-[#2D2D2D] transition-colors">
            + Register Machine
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                {['Machine ID', 'Model', 'Category', 'Age', 'Hours', 'Status', 'Operator', 'Actions'].map(h => (
                  <th key={h} className="pb-2 text-left text-xs font-700 uppercase tracking-wide text-[#6B7280] pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 pr-4 font-600 text-[#1A1A1A]">{m.id}</td>
                  <td className="py-3 pr-4">{m.model}</td>
                  <td className="py-3 pr-4 text-[#6B7280]">{m.category}</td>
                  <td className="py-3 pr-4 text-[#6B7280]">{m.age}</td>
                  <td className="py-3 pr-4 text-[#6B7280]">{m.hours}</td>
                  <td className="py-3 pr-4"><StatusBadge status={m.status} /></td>
                  <td className="py-3 pr-4 text-[#6B7280]">{m.operator}</td>
                  <td className="py-3 flex gap-2">
                    <button className="text-xs font-600 text-blue-600 hover:underline">View</button>
                    {m.status === 'STANDBY' && (
                      <button className="text-xs font-600 text-green-600 hover:underline">Assign</button>
                    )}
                    {(m.status === 'OPERATING' || m.status === 'STANDBY') && (
                      <button onClick={() => setLockModal(m.id)} className="text-xs font-600 text-orange-600 hover:underline">Lock</button>
                    )}
                    {m.status === 'MAINTENANCE' && (
                      <button onClick={() => toggleMaintenance(m.id)} className="text-xs font-600 text-purple-600 hover:underline">Unlock</button>
                    )}
                    {m.status === 'FAULT' && (
                      <button className="text-xs font-600 text-red-600 hover:underline">Alert</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="font-700 text-lg mb-2">Lock for Maintenance?</h3>
            <p className="text-sm text-[#6B7280] mb-5">Machine <strong>{lockModal}</strong> will be set to MAINTENANCE and locked from dispatch.</p>
            <div className="flex gap-3">
              <button onClick={() => setLockModal(null)}
                className="flex-1 py-2.5 text-sm font-600 border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors">Cancel</button>
              <button onClick={() => toggleMaintenance(lockModal)}
                className="flex-1 py-2.5 text-sm font-700 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">Confirm Lock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Operators Page ────────────────────────────────────────────────────────

function OperatorsPage() {
  const [selected, setSelected] = useState<Operator | null>(null);
  const [tierFilter, setTierFilter] = useState('All');

  const filtered = operators.filter(o => tierFilter === 'All' || o.tier === tierFilter);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {(['All', 'Expert', 'Intermediate', 'Beginner'] as const).map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-colors ${tierFilter === t ? 'bg-[#FFCD11] text-black' : 'bg-[#FAFAFA] text-[#6B7280] hover:bg-[#F3F4F6]'}`}>
              {t}
            </button>
          ))}
          <div className="ml-auto text-sm text-[#6B7280]">900+ operators on record</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                {['ID', 'Name', 'Tier', 'Experience', 'Certifications', 'Safety Score', 'Status', ''].map(h => (
                  <th key={h} className="pb-2 text-left text-xs font-700 uppercase tracking-wide text-[#6B7280] pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(op => (
                <tr key={op.id} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  onClick={() => setSelected(op)}>
                  <td className="py-3 pr-4 font-600 text-[#1A1A1A]">{op.id}</td>
                  <td className="py-3 pr-4 font-600">{op.name}</td>
                  <td className="py-3 pr-4"><TierBadge tier={op.tier} /></td>
                  <td className="py-3 pr-4 text-[#6B7280]">{op.experience}</td>
                  <td className="py-3 pr-4 text-[#6B7280]">{op.certifications.join(', ')}</td>
                  <td className="py-3 pr-4 font-600 text-green-700">{op.safetyScore}</td>
                  <td className="py-3 pr-4"><OperatorStatusBadge status={op.status} /></td>
                  <td className="py-3"><button className="text-xs font-600 text-blue-600 hover:underline">View Profile</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-700 text-xl">{selected.name}</h3>
                <p className="text-sm text-[#6B7280]">{selected.id} • {selected.experience}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#6B7280] hover:text-black text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#6B7280]">Skill Tier</span><TierBadge tier={selected.tier} /></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Safety Score</span><span className="font-700 text-green-700">{selected.safetyScore}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Status</span><OperatorStatusBadge status={selected.status} /></div>
              <div>
                <p className="text-[#6B7280] mb-1.5">Certifications</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.certifications.map(c => (
                    <span key={c} className="bg-[#FFCD11]/30 text-black px-2 py-0.5 rounded text-xs font-600">{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="flex-1 py-2.5 text-sm font-700 bg-[#FFCD11] text-black rounded-lg hover:bg-[#E5B800] transition-colors">Assign to Task</button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 text-sm font-600 border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Safety Page ───────────────────────────────────────────────────────────

function SafetyPage() {
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());
  const [autoProximity, setAutoProximity] = useState(true);
  const [autoRainfall, setAutoRainfall] = useState(true);

  const acknowledge = (i: number) => setAcknowledged(prev => new Set([...prev, i]));

  const severityStyle: Record<string, string> = {
    critical: 'border-l-4 border-red-500 bg-red-50',
    warning: 'border-l-4 border-yellow-400 bg-yellow-50',
    info: 'border-l-4 border-blue-400 bg-blue-50',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-700 text-lg">Safety & Telematics Monitor</h2>
        <button onClick={() => setEmergencyModal(true)}
          className="px-5 py-2.5 text-sm font-700 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          🛑 Emergency Stop
        </button>
      </div>

      <div className="space-y-3">
        {incidents.map((inc, i) => (
          <div key={i} className={`rounded-xl p-4 ${severityStyle[inc.severity]} ${acknowledged.has(i) ? 'opacity-50' : ''}`}>
            <div className="flex flex-wrap gap-4 items-start justify-between">
              <div>
                <div className="flex flex-wrap gap-3 text-xs text-[#6B7280] mb-1">
                  <span>{inc.time}</span>
                  <span className="font-700 text-[#1A1A1A]">{inc.machine}</span>
                  <span>{inc.operator}</span>
                </div>
                <p className="font-700 text-sm">{inc.trigger}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{inc.values}</p>
              </div>
              {!acknowledged.has(i) && (
                <button onClick={() => acknowledge(i)}
                  className="shrink-0 text-xs font-700 bg-white border border-[#E5E5E5] px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                  Acknowledge
                </button>
              )}
              {acknowledged.has(i) && <span className="text-xs text-green-600 font-600">✓ Acknowledged</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
        <h3 className="font-700 text-sm uppercase tracking-wide text-[#6B7280] mb-4">Automated Standdown Controls</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6]">
            <div>
              <p className="text-sm font-600">Auto-warn if proximity &lt; 2.0m for &gt;5 sec</p>
              <p className="text-xs text-[#6B7280]">Triggers operator warning via telematics</p>
            </div>
            <button onClick={() => setAutoProximity(!autoProximity)}
              className={`relative w-12 h-6 rounded-full transition-colors ${autoProximity ? 'bg-[#FFCD11]' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoProximity ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-600">Restrict Motor Grader if rainfall &gt; 8.0 mm/hr</p>
              <p className="text-xs text-[#6B7280]">Prevents operation in excessive mud conditions</p>
            </div>
            <button onClick={() => setAutoRainfall(!autoRainfall)}
              className={`relative w-12 h-6 rounded-full transition-colors ${autoRainfall ? 'bg-[#FFCD11]' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoRainfall ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {emergencyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl border-t-4 border-red-600">
            <h3 className="font-700 text-xl text-red-700 mb-2">🛑 Emergency Site Stop</h3>
            <p className="text-sm text-[#6B7280] mb-5">
              This will halt ALL active machinery across the site. This action is logged and requires Super Admin approval to reverse.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEmergencyModal(false)}
                className="flex-1 py-2.5 text-sm font-600 border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors">Cancel</button>
              <button onClick={() => setEmergencyModal(false)}
                className="flex-1 py-2.5 text-sm font-700 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Confirm Stop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RBAC Page ─────────────────────────────────────────────────────────────

type RoleKey = 'superAdmin' | 'dispatcher' | 'safety' | 'maintenance';

const roleLabels: Record<RoleKey, string> = {
  superAdmin: 'Site Super Admin',
  dispatcher: 'Fleet Dispatcher',
  safety: 'Safety Supervisor',
  maintenance: 'Maintenance Lead',
};

const permissionData: { scope: string; superAdmin: string; dispatcher: string; safety: string; maintenance: string }[] = [
  { scope: 'Create / Modify Work Orders', superAdmin: '✓ Full', dispatcher: '✓ Full', safety: '✕ View Only', maintenance: '✕ View Only' },
  { scope: 'Assign Operator / Machine', superAdmin: '✓ Full', dispatcher: '✓ Full', safety: '✕ View Only', maintenance: '✕ View Only' },
  { scope: 'Emergency Machine Stop', superAdmin: '✓ Enabled', dispatcher: '✕ Disabled', safety: '✓ Enabled', maintenance: '✓ Enabled' },
  { scope: 'Override Weather Lock', superAdmin: '✓ Full', dispatcher: '✕ Restricted', safety: '✓ Approval Req.', maintenance: '✕ Disabled' },
  { scope: 'Edit Telematics Thresholds', superAdmin: '✓ Full', dispatcher: '✕ View Only', safety: '✓ Safety Only', maintenance: '✓ Sensor Cal.' },
  { scope: 'Manage Admin Logins & RBAC', superAdmin: '✓ Full', dispatcher: '✕ Denied', safety: '✕ Denied', maintenance: '✕ Denied' },
];

function RbacPage() {
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Fleet Dispatcher');
  const [invited, setInvited] = useState(false);

  const handleInvite = () => {
    if (!inviteName.trim()) return;
    setInvited(true);
    setTimeout(() => { setInvited(false); setInviteModal(false); setInviteName(''); }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-700 text-lg">Permission Matrix</h2>
          <button onClick={() => setInviteModal(true)}
            className="text-sm font-700 bg-black text-white px-4 py-2 rounded-lg hover:bg-[#2D2D2D] transition-colors">
            + Invite Admin
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                <th className="pb-3 text-left text-xs font-700 uppercase tracking-wide text-[#6B7280] pr-6">Permission Scope</th>
                {(Object.keys(roleLabels) as RoleKey[]).map(r => (
                  <th key={r} className="pb-3 text-left text-xs font-700 uppercase tracking-wide text-[#6B7280] pr-6">{roleLabels[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionData.map((row, i) => (
                <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 pr-6 font-600 text-[#1A1A1A]">{row.scope}</td>
                  {(['superAdmin', 'dispatcher', 'safety', 'maintenance'] as RoleKey[]).map(r => (
                    <td key={r} className={`py-3 pr-6 text-xs font-600 ${row[r].startsWith('✓') ? 'text-green-700' : 'text-red-500'}`}>
                      {row[r]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
        <h3 className="font-700 text-sm uppercase tracking-wide text-[#6B7280] mb-4">Telematics Safety Thresholds</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Engine Temperature Limit', value: '100', unit: '°C' },
            { label: 'Proximity Alert Distance', value: '2.5', unit: 'm' },
            { label: 'Max Idle Duration', value: '10', unit: 'min' },
            { label: 'Max Wind Speed (Grader ops)', value: '25', unit: 'km/h' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between bg-[#FAFAFA] rounded-lg p-3">
              <span className="text-sm text-[#1A1A1A]">{item.label}</span>
              <div className="flex items-center gap-1">
                <input defaultValue={item.value}
                  className="w-16 text-center border border-[#E5E5E5] rounded px-2 py-1 text-sm font-700 focus:outline-none focus:ring-2 focus:ring-[#FFCD11]" />
                <span className="text-xs text-[#6B7280]">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {inviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="font-700 text-lg mb-4">Invite Admin User</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-600 text-[#6B7280] mb-1">Full Name</label>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCD11]" />
              </div>
              <div>
                <label className="block text-xs font-600 text-[#6B7280] mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCD11]">
                  <option>Fleet Dispatcher</option>
                  <option>Safety Supervisor</option>
                  <option>Maintenance Lead</option>
                  <option>Site Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setInviteModal(false)}
                className="flex-1 py-2.5 text-sm font-600 border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors">Cancel</button>
              <button onClick={handleInvite}
                className={`flex-1 py-2.5 text-sm font-700 rounded-lg transition-colors ${invited ? 'bg-green-500 text-white' : 'bg-[#FFCD11] text-black hover:bg-[#E5B800]'}`}>
                {invited ? '✓ Sent!' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'dispatch', label: 'Task Dispatch' },
  { id: 'fleet', label: 'Fleet Registry' },
  { id: 'operators', label: 'Operators' },
  { id: 'safety', label: 'Safety & Audits' },
  { id: 'rbac', label: 'Access Control' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const pageComponents: Record<Tab, JSX.Element> = {
    overview: <OverviewPage />,
    dispatch: <DispatchPage />,
    fleet: <FleetPage />,
    operators: <OperatorsPage />,
    safety: <SafetyPage />,
    rbac: <RbacPage />,
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-black text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFCD11] text-black font-800 text-xs px-2 py-1 rounded font-700">CAT</div>
              <div>
                <p className="font-700 text-sm leading-tight">SITE COMMAND</p>
                <p className="text-xs text-white/60 leading-tight">North Pit Jobsite #402</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span>Active: <strong className="text-white">94/120</strong></span>
              <span>Operators: <strong className="text-white">78</strong></span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <strong className="text-white">NORMAL</strong>
              </span>
              <span className="hidden md:block text-white/60">Mark Vance — <span className="text-[#FFCD11]">Super Admin</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-[52px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-3.5 text-sm font-600 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#FFCD11] text-black'
                    : 'border-transparent text-[#6B7280] hover:text-black'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {pageComponents[activeTab]}
      </main>
    </div>
  );
}
