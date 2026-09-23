import React from 'react';
import { Clock, Fuel, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TelemetryScreen({ simulationResult, isRunning, targetTime, benchmarkTime }) {
  if (isRunning) {
    return (
      <div className="cab-panel" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--panel-border)', borderTopColor: 'var(--cat-yellow)', marginBottom: '14px' }}
        />
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
          Testing Machine Response...
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Calculating cycle speed, fuel, and hydraulic pressure
        </div>
      </div>
    );
  }

  if (!simulationResult) {
    return (
      <div className="cab-panel" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-muted)' }}>
          Settings Not Tested Yet
        </div>
        <div style={{ fontSize: '13px', color: '#6e7681', marginTop: '6px', textAlign: 'center', maxWidth: '320px' }}>
          Adjust your Power Mode, Throttle, and Controls on the left, then click <strong>"Test My Settings"</strong> to see how the machine will perform.
        </div>
      </div>
    );
  }

  const { predictions, evaluation } = simulationResult;
  const predTime = predictions.predicted_completion_time_min;
  const timeDeltaActual = evaluation.time_delta_actual;
  const stress = predictions.predicted_machine_stress_score;

  const stressColor = stress > 72 ? 'var(--accent-red)' : stress > 52 ? 'var(--accent-amber)' : 'var(--accent-green)';
  const stressLabel = stress > 72 ? 'DANGER: Overheating Risk!' : stress > 52 ? 'High Strain (Watch Heat)' : 'Running Smooth & Safe';

  const isMatched = Math.abs(timeDeltaActual) <= 3.0;

  return (
    <div className="cab-panel">
      <div className="panel-header">
        <span>Machine Performance Results</span>
        <span style={{
          backgroundColor: isMatched ? 'rgba(46, 160, 67, 0.2)' : 'rgba(210, 153, 34, 0.2)',
          color: isMatched ? 'var(--accent-green)' : 'var(--accent-amber)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: '700',
          fontSize: '11px'
        }}>
          Score: {evaluation.score}% &bull; {evaluation.rating_tier}
        </span>
      </div>

      {/* Row 1: Estimated Finish Time */}
      <div className="telemetry-card" style={{ borderLeft: '4px solid var(--cat-yellow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} color="var(--cat-yellow)" /> Estimated Finish Time
          </span>
          <span>Target: {targetTime}m (Benchmark: {benchmarkTime}m)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div className="big-number" style={{ color: 'var(--cat-yellow)' }}>
            {predTime.toFixed(1)}
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>minutes</span>
        </div>

        <div style={{ marginTop: '6px', fontSize: '13px' }}>
          {isMatched ? (
            <span style={{ color: 'var(--accent-green)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={15} /> Spot-on! You hit the target time.
            </span>
          ) : timeDeltaActual > 0 ? (
            <span style={{ color: 'var(--accent-amber)', fontWeight: '600' }}>
              +{timeDeltaActual} mins slower than expected
            </span>
          ) : (
            <span style={{ color: '#58a6ff', fontWeight: '600' }}>
              {timeDeltaActual} mins faster (Check diesel burn)
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Diesel Burn Rate */}
      <div className="telemetry-card" style={{ borderLeft: '4px solid #58a6ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Fuel size={13} color="#58a6ff" /> Diesel Burn Rate
          </span>
          <span>Total: ~{predictions.predicted_total_fuel_liters} Liters</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div className="big-number" style={{ color: '#58a6ff' }}>
            {predictions.predicted_fuel_burn_rate_lph.toFixed(1)}
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>L / hour</span>
        </div>
      </div>

      {/* Row 3: Machine Strain & Heat Bar */}
      <div className="telemetry-card" style={{ borderLeft: `4px solid ${stressColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={13} color={stressColor} /> Machine Strain &amp; Heat
          </span>
          <span style={{ color: stressColor, fontWeight: '700' }}>
            {stressLabel}
          </span>
        </div>

        <div style={{ width: '100%', height: '8px', backgroundColor: '#21262d', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, stress)}%`,
              backgroundColor: stressColor,
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>Safe</span>
          <span>Heavy Load</span>
          <span style={{ color: 'var(--accent-red)' }}>Overheating!</span>
        </div>
      </div>
    </div>
  );
}
