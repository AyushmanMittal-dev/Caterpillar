import React from 'react';
import { Truck, ShieldCheck, AlertCircle } from 'lucide-react';

export default function MachineCard({ machine, machineAge }) {
  if (!machine) return null;

  // Simple machine condition status for operator
  const isAging = machineAge >= 5;
  const isNew = machineAge <= 2;

  return (
    <div className="cab-panel">
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={15} color="var(--cat-yellow)" />
          Active Machine
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: isNew ? 'rgba(46, 160, 67, 0.15)' : isAging ? 'rgba(218, 54, 51, 0.15)' : 'rgba(210, 153, 34, 0.15)',
          color: isNew ? 'var(--accent-green)' : isAging ? 'var(--accent-red)' : 'var(--accent-amber)'
        }}>
          {isNew ? 'Prime Condition (New)' : isAging ? `High Hour Machine (${machineAge} yrs)` : `Normal Fleet (${machineAge} yrs)`}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
            {machine.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Engine: <strong style={{ color: '#fff' }}>{machine.engine_model}</strong> ({machine.net_power_hp} HP)
          </div>
        </div>

        <div style={{
          backgroundColor: '#0D1117',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--panel-border)',
          textAlign: 'right',
          maxWidth: '240px'
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Integrated Tech</div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--cat-yellow)', lineHeight: '1.2', marginTop: '2px' }}>
            {machine.assist_technology || 'Cat Smart Assist'}
          </div>
        </div>
      </div>

      {isAging && (
        <div style={{
          marginTop: '12px',
          padding: '8px 10px',
          borderRadius: '4px',
          backgroundColor: 'rgba(218, 54, 51, 0.1)',
          border: '1px solid rgba(218, 54, 51, 0.25)',
          fontSize: '12px',
          color: '#ff7b72',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>Notice: Older machine components wear faster under continuous max throttle.</span>
        </div>
      )}
    </div>
  );
}
