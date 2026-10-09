import React from 'react';
import { Gauge, Clock, Cpu, Globe, Zap } from 'lucide-react';
import type { TranscriptionResponse } from '../types';

interface MetricsPanelProps {
  data: TranscriptionResponse;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const speedup = data.real_time_factor > 0 ? (1 / data.real_time_factor).toFixed(1) : '—';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gauge size={20} color="var(--accent-emerald)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Inference Performance
          </h2>
        </div>
        <span className="badge badge-emerald">
          <Zap size={12} />
          {speedup}x Real-Time
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
      }}>
        {/* Real-Time Factor */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Zap size={14} color="var(--accent-cyan)" />
            <span>Real-Time Factor</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
            {data.real_time_factor}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            RTF = Time / Duration
          </div>
        </div>

        {/* Processing Time */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Clock size={14} color="var(--accent-emerald)" />
            <span>Processing Time</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
            {data.processing_time_seconds}s
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Wall clock latency
          </div>
        </div>

        {/* Audio Duration */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Clock size={14} color="var(--accent-amber)" />
            <span>Audio Length</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }}>
            {data.duration_seconds}s
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Sample duration
          </div>
        </div>

        {/* Language */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Globe size={14} color="#a78bfa" />
            <span>Language</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c084fc', marginTop: '0.2rem' }}>
            {data.language.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {(data.language_probability * 100).toFixed(1)}% confidence
          </div>
        </div>
      </div>

      {/* Hardware footprint tag */}
      <div style={{
        background: 'var(--bg-tertiary)',
        padding: '0.6rem 0.85rem',
        borderRadius: '6px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Cpu size={14} />
          <span>Execution Target:</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          {data.model_name} • {data.device.toUpperCase()} ({data.compute_type})
        </span>
      </div>
    </div>
  );
};
