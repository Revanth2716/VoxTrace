import type {
  HealthResponse,
  TranscriptionResponse,
  EvaluationRequest,
  EvaluationResponse,
  ExportFormat,
} from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Body was not JSON
    }
    throw new ApiError(errorDetail, res.status);
  }
  return res.json() as Promise<T>;
}

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await handleResponse<HealthResponse>(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        'Unable to connect to VoxTrace local backend. Make sure the FastAPI service is running on port 8000.',
        0
      );
    }
  },

  async transcribe(file: File): Promise<TranscriptionResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        body: formData,
      });
      return await handleResponse<TranscriptionResponse>(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        'Transcription failed. Verify that your backend is running and the audio format is valid.',
        0
      );
    }
  },

  async evaluate(req: EvaluationRequest): Promise<EvaluationResponse> {
    try {
      const res = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });
      return await handleResponse<EvaluationResponse>(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        'Evaluation failed. Please verify reference text input.',
        0
      );
    }
  },

  async exportTranscript(format: ExportFormat, data: TranscriptionResponse): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new ApiError(errJson.detail || `Export failed with code ${res.status}`, res.status);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Failed to download transcript export.', 0);
    }
  },
};
