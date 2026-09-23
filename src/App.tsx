import { useEffect, useMemo, useState } from "react";

type Step = "tasks" | "machine" | "setup" | "simulation" | "results";
type TaskId = "excavation" | "loading" | "grading" | "demolition" | "clearing";

type Task = {
  id: TaskId;
  number: string;
  name: string;
  description: string;
  target: string;
  duration: string;
  machine: string;
  machineType: string;
  age: string;
  tuning: {
    rpm: { label: string; min: number; max: number; unit: string; recommended: [number, number]; preset: number };
    speed: { label: string; min: number; max: number; unit: string; recommended: [number, number]; preset: number; step?: number };
    load: { label: string; min: number; max: number; unit: string; recommended: [number, number]; preset: number };
    work: { label: string; min: number; max: number; unit: string; recommended: [number, number]; preset: number };
  };
};

const tasks: Task[] = [
  {
    id: "excavation",
    number: "01",
    name: "Excavation",
    description: "Dig and move material efficiently using smooth, controlled cycles.",
    target: "08:00",
    duration: "10 min",
    machine: "CAT 320",
    machineType: "Excavator",
    age: "6 years",
    tuning: {
      rpm: { label: "Engine speed", min: 1200, max: 2200, unit: "RPM", recommended: [1600, 1900], preset: 1750 },
      speed: { label: "Swing speed", min: 2, max: 12, unit: "RPM", recommended: [6, 9], preset: 7 },
      load: { label: "Hydraulic load", min: 30, max: 100, unit: "%", recommended: [65, 80], preset: 72 },
      work: { label: "Dig cycles", min: 4, max: 16, unit: "cycles", recommended: [8, 12], preset: 10 },
    },
  },
  {
    id: "loading",
    number: "02",
    name: "Loading",
    description: "Load material safely while balancing speed and bucket capacity.",
    target: "06:30",
    duration: "8 min",
    machine: "CAT 950",
    machineType: "Wheel Loader",
    age: "4 years",
    tuning: {
      rpm: { label: "Engine speed", min: 1000, max: 2400, unit: "RPM", recommended: [1500, 1850], preset: 1700 },
      speed: { label: "Travel speed", min: 2, max: 14, unit: "km/h", recommended: [5, 8], preset: 6.5, step: 0.5 },
      load: { label: "Bucket fill target", min: 40, max: 110, unit: "%", recommended: [85, 100], preset: 92 },
      work: { label: "Loading cycles", min: 4, max: 18, unit: "cycles", recommended: [8, 14], preset: 10 },
    },
  },
  {
    id: "grading",
    number: "03",
    name: "Grading",
    description: "Create an even surface with steady speed and accurate passes.",
    target: "09:15",
    duration: "12 min",
    machine: "CAT 140",
    machineType: "Motor Grader",
    age: "5 years",
    tuning: {
      rpm: { label: "Engine speed", min: 900, max: 2100, unit: "RPM", recommended: [1300, 1650], preset: 1450 },
      speed: { label: "Grading speed", min: 1, max: 10, unit: "km/h", recommended: [3, 5], preset: 4, step: 0.5 },
      load: { label: "Blade pitch", min: 20, max: 70, unit: "°", recommended: [38, 48], preset: 42 },
      work: { label: "Grading passes", min: 2, max: 12, unit: "passes", recommended: [4, 7], preset: 5 },
    },
  },
  {
    id: "demolition",
    number: "04",
    name: "Demolition",
    description: "Break down structures with controlled tool power and safe positioning.",
    target: "11:00",
    duration: "14 min",
    machine: "CAT 336",
    machineType: "Demolition Excavator",
    age: "3 years",
    tuning: {
      rpm: { label: "Engine speed", min: 1200, max: 2200, unit: "RPM", recommended: [1700, 2000], preset: 1850 },
      speed: { label: "Hammer impact rate", min: 300, max: 900, unit: "BPM", recommended: [520, 700], preset: 620 },
      load: { label: "Hydraulic pressure", min: 40, max: 100, unit: "%", recommended: [72, 88], preset: 80 },
      work: { label: "Break sections", min: 3, max: 14, unit: "sections", recommended: [6, 10], preset: 8 },
    },
  },
  {
    id: "clearing",
    number: "05",
    name: "Land Clearing",
    description: "Clear vegetation and debris using steady pushes and efficient blade control.",
    target: "10:30",
    duration: "13 min",
    machine: "CAT D6",
    machineType: "Dozer",
    age: "4 years",
    tuning: {
      rpm: { label: "Engine speed", min: 1000, max: 2200, unit: "RPM", recommended: [1500, 1850], preset: 1700 },
      speed: { label: "Push speed", min: 1, max: 8, unit: "km/h", recommended: [2, 4], preset: 3, step: 0.5 },
      load: { label: "Blade load", min: 30, max: 100, unit: "%", recommended: [60, 78], preset: 68 },
      work: { label: "Clearing passes", min: 3, max: 14, unit: "passes", recommended: [6, 10], preset: 8 },
    },
  },
];

