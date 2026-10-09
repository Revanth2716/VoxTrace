import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2,
  Sliders,
} from 'lucide-react';
import type { EvaluationResponse } from '../types';
import { apiService } from '../services/api';

interface EvaluationPanelProps {
  hypothesisText: string;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ hypothesisText }) => {
  const [referenceText, setReferenceText] = useState(
    'Welcome to VoxTrace. Local speech intelligence running entirely on your machine.'
  );
  const [normalize, setNormalize] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResponse | null>(null);

  const handleEvaluate = async () => {
    if (!referenceText.trim()) {
      setError('Please provide a non-empty ground-truth reference transcript.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const evalRes = await apiService.evaluate({
        reference: referenceText,
        hypothesis: hypothesisText,
        normalize,
      });
      setResult(evalRes);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during evaluation.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getWerColor = (wer: number) => {
    if (wer === 0) return '#10b981'; // Green
    if (wer <= 0.2) return '#06b6d4'; // Cyan
    if (wer <= 0.4) return '#f59e0b'; // Amber
    return '#f43f5e'; // Red
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            ASR Accuracy & WER Evaluation
          </h2>
        </div>
        <span className="badge badge-cyan">jiwer Engine</span>
      </div>

      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
        Benchmark model hypothesis against known ground-truth text using standard Word Error Rate.
      </p>

      {/* Input Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.35rem',
          }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Ground-Truth Reference Transcript:
            </label>
            <button
              onClick={() =>
                setReferenceText(
                  'Welcome to VoxTrace. Local speech intelligence running entirely on your machine.'
                )
              }
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-cyan)',
                textDecoration: 'underline',
              }}
            >
              Insert Demo Ground Truth
            </button>
          </div>
          <textarea
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            placeholder="Paste verified ground-truth reference text here..."
            rows={3}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              padding: '0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Normalization & Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={normalize}
              onChange={(e) => setNormalize(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan)' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sliders size={13} />
              Normalize Case & Punctuation (Recommended)
            </span>
          </label>

          <button
            onClick={handleEvaluate}
            disabled={isLoading || !referenceText.trim()}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Calculate WER</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#fb7185',
          fontSize: '0.825rem',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Evaluation Results */}
      {result && (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: getWerColor(result.wer),
                lineHeight: 1,
              }}>
                {result.wer_percent}%
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Word Error Rate (WER)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Score: {result.wer} (Lower is better)
                </div>
              </div>
            </div>

            <div className="badge badge-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              WER = (S + D + I) / N
            </div>
          </div>

          {/* Breakdown Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '0.5rem',
          }}>
            <div style={{
              background: 'var(--bg-elevated)',
              padding: '0.6rem',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hits (H)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399' }}>
                {result.hits}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '0.6rem',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Substitutions (S)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fbbf24' }}>
                {result.substitutions}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '0.6rem',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deletions (D)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171' }}>
                {result.deletions}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '0.6rem',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Insertions (I)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#c084fc' }}>
                {result.insertions}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '0.6rem',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ref Words (N)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {result.reference_word_count}
              </div>
            </div>
          </div>

          {/* Policy note if present */}
          {result.policy_note && (
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
            }}>
              ℹ️ {result.policy_note}
            </div>
          )}

          {/* Normalized alignment preview */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Normalized Reference: </span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                "{result.normalized_reference}"
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Normalized Hypothesis: </span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                "{result.normalized_hypothesis || '[empty]'}"
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
