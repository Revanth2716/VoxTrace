export interface HealthResponse {
  status: string;
  project: string;
  version: string;
  device: string;
  compute_type: string;
  model_name: string;
}

export interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResponse {
  text: string;
  segments: Segment[];
  language: string;
  language_probability: number;
  duration_seconds: number;
  processing_time_seconds: number;
  real_time_factor: number;
  device: string;
  compute_type: string;
  model_name: string;
}

export interface EvaluationRequest {
  reference: string;
  hypothesis: string;
  normalize: boolean;
}

export interface EvaluationResponse {
  wer: number;
  wer_percent: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  hits: number;
  reference_word_count: number;
  hypothesis_word_count: number;
  normalized_reference: string;
  normalized_hypothesis: string;
  policy_note?: string | null;
}

export type ExportFormat = 'txt' | 'srt' | 'json';
