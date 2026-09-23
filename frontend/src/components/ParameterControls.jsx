import React from 'react';
import { Play, Sparkles, RotateCcw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ParameterControls({
  parameters,
  onChange,
  onSimulate,
  onReset,
  onLoadRecommended,
  machine,
  isLoading
}) {
  const rpmMin = machine?.rpm_range?.min || 1200;
  const rpmMax = machine?.rpm_range?.max || 2200;

  return (
    <div className="cab-panel">
      <div className="panel-header">
        <span>Cab Setting Knobs</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onLoadRecommended}
            className="mission-btn"
            title="Load optimal settings"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Sparkles size={12} color="var(--cat-yellow)" />
            Load Target
          </button>
          <button
            onClick={onReset}
            className="mission-btn"
            title="Reset to default"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* 1. Universal Control: Power Mode */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }}>
          <span>Power Mode</span>
          <span style={{ color: 'var(--cat-yellow)' }}>
            {parameters.power_mode === 'Eco' ? 'Eco (Fuel Saver)' : parameters.power_mode === 'Smart' ? 'Smart (Standard)' : 'Power (Heavy Duty)'}
          </span>
        </div>
        <div className="btn-group-3">
          {[
            { id: 'Eco', label: 'Eco', sub: 'Low Fuel' },
            { id: 'Smart', label: 'Smart', sub: 'Auto-Power' },
            { id: 'Power', label: 'Power', sub: 'Heavy Duty' }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`opt-btn ${parameters.power_mode === mode.id ? 'active' : ''}`}
              onClick={() => onChange({ ...parameters, power_mode: mode.id })}
            >
              <div>{mode.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.75 }}>{mode.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Universal Control: Throttle Dial (Engine RPM) */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }}>
          <span>Engine Throttle</span>
          <span style={{ color: 'var(--cat-yellow)', fontFamily: 'monospace', fontWeight: '800' }}>
            {parameters.engine_rpm} RPM
          </span>
        </div>
        <input
          type="range"
          min={rpmMin}
          max={rpmMax}
          step={25}
          value={parameters.engine_rpm}
          onChange={(e) => onChange({ ...parameters, engine_rpm: parseInt(e.target.value) })}
          className="cab-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>Low ({rpmMin})</span>
          <span>Mid ({Math.round((rpmMin + rpmMax) / 2)})</span>
          <span>Max ({rpmMax})</span>
        </div>
      </div>

      {/* 3. Universal Control: Control Response / Hydraulic Speed */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }}>
          <span>Joystick Speed</span>
          <span style={{ color: 'var(--cat-yellow)' }}>
            {parameters.hydraulic_response === 'Fine' ? 'Fine (Precision)' : parameters.hydraulic_response === 'Medium' ? 'Medium (Normal)' : 'Quick (Fast Cycles)'}
          </span>
        </div>
        <div className="btn-group-3">
          {[
            { id: 'Fine', label: 'Fine', desc: 'Precision' },
            { id: 'Medium', label: 'Normal', desc: 'Balanced' },
            { id: 'Quick', label: 'Fast', desc: 'Rapid' }
          ].map((hyd) => (
            <button
              key={hyd.id}
              type="button"
              className={`opt-btn ${parameters.hydraulic_response === hyd.id ? 'active' : ''}`}
              onClick={() => onChange({ ...parameters, hydraulic_response: hyd.id })}
            >
              <div>{hyd.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.75 }}>{hyd.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Environmental & Operating Features: Weather, Ground Condition, Planned Time */}
      <div style={{ padding: '10px', backgroundColor: '#0D1117', borderRadius: '6px', border: '1px solid var(--panel-border)', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--cat-yellow)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Site & Environmental Factors
        </div>

        {/* Weather Selector */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span>Weather Condition</span>
            <span style={{ color: '#fff', fontWeight: '600' }}>{parameters.weather || 'Sunny'}</span>
          </div>
          <div className="btn-group-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {['Sunny', 'Cloudy', 'Rainy', 'Windy'].map((w) => (
              <button
                key={w}
                type="button"
                className={`opt-btn ${ (parameters.weather || 'Sunny') === w ? 'active' : ''}`}
                onClick={() => onChange({ ...parameters, weather: w })}
                style={{ padding: '4px 6px', fontSize: '11px' }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Ground Condition Selector */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span>Ground Condition / Soil</span>
            <span style={{ color: '#fff', fontWeight: '600' }}>{parameters.ground_condition || 'Dry'}</span>
          </div>
          <div className="btn-group-3">
            {['Dry', 'Wet', 'Muddy'].map((g) => (
              <button
                key={g}
                type="button"
                className={`opt-btn ${ (parameters.ground_condition || 'Dry') === g ? 'active' : ''}`}
                onClick={() => onChange({ ...parameters, ground_condition: g })}
                style={{ padding: '4px 6px', fontSize: '11px' }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Planned Time Target */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span>Planned Duration</span>
            <span style={{ color: 'var(--cat-yellow)', fontFamily: 'monospace', fontWeight: '700' }}>
              {parameters.planned_time_min || 60} min
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={180}
            step={5}
            value={parameters.planned_time_min || 60}
            onChange={(e) => onChange({ ...parameters, planned_time_min: parseFloat(e.target.value) })}
            className="cab-slider"
          />
        </div>
      </div>

      {/* 5 & 6. Dynamic Machine-Specific Signature Controls */}
      {machine?.cab_controls?.map((ctrl) => {
        if (ctrl.type === 'slider') {
          const val = parameters[ctrl.id] !== undefined ? parameters[ctrl.id] : ctrl.default;
          return (
            <div key={ctrl.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }}>
                <span>{ctrl.label}</span>
                <span style={{ color: 'var(--cat-yellow)', fontFamily: 'monospace', fontWeight: '800' }}>
                  {val}{ctrl.unit || ''}
                </span>
              </div>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step || 1}
                value={val}
                onChange={(e) => onChange({ ...parameters, [ctrl.id]: parseFloat(e.target.value) })}
                className="cab-slider"
              />
              {ctrl.labels && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {ctrl.labels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (ctrl.type === 'buttons') {
          const activeVal = parameters[ctrl.id] !== undefined ? parameters[ctrl.id] : ctrl.default;
          const activeOption = ctrl.options.find((o) => o.id === activeVal);
          return (
            <div key={ctrl.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }}>
                <span>{ctrl.label}</span>
                <span style={{ color: 'var(--cat-yellow)' }}>
                  {activeOption ? `${activeOption.label}${activeOption.sub ? ` (${activeOption.sub})` : ''}` : activeVal}
                </span>
              </div>
              <div className="btn-group-3">
                {ctrl.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`opt-btn ${activeVal === opt.id ? 'active' : ''}`}
                    onClick={() => onChange({ ...parameters, [ctrl.id]: opt.id })}
                  >
                    <div>{opt.label}</div>
                    {opt.sub && <div style={{ fontSize: '10px', opacity: 0.75 }}>{opt.sub}</div>}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* 6. Cat Smart Assist Switch */}
      <div style={{ marginBottom: '20px' }}>
        <div
          onClick={() => onChange({ ...parameters, assist_tech_enabled: !parameters.assist_tech_enabled })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#0D1117',
            borderRadius: '6px',
            border: `1px solid ${parameters.assist_tech_enabled ? 'var(--cat-yellow)' : 'var(--panel-border)'}`,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color={parameters.assist_tech_enabled ? 'var(--cat-yellow)' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Cat Smart Assist</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {machine?.assist_technology || 'Auto-dig and grade assistance'}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            padding: '3px 10px',
            borderRadius: '4px',
            backgroundColor: parameters.assist_tech_enabled ? 'var(--cat-yellow)' : '#21262d',
            color: parameters.assist_tech_enabled ? '#000' : '#8b949e'
          }}>
            {parameters.assist_tech_enabled ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>

      {/* Big Action Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onSimulate}
        disabled={isLoading}
        className="btn-test-settings"
      >
        <Play size={18} fill="#000" />
        <span>{isLoading ? 'Checking Machine Response...' : 'Test My Settings'}</span>
      </motion.button>
    </div>
  );
}
