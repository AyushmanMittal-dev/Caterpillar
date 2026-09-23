import React, { useState } from 'react';
import { Bot, AlertOctagon, Lightbulb, ChevronDown, ChevronUp, Check } from 'lucide-react';

export default function AssistantAdvice({ simulationResult, currentTask }) {
  const [showTarget, setShowTarget] = useState(false);

  if (!simulationResult) return null;

  const { evaluation } = simulationResult;
  const alerts = evaluation?.alerts || [];
  const tips = evaluation?.coaching_tips || [];
  const optimal = currentTask?.optimal_parameters;

  return (
    <div className="cab-panel" style={{ borderLeft: alerts.length > 0 ? '4px solid var(--accent-red)' : '4px solid var(--accent-green)' }}>
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bot size={15} color="var(--cat-yellow)" />
          Cat Cab Assistant &bull; Advice
        </span>
        {alerts.length > 0 ? (
          <span style={{ color: 'var(--accent-red)', fontWeight: '700', fontSize: '11px' }}>
            Warning
          </span>
        ) : (
          <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '11px' }}>
            All Clear
          </span>
        )}
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                backgroundColor: 'rgba(218, 54, 51, 0.12)',
                border: '1px solid rgba(218, 54, 51, 0.3)',
                padding: '8px 10px',
                borderRadius: '6px',
                color: '#ff7b72',
                fontSize: '12px',
                lineHeight: '1.4',
                marginBottom: '6px'
              }}
            >
              <AlertOctagon size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{alert}</div>
            </div>
          ))}
        </div>
      )}

      {/* Coaching Tips */}
      {tips.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tips.map((tip, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  backgroundColor: '#0D1117',
                  border: '1px solid var(--panel-border)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  color: '#e6edf3'
                }}
              >
                <Lightbulb size={15} style={{ color: 'var(--cat-yellow)', flexShrink: 0, marginTop: '2px' }} />
                <div>{tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show Target Settings Button */}
      <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '10px' }}>
        <button
          onClick={() => setShowTarget(!showTarget)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--cat-yellow)',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0'
          }}
        >
          <span>{showTarget ? 'Hide Target Settings' : 'Show Ideal Settings for this Mission'}</span>
          {showTarget ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showTarget && optimal && (
          <div style={{
            marginTop: '8px',
            backgroundColor: '#0D1117',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid var(--panel-border)',
            fontSize: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', color: 'var(--text-muted)' }}>
              <div>Mode: <strong style={{ color: '#fff' }}>{optimal.power_mode}</strong></div>
              <div>Throttle: <strong style={{ color: '#fff' }}>{optimal.engine_rpm} RPM</strong></div>
              <div>Joystick Speed: <strong style={{ color: '#fff' }}>{optimal.hydraulic_response}</strong></div>
              {optimal.payload_target_pct !== undefined && (
                <div>Bucket Target: <strong style={{ color: '#fff' }}>{optimal.payload_target_pct}%</strong></div>
              )}
              {optimal.dig_priority && (
                <div>Flow Priority: <strong style={{ color: '#fff' }}>{optimal.dig_priority}</strong></div>
              )}
              {optimal.stabilizer_stance && (
                <div>Stabilizers: <strong style={{ color: '#fff' }}>{optimal.stabilizer_stance}</strong></div>
              )}
              {optimal.rimpull_control && (
                <div>Rimpull: <strong style={{ color: '#fff' }}>{optimal.rimpull_control}</strong></div>
              )}
              {optimal.blade_angle && (
                <div>Blade Angle: <strong style={{ color: '#fff' }}>{optimal.blade_angle}</strong></div>
              )}
              {optimal.working_gear && (
                <div>Working Gear: <strong style={{ color: '#fff' }}>{optimal.working_gear}</strong></div>
              )}
              {optimal.tool_flow_rate && (
                <div>Tool Flow: <strong style={{ color: '#fff' }}>{optimal.tool_flow_rate}</strong></div>
              )}
              {optimal.duty_cycle_pct !== undefined && (
                <div>Duty Cycle: <strong style={{ color: '#fff' }}>{optimal.duty_cycle_pct}%</strong></div>
              )}
              <div style={{ gridColumn: 'span 2' }}>
                Smart Assist: <strong style={{ color: 'var(--cat-yellow)' }}>{optimal.assist_tech_enabled ? 'ON' : 'OFF'}</strong>
              </div>
            </div>

            {currentTask.learning_objective && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#8b949e', borderTop: '1px solid var(--panel-border)', paddingTop: '6px' }}>
                <strong style={{ color: 'var(--cat-yellow)' }}>Operator Takeaway:</strong> {currentTask.learning_objective}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
