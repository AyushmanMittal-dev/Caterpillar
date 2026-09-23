import React from 'react';
import { Sun, CloudRain, Cloud, Wind, Clock, HardHat, Calendar } from 'lucide-react';

export default function TaskSelector({ currentTask }) {
  if (!currentTask) return null;

  const getWeatherIcon = (weather) => {
    switch (weather) {
      case 'Rainy': return <CloudRain size={15} style={{ color: '#58a6ff' }} />;
      case 'Windy': return <Wind size={15} style={{ color: '#c9d1d9' }} />;
      case 'Cloudy': return <Cloud size={15} style={{ color: '#8b949e' }} />;
      case 'Sunny':
      default:
        return <Sun size={15} style={{ color: 'var(--cat-yellow)' }} />;
    }
  };

  return (
    <div className="cab-panel" style={{ borderLeft: '4px solid var(--cat-yellow)' }}>
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HardHat size={15} color="var(--cat-yellow)" />
          Job Briefing &bull; Mission #{currentTask.mission_number}
        </span>
        <span style={{
          backgroundColor: 'rgba(255, 205, 0, 0.15)',
          color: 'var(--cat-yellow)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: '700'
        }}>
          Target: {currentTask.target_time_min} mins
        </span>
      </div>

      <h2 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
        {currentTask.title}
      </h2>

      {/* Practical Job Description */}
      <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#c9d1d9', marginBottom: '14px' }}>
        {currentTask.problem_statement}
      </p>

      {/* Site Condition Badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#0D1117',
          padding: '4px 10px',
          borderRadius: '4px',
          border: '1px solid var(--panel-border)'
        }}>
          {getWeatherIcon(currentTask.weather)}
          <span>{currentTask.weather} ({currentTask.temperature_c}&deg;C)</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#0D1117',
          padding: '4px 10px',
          borderRadius: '4px',
          border: '1px solid var(--panel-border)'
        }}>
          <Calendar size={13} color="var(--cat-yellow)" />
          <span>Machine Age: <strong>{currentTask.machine_age_years} yrs</strong></span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#0D1117',
          padding: '4px 10px',
          borderRadius: '4px',
          border: '1px solid var(--panel-border)'
        }}>
          <Clock size={13} color="#58a6ff" />
          <span>Site Benchmark: <strong>{currentTask.actual_benchmark_min} mins</strong></span>
        </div>
      </div>
    </div>
  );
}
