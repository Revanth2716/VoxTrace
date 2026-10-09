import React, { useState, useRef } from 'react';
import { Upload, FileAudio, AlertCircle, PlayCircle, Loader2, Sparkles, X } from 'lucide-react';

interface AudioUploaderProps {
  onTranscribe: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aac'];

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onTranscribe,
  isLoading,
  error,
  onClearError,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    onClearError();

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(
        `Unsupported audio format '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setValidationError('Audio file exceeds maximum size limit of 50 MB.');
      return;
    }

    setSelectedFile(file);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setValidationError(null);
    onClearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || isLoading) return;
    await onTranscribe(selectedFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileAudio size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Audio Ingestion
          </h2>
        </div>
        <span className="badge badge-muted">Local faster-whisper</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="audio-file-input"
      />

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--accent-cyan)' : 'var(--border-strong)'}`,
          background: dragActive ? 'var(--accent-cyan-glow)' : 'var(--bg-tertiary)',
          borderRadius: '10px',
          padding: '2rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.75rem',
          color: 'var(--accent-cyan)',
        }}>
          <Upload size={24} />
        </div>
        <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Drop your audio file here, or <span style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>browse</span>
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Supports WAV, MP3, M4A, OGG, FLAC (Max 50 MB)
        </p>
      </div>

      {/* Selected File Card */}
      {selectedFile && (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              <PlayCircle size={18} color="var(--accent-emerald)" />
              <div style={{ overflow: 'hidden' }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="btn-icon"
              title="Remove file"
              disabled={isLoading}
            >
              <X size={16} />
            </button>
          </div>

          {/* Audio Player Preview */}
          {audioUrl && (
            <audio
              controls
              src={audioUrl}
              style={{
                width: '100%',
                height: '36px',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
          )}
        </div>
      )}

      {/* Validation or API Error Alerts */}
      {(validationError || error) && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
          color: '#fb7185',
          fontSize: '0.85rem',
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>{validationError || error}</div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading}
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.75rem' }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Transcribing Locally on CPU...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>Transcribe Audio</span>
          </>
        )}
      </button>
    </div>
  );
};
