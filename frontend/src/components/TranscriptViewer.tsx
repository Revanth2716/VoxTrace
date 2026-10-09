import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Copy,
  Check,
  Download,
  ListOrdered,
  FileCode,
} from 'lucide-react';
import type { TranscriptionResponse, ExportFormat } from '../types';
import { apiService } from '../services/api';

interface TranscriptViewerProps {
  data: TranscriptionResponse | null;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'segments'>('text');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleCopy = () => {
    if (!data?.text) return;
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;
    try {
      setExporting(format);
      await apiService.exportTranscript(format, data);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(null);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(2);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  };

  if (!data) {
    return (
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        minHeight: '260px',
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
        }}>
          <FileText size={26} />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Transcription Workspace
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
          Upload an audio file on the left and run transcription to inspect the generated transcript and timestamps.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Generated Transcript
          </h2>
        </div>

        {/* View Toggle Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '2px' }}>
          <button
            onClick={() => setActiveTab('text')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '5px',
              fontSize: '0.78rem',
              fontWeight: 500,
              background: activeTab === 'text' ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === 'text' ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <FileText size={14} />
            <span>Full Text</span>
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '5px',
              fontSize: '0.78rem',
              fontWeight: 500,
              background: activeTab === 'segments' ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === 'segments' ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <ListOrdered size={14} />
            <span>Segments ({data.segments.length})</span>
          </button>
        </div>
      </div>

      {/* Content View */}
      {activeTab === 'text' ? (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '1rem',
          minHeight: '140px',
          maxHeight: '260px',
          overflowY: 'auto',
          fontSize: '0.925rem',
          lineHeight: '1.6',
          color: 'var(--text-primary)',
          position: 'relative',
        }}>
          <button
            onClick={handleCopy}
            className="btn-icon"
            style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}
            title="Copy transcript to clipboard"
          >
            {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
          </button>
          <p style={{ margin: 0, paddingRight: '2rem' }}>
            {data.text || <span style={{ color: 'var(--text-muted)' }}>[No speech detected]</span>}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '260px',
          overflowY: 'auto',
          paddingRight: '0.25rem',
        }}>
          {data.segments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
              No individual segments returned.
            </div>
          ) : (
            data.segments.map((seg) => (
              <div
                key={seg.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-cyan)',
                  background: 'var(--bg-elevated)',
                  padding: '0.2rem 0.45rem',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  <Clock size={12} />
                  <span>{formatSeconds(seg.start)} → {formatSeconds(seg.end)}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>
                  {seg.text}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Export Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Export Transcript:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleExport('txt')}
            disabled={exporting !== null}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <Download size={14} />
            <span>.TXT</span>
          </button>
          <button
            onClick={() => handleExport('srt')}
            disabled={exporting !== null}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <FileCode size={14} />
            <span>.SRT Subtitles</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting !== null}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <Download size={14} />
            <span>.JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
