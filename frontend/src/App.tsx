import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AudioUploader } from './components/AudioUploader';
import { MetricsPanel } from './components/MetricsPanel';
import { TranscriptViewer } from './components/TranscriptViewer';
import { EvaluationPanel } from './components/EvaluationPanel';
import type { HealthResponse, TranscriptionResponse } from './types';
import { apiService } from './services/api';
import { Sparkles, Terminal } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [transcription, setTranscription] = useState<TranscriptionResponse | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setCheckingHealth(true);
      setHealthError(null);
      const res = await apiService.getHealth();
      setHealth(res);
    } catch (err: unknown) {
      setHealth(null);
      if (err instanceof Error) {
        setHealthError(err.message);
      } else {
        setHealthError('Failed to connect to backend.');
      }
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleTranscribe = async (file: File) => {
    try {
      setIsTranscribing(true);
      setTranscribeError(null);
      const result = await apiService.transcribe(file);
      setTranscription(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTranscribeError(err.message);
      } else {
        setTranscribeError('An error occurred during audio transcription.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        health={health}
        healthError={healthError}
        checkingHealth={checkingHealth}
        onRefreshHealth={fetchHealth}
      />

      <main className="container" style={{ flex: 1 }}>
        {/* Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(99, 102, 241, 0.08))',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              flexShrink: 0,
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Zero-Cost Local Automatic Speech Recognition & Benchmarking
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Powered by faster-whisper CTranslate2 runtime with int8 quantization and standard Word Error Rate (WER) metrics.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
              <Terminal size={12} />
              <span>FastAPI + PyAV + jiwer</span>
            </div>
          </div>
        </div>

        {/* Dashboard 2-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}>
          {/* Left Column: Upload & Hardware Performance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <AudioUploader
              onTranscribe={handleTranscribe}
              isLoading={isTranscribing}
              error={transcribeError}
              onClearError={() => setTranscribeError(null)}
            />

            {transcription && (
              <MetricsPanel data={transcription} />
            )}
          </div>

          {/* Right Column: Transcription Output & WER Evaluation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <TranscriptViewer data={transcription} />

            <EvaluationPanel hypothesisText={transcription ? transcription.text : ''} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        padding: '1.25rem 0',
        marginTop: '2.5rem',
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}>
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>VoxTrace</strong> — Local Speech Intelligence
          </div>
          <div>
            Built with FastAPI, faster-whisper, and React • Free & Local-First
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