const stepOrder: Step[] = ["tasks", "machine", "setup", "simulation", "results"];
const stepLabels = ["Select", "Machine", "Tune", "Run", "Learn"];

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "back" | "check" | "clock" | "shield" | "leaf" | "info" | "play" | "pause" | "reset";
  size?: number;
}) {
  const paths = {
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    back: <><path d="M19 12H5m5-5-5 5 5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.4 2.8 8.2 7 10 4.2-1.8 7-5.6 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    leaf: <><path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15Z" /><path d="M4 21c2-5 6-9 12-12" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    pause: <><path d="M9 8v8M15 8v8" /></>,
    reset: <><path d="M4 11a8 8 0 1 1 2 6M4 11V6m0 5h5" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function MachineGraphic({ type = "Excavator", active = false }: { type?: string; active?: boolean }) {
  if (type === "Dozer") {
    return (
      <svg className={`machine-svg ${active ? "is-active" : ""}`} viewBox="0 0 520 250" role="img" aria-label="Dozer illustration">
        <path className="ground-line" d="M34 205h452" />
        <g className="machine-body">
          <path className="track-fill" d="M100 157h255c28 0 49 20 49 48H67c0-27 12-48 33-48Z" />
          <circle className="track-wheel" cx="116" cy="182" r="17" /><circle className="track-wheel" cx="351" cy="182" r="17" />
          <path className="yellow-fill" d="M117 104h215l58 61H91Z" />
          <path className="dark-fill" d="M188 45h92l45 71H168Z" />
          <path className="window-fill" d="M201 57h67l31 49H181Z" />
          <path className="boom" d="m376 145 48 27" />
          <path className="yellow-fill" d="m414 114 67 7-12 93-55-18Z" />
        </g>
      </svg>
    );
  }
  if (type === "Motor Grader") {
    return (
      <svg className={`machine-svg ${active ? "is-active" : ""}`} viewBox="0 0 520 250" role="img" aria-label="Motor grader illustration">
        <path className="ground-line" d="M36 205h450" />
        <g className="machine-body">
          <circle className="tyre" cx="110" cy="190" r="34" /><circle className="hub" cx="110" cy="190" r="13" />
          <circle className="tyre" cx="386" cy="190" r="34" /><circle className="hub" cx="386" cy="190" r="13" />
          <circle className="tyre" cx="448" cy="190" r="34" /><circle className="hub" cx="448" cy="190" r="13" />
          <path className="yellow-fill" d="M88 148h290l62-48 22 13-58 59H103Z" />
          <path className="dark-fill" d="M323 70h76l37 78H305Z" />
          <path className="window-fill" d="M335 82h54l26 54h-72Z" />
          <path className="yellow-fill" d="M185 168h122l-23 42h-82Z" />
        </g>
      </svg>
    );
  }
  return (
    <svg className={`machine-svg ${active ? "is-active" : ""}`} viewBox="0 0 520 250" role="img" aria-label={`${type} illustration`}>
      <path className="ground-line" d="M38 205h445" />
      <g className="machine-body">
        {type === "Wheel Loader" ? (
          <>
            <circle className="tyre" cx="155" cy="185" r="43" /><circle className="hub" cx="155" cy="185" r="15" />
            <circle className="tyre" cx="356" cy="185" r="43" /><circle className="hub" cx="356" cy="185" r="15" />
            <path className="yellow-fill" d="M112 128h238l55 48H112Z" />
            <path className="dark-fill" d="M218 66h91l39 69H200Z" />
            <path className="window-fill" d="M231 78h65l26 46h-101Z" />
            <path className="yellow-fill" d="m386 127 62 20 28 54h-72Z" />
          </>
        ) : (
          <>
            <path className="track-fill" d="M92 166h237c22 0 40 18 40 40H62c0-22 10-40 30-40Z" />
            <path className="yellow-fill" d="M112 111h174l55 62H98Z" />
            <path className="dark-fill" d="M174 45h92l33 76H151Z" />
            <path className="window-fill" d="M188 57h66l23 52H168Z" />
            <path className="boom" d="m282 105 68-61 80 86" />
            <path className="boom" d="m426 124 33 56" />
            <path className="bucket" d="m446 174 42-8-12 38h-49Z" />
            <circle className="track-wheel" cx="112" cy="187" r="15" /><circle className="track-wheel" cx="319" cy="187" r="15" />
          </>
        )}
      </g>
    </svg>
  );
}

function Header({ step, onHome }: { step: Step; onHome: () => void }) {
  const current = stepOrder.indexOf(step);
  return (
    <header className="app-header">
      <button className="brand" onClick={onHome} aria-label="Go to task library">
        <span className="brand-mark">C</span>
        <span><strong>Operator</strong><small>Training Ground</small></span>
      </button>
      <nav className="stepper" aria-label="Training progress">
        {stepLabels.map((label, index) => (
          <div className={`step ${index === current ? "active" : ""} ${index < current ? "done" : ""}`} key={label}>
            <span>{index < current ? <Icon name="check" size={13} /> : index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </nav>
      <div className="help-pill"><Icon name="info" size={16} /> Help</div>
    </header>
  );
}

function TaskLibrary({ onSelect }: { onSelect: (task: Task) => void }) {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Operator training, made simple</p>
          <h1>Choose a task.<br /><span>Learn by doing.</span></h1>
          <p className="hero-copy">Practice essential machine skills in a safe, clear simulation. We’ll guide you at every step.</p>
        </div>
        <div className="hero-note">
          <Icon name="shield" size={26} />
          <div><strong>Safe practice environment</strong><span>No experience needed. You can retry at any time.</span></div>
        </div>
      </section>
      <section className="section-head">
        <div><p className="eyebrow">Task library</p><h2>What would you like to practice?</h2></div>
        <span>5 training tasks</span>
      </section>
      <div className="task-grid">
        {tasks.map((task, index) => (
          <article className="task-card" key={task.id}>
            <div className="task-top">
              <span className="task-number">{task.number}</span>
              <span className={`status ${index === 0 ? "recommended" : ""}`}>{index === 0 ? "Recommended" : "Available"}</span>
            </div>
            <div className="task-visual"><MachineGraphic type={task.machineType} /></div>
            <h3>{task.name}</h3>
            <p>{task.description}</p>
            <div className="task-meta">
              <span><Icon name="clock" size={17} /> Target <strong>{task.target}</strong></span>
              <span>{task.duration}</span>
            </div>
            <button className="primary-button full" onClick={() => onSelect(task)}>Start task <Icon name="arrow" /></button>
          </article>
        ))}
      </div>
    </main>
  );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return <button className="back-button" onClick={onClick}><Icon name="back" size={18} /> {label}</button>;
}

function MachineSelect({ task, onBack, onContinue }: { task: Task; onBack: () => void; onContinue: () => void }) {
  return (
    <main className="page narrow">
      <BackButton onClick={onBack} label="All tasks" />
      <div className="page-title">
        <p className="eyebrow">Step 2 of 5 · {task.name}</p>
        <h1>Select your machine</h1>
        <p>We’ve matched the best machine for this training task.</p>
      </div>
      <article className="machine-select-card">
        <div className="machine-feature">
          <span className="status recommended">Best match</span>
          <MachineGraphic type={task.machineType} />
        </div>
        <div className="machine-detail">
          <p className="eyebrow">Training machine</p>
          <h2>{task.machine}</h2>
          <p className="machine-description">A balanced, responsive machine configured for operator training and realistic task feedback.</p>
          <div className="spec-list">
            <div><span>Machine type</span><strong>{task.machineType}</strong></div>
            <div><span>Machine age</span><strong>{task.age}</strong></div>
            <div><span>Training task</span><strong>{task.name}</strong></div>
          </div>
          <div className="ready-line"><span><Icon name="check" size={15} /></span> Machine ready for simulation</div>
          <button className="primary-button full" onClick={onContinue}>Use this machine <Icon name="arrow" /></button>
        </div>
      </article>
      <p className="hint"><Icon name="info" size={16} /> More compatible machines will be added soon.</p>
    </main>
  );
}

function RangeControl({ label, value, min, max, unit, recommended, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; unit: string; recommended: [number, number]; step?: number; onChange: (value: number) => void;
}) {
  const warning = value < recommended[0] || value > recommended[1];
  return (
    <div className={`range-control ${warning ? "warning" : ""}`}>
      <div className="control-heading"><label>{label}</label><output>{value.toLocaleString()} <small>{unit}</small></output></div>
      <input type="range" min={min} max={max} value={value} step={step} onChange={(event) => onChange(Number(event.target.value))} style={{ "--fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties} />
      <div className="range-labels"><span>{min}</span><span>Recommended {recommended[0]}–{recommended[1]}</span><span>{max}</span></div>
      {warning && <p className="inline-warning">Try the recommended range for a smoother run.</p>}
    </div>
  );
}

function Setup({ task, values, setValues, onBack, onRun }: {
  task: Task;
  values: { rpm: number; speed: number; load: number; cycles: number; temperature: number; ground: string; rain: string; seatbelt: boolean };
  setValues: React.Dispatch<React.SetStateAction<{ rpm: number; speed: number; load: number; cycles: number; temperature: number; ground: string; rain: string; seatbelt: boolean }>>;
  onBack: () => void; onRun: () => void;
}) {
  const [presetLoaded, setPresetLoaded] = useState(false);
  const tuning = task.tuning;
  const warning = values.ground === "Muddy" && tuning.speed.unit === "km/h" && values.speed > tuning.speed.recommended[1];
  const loadPreset = () => {
    setValues((current) => ({
      ...current,
      rpm: tuning.rpm.preset,
      speed: tuning.speed.preset,
      load: tuning.load.preset,
      cycles: tuning.work.preset,
      temperature: 28,
      ground: "Dry",
      rain: "None",
      seatbelt: true,
    }));
    setPresetLoaded(true);
  };
  return (
    <main className="page setup-page">
      <BackButton onClick={onBack} label="Machine selection" />
      <div className="setup-intro">
        <div className="page-title compact">
          <p className="eyebrow">Step 3 of 5 · Set up your run</p>
          <h1>Tune your machine</h1>
          <p>These controls are matched specifically to the {task.machine}.</p>
        </div>
        <button className={`preset-button ${presetLoaded ? "loaded" : ""}`} onClick={loadPreset}>
          <span><Icon name={presetLoaded ? "check" : "reset"} size={20} /></span>
          <span><strong>{presetLoaded ? "Optimized preset loaded" : "Load optimized preset"}</strong><small>Best balance of speed, safety and fuel use</small></span>
        </button>
      </div>
      <div className="setup-layout">
        <div className="control-stack">
          <section className="panel">
            <div className="panel-title"><span>01</span><div><h2>Machine controls</h2><p>Adjust how the {task.machine} will operate.</p></div></div>
            <RangeControl {...tuning.rpm} value={values.rpm} onChange={(rpm) => { setPresetLoaded(false); setValues((v) => ({ ...v, rpm })); }} />
            <RangeControl {...tuning.speed} value={values.speed} onChange={(speed) => { setPresetLoaded(false); setValues((v) => ({ ...v, speed })); }} />
            <RangeControl {...tuning.load} value={values.load} onChange={(load) => { setPresetLoaded(false); setValues((v) => ({ ...v, load })); }} />
          </section>
          <section className="panel">
            <div className="panel-title"><span>02</span><div><h2>Task settings</h2><p>Choose how much work to complete.</p></div></div>
            <RangeControl {...tuning.work} value={values.cycles} onChange={(cycles) => { setPresetLoaded(false); setValues((v) => ({ ...v, cycles })); }} />
          </section>
        </div>
        <aside className="setup-side">
          <section className="panel">
            <div className="panel-title"><span>03</span><div><h2>Conditions</h2><p>Set the worksite environment.</p></div></div>
            <label className="select-label">Ground condition
              <select value={values.ground} onChange={(e) => setValues((v) => ({ ...v, ground: e.target.value }))}>
                <option>Dry</option><option>Wet</option><option>Muddy</option><option>Uneven</option>
              </select>
            </label>
            <label className="select-label">Rainfall
              <select value={values.rain} onChange={(e) => setValues((v) => ({ ...v, rain: e.target.value }))}>
                <option>None</option><option>Light</option><option>Moderate</option><option>Heavy</option>
              </select>
            </label>
            <RangeControl label="Temperature" value={values.temperature} min={10} max={45} unit="°C" recommended={[18, 35]} onChange={(temperature) => setValues((v) => ({ ...v, temperature }))} />
            {warning && <div className="alert"><Icon name="info" size={18} /><span><strong>Slow down on muddy ground.</strong> Keep {tuning.speed.label.toLowerCase()} within the recommended range.</span></div>}
          </section>
          <section className="safety-card">
            <div><Icon name="shield" size={22} /><span><strong>Safety check</strong><small>Required before starting</small></span></div>
            <button className={`toggle ${values.seatbelt ? "on" : ""}`} onClick={() => setValues((v) => ({ ...v, seatbelt: !v.seatbelt }))} aria-pressed={values.seatbelt}>
              <span />{values.seatbelt ? "Seatbelt fastened" : "Fasten seatbelt"}
            </button>
          </section>
          <div className="run-card">
            <p>Ready when you are</p><h3>{task.name} with {task.machine}</h3>
            <button className="primary-button full" onClick={onRun} disabled={!values.seatbelt}><Icon name="play" /> Start simulation</button>
            {!values.seatbelt && <small>Fasten your seatbelt to begin.</small>}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Simulation({ task, values, onFinish }: { task: Task; values: { rpm: number; speed: number; load: number; cycles: number; temperature: number; ground: string; rain: string; seatbelt: boolean }; onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    if (progress >= 100) {
      const timeout = window.setTimeout(onFinish, 700);
      return () => window.clearTimeout(timeout);
    }
    const interval = window.setInterval(() => setProgress((p) => Math.min(100, p + 1)), 90);
    return () => window.clearInterval(interval);
  }, [paused, progress, onFinish]);
  const time = Math.round(progress * 5.1);
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <main className="console-page">
      <section className="console-head">
        <div><p className="eyebrow">Live training · {task.name}</p><h1>{task.machine}</h1></div>
        <span className={`live-status ${paused ? "paused" : ""}`}><i /> {paused ? "Paused" : "Simulation running"}</span>
      </section>
      <div className="console-grid">
        <section className="machine-stage">
          <div className="stage-label">Machine view <span>{values.ground} ground</span></div>
          <MachineGraphic type={task.machineType} active={!paused} />
          <div className="stage-ground" />
        </section>
        <section className="telemetry-panel">
          <div className="telemetry-title"><span>Live telemetry</span><small>Updates automatically</small></div>
          <div className="telemetry-grid">
            <div><small>{task.tuning.load.label}</small><strong>{paused ? values.load : values.load + Math.round(Math.sin(progress) * 3)}<em>{task.tuning.load.unit}</em></strong><span className="good-dot">Normal</span></div>
            <div><small>{task.tuning.speed.label}</small><strong>{paused ? "0" : values.speed.toLocaleString()}<em>{task.tuning.speed.unit}</em></strong><span className="good-dot">Steady</span></div>
            <div><small>Engine temp</small><strong>{Math.min(92, 72 + Math.round(progress / 7))}<em>°C</em></strong><span className="good-dot">Normal</span></div>
            <div><small>Fuel rate</small><strong>{(11.8 + values.load / 20).toFixed(1)}<em>L/h</em></strong><span className="good-dot">Efficient</span></div>
          </div>
        </section>
      </div>
      <section className="progress-panel">
        <div className="progress-top"><div><p>Task progress</p><h2>{progress}<small>%</small></h2></div><div className="time-stat"><small>Elapsed</small><strong>{formatTime(time)}</strong></div><div className="time-stat"><small>Estimated finish</small><strong>08:30</strong></div><div className="time-stat"><small>Target</small><strong>{task.target}</strong></div></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="progress-bottom"><span>{paused ? "Simulation is paused. Resume when ready." : `${task.tuning.work.label}: ${Math.max(1, Math.ceil((progress / 100) * values.cycles))} of ${values.cycles}`}</span><button className="secondary-button" onClick={() => setPaused((value) => !value)}><Icon name={paused ? "play" : "pause"} /> {paused ? "Resume" : "Pause"}</button></div>
      </section>
    </main>
  );
}

function Results({ task, values, onRetry, onHome }: { task: Task; values: { rpm: number; speed: number; load: number; cycles: number; temperature: number; ground: string; rain: string; seatbelt: boolean }; onRetry: () => void; onHome: () => void }) {
  const score = useMemo(() => {
    let value = 94;
    if (values.rpm < task.tuning.rpm.recommended[0] || values.rpm > task.tuning.rpm.recommended[1]) value -= 7;
    if (values.speed < task.tuning.speed.recommended[0] || values.speed > task.tuning.speed.recommended[1]) value -= 6;
    if (values.load < task.tuning.load.recommended[0] || values.load > task.tuning.load.recommended[1]) value -= 5;
    if (values.ground === "Muddy") value -= 4;
    return Math.max(68, value);
  }, [task, values]);
  return (
    <main className="page results-page">
      <section className="result-hero">
        <div className="result-check"><Icon name="check" size={31} /></div>
        <p className="eyebrow">Simulation complete</p>
        <h1>Nice work. Your run is complete.</h1>
        <p>Review what went well and make one small change for your next attempt.</p>
      </section>
      <div className="result-grid">
        <section className="score-card">
          <p>Overall efficiency</p>
          <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span><strong>{score}</strong><small>/100</small></span></div>
          <h2>{score >= 90 ? "Excellent run" : "Good progress"}</h2>
          <p>Your operation was safe and mostly within the recommended ranges.</p>
        </section>
        <section className="metrics-card">
          <div className="panel-title"><span>01</span><div><h2>Run summary</h2><p>{task.name} · {task.machine}</p></div></div>
          <div className="metric-row"><span>Target time</span><strong>{task.target}</strong></div>
          <div className="metric-row"><span>Your estimate</span><strong>08:30</strong></div>
          <div className="metric-row"><span>Difference</span><strong className="amber">+00:30</strong></div>
          <div className="metric-row"><span>Safety</span><strong className="safe"><Icon name="check" size={15} /> No violations</strong></div>
        </section>
        <section className="feedback-card">
          <div className="panel-title"><span>02</span><div><h2>What to try next</h2><p>One practical improvement</p></div></div>
          <div className="learning-note"><Icon name="leaf" size={24} /><div><strong>Keep your movement smooth</strong><p>{values.speed > task.tuning.speed.recommended[1] ? `Reduce ${task.tuning.speed.label.toLowerCase()} toward ${task.tuning.speed.preset} ${task.tuning.speed.unit} for better control.` : `Your ${task.tuning.speed.label.toLowerCase()} was well controlled. Keep it near ${task.tuning.speed.preset} ${task.tuning.speed.unit}.`}</p></div></div>
          <div className="good-list"><span><Icon name="check" size={15} /> Seatbelt fastened</span><span><Icon name="check" size={15} /> Safe engine temperature</span></div>
        </section>
      </div>
      <div className="result-actions">
        <button className="primary-button" onClick={onRetry}><Icon name="reset" /> Try again with same settings</button>
        <button className="secondary-button" onClick={onHome}>Choose another task</button>
      </div>
    </main>
  );
}

function optimizedValues(task: Task) {
  return {
    rpm: task.tuning.rpm.preset,
    speed: task.tuning.speed.preset,
    load: task.tuning.load.preset,
    cycles: task.tuning.work.preset,
    temperature: 28,
    ground: "Dry",
    rain: "None",
    seatbelt: true,
  };
}

export default function App() {
  const [step, setStep] = useState<Step>("tasks");
  const [task, setTask] = useState<Task>(tasks[0]);
  const [values, setValues] = useState(optimizedValues(tasks[0]));
  const goHome = () => setStep("tasks");
  return (
    <div className="app-shell">
      <Header step={step} onHome={goHome} />
      {step === "tasks" && <TaskLibrary onSelect={(selected) => { setTask(selected); setValues(optimizedValues(selected)); setStep("machine"); }} />}
      {step === "machine" && <MachineSelect task={task} onBack={goHome} onContinue={() => setStep("setup")} />}
      {step === "setup" && <Setup task={task} values={values} setValues={setValues} onBack={() => setStep("machine")} onRun={() => setStep("simulation")} />}
      {step === "simulation" && <Simulation task={task} values={values} onFinish={() => setStep("results")} />}
      {step === "results" && <Results task={task} values={values} onRetry={() => setStep("setup")} onHome={goHome} />}
      {step !== "simulation" && <footer><span>CAT Operator Training</span><span>Practice safely. Learn confidently.</span></footer>}
    </div>
  );
}
