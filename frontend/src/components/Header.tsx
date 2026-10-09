import React from 'react';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';
import type { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  healthError: string | null;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  healthError,
  checkingHealth,
  onRefreshHealth,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-secondary)',
      padding: '1rem 0',
      marginBottom: '1.5rem',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0 1rem',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
          }}>
            <Activity size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                VoxTrace
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                v0.1.0
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Local Speech Intelligence & ASR Evaluation
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Privacy badge */}
          <div className="badge badge-emerald" title="Audio is processed 100% on this laptop using local faster-whisper. No data leaves your machine.">
            <ShieldCheck size={14} />
            <span>100% Local • ₹0 Cost</span>
          </div>

          {/* Backend Status */}
          {health ? (
            <div
              className="badge badge-emerald"
              style={{ cursor: 'pointer' }}
              onClick={onRefreshHealth}
              title="Click to re-check backend status"
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }} className="animate-pulse" />
              <span>
                {health.model_name.toUpperCase()} on {health.device.toUpperCase()} ({health.compute_type})
              </span>
            </div>
          ) : (
            <div
              className="badge badge-rose"
              style={{ cursor: 'pointer' }}
              onClick={onRefreshHealth}
              title={healthError || 'Backend disconnected. Click to retry.'}
            >
              <Cpu size={14} />
              <span>{checkingHealth ? 'Connecting...' : 'Backend Offline'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
