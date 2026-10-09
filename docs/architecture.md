# VoxTrace — System Architecture & Technical Design

## 1. Executive Summary

**VoxTrace** is an on-device Automatic Speech Recognition (ASR) intelligence system designed to process audio files entirely locally on consumer PC hardware without cloud APIs or recurring operational expenses.

The system combines **FastAPI**, **faster-whisper** (CTranslate2 runtime with `int8` quantization), and **jiwer** on the backend, with a reactive **React + TypeScript + Vite** client interface on the frontend.

---

## 2. End-to-End Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 19 + TypeScript + Vite)"]
        UI_UPLOAD[Audio Uploader & Player]
        UI_TRANS[Transcript & Timestamp Viewer]
        UI_METRICS[Inference Metrics Dashboard]
        UI_EVAL[WER Evaluation Panel]
        UI_EXP[Export Buttons: TXT, SRT, JSON]
    end

    subgraph Server["Backend Tier (FastAPI + Python 3.12)"]
        API_ROUTER[FastAPI REST API /api/v1]
        
        subgraph Ingestion["Ingestion & Validation Layer"]
            VAL_EXT{Check File Extension<br/>.wav, .mp3, .m4a, .ogg, .flac}
            TEMP_STORE[Temporary File Staging<br/>voxtrace_uploads/]
        end

        subgraph Inference["Inference Engine (SpeechTranscriber)"]
            FW_INIT[faster-whisper WhisperModel]
            CONFIG[Runtime Config: tiny, cpu, int8, 4 threads]
            FW_RUN[CTranslate2 Beam Search & Segment Generation]
            METRIC_CALC[Calculate Latency & RTF]
        end

        subgraph Evaluation["Evaluation Engine (evaluator.py)"]
            REF_VAL{Validate Reference<br/>N > 0 Words?}
            NORM_PIPELINE[Text Normalizer<br/>Lowercase + Strip Punctuation]
            JIWER_RUN[jiwer.process_words<br/>Levenshtein Alignment]
            METRICS_BREAKDOWN[Calculate WER%, S, D, I, H]
        end

        subgraph ExporterService["Export Service (exporter.py)"]
            TXT_BUILD[Plain Text Formatter]
            SRT_BUILD[SubRip Timecode Formatter<br/>HH:MM:SS,mmm boundaries]
            JSON_BUILD[JSON Segment & Metadata Serializer]
        end
    end

    %% Audio Upload & Transcription Flow
    UI_UPLOAD -->|POST /api/v1/transcribe<br/>Multipart FormData| API_ROUTER
    API_ROUTER --> VAL_EXT
    VAL_EXT -->|Valid| TEMP_STORE
    VAL_EXT -->|Invalid Extension| ERR_400[HTTP 400 Bad Request]
    TEMP_STORE --> FW_INIT
    CONFIG --> FW_INIT
    FW_INIT --> FW_RUN
    FW_RUN --> METRIC_CALC
    METRIC_CALC -->|TranscriptionResponse JSON| API_ROUTER
    API_ROUTER -->|Segments + Full Text| UI_TRANS
    API_ROUTER -->|RTF, Latency, Hardware| UI_METRICS

    %% Evaluation Flow
    UI_EVAL -->|POST /api/v1/evaluate<br/>Reference + Hypothesis + Normalize| API_ROUTER
    API_ROUTER --> REF_VAL
    REF_VAL -->|Empty Reference| ERR_REF[HTTP 400 Validation Error]
    REF_VAL -->|Valid| NORM_PIPELINE
    NORM_PIPELINE --> JIWER_RUN
    JIWER_RUN --> METRICS_BREAKDOWN
    METRICS_BREAKDOWN -->|EvaluationResponse JSON| API_ROUTER
    API_ROUTER -->|WER%, S, D, I, H Cards| UI_EVAL

    %% Export Flow
    UI_EXP -->|POST /api/v1/export/{format}<br/>format: txt, srt, json| API_ROUTER
    API_ROUTER --> TXT_BUILD
    API_ROUTER --> SRT_BUILD
    API_ROUTER --> JSON_BUILD
    TXT_BUILD -->|attachment; transcript.txt| UI_EXP
    SRT_BUILD -->|attachment; transcript.srt| UI_EXP
    JSON_BUILD -->|attachment; transcript.json| UI_EXP
```

---

## 3. Core Subsystems

### 3.1. Ingestion & File Handling
* **Temporary Storage**: Uploaded audio bytes are staged to a dedicated temporary directory (`voxtrace_uploads/`) on the local filesystem.
* **Windows Cleanup Guarantee**: File handles in Windows can lock if read by another process. VoxTrace processes the file and executes unlinking in a guaranteed `finally` block to prevent file descriptor leaks.

### 3.2. Inference Service (`transcriber.py`)
* **Engine**: `faster-whisper` wrapping `CTranslate2`.
* **Model Configuration**:
  * Default: `Systran/faster-whisper-tiny` (~39M parameters, ~75 MB disk footprint).
  * Compute Target: `cpu` with `int8` quantization.
  * Worker Threads: 4 threads pinned to optimize AVX2 SIMD instructions on modern multi-core x86 CPUs.
* **Performance Measurement**:
  * Records wall-clock inference duration using high-precision `time.perf_counter()`.
  * Computes **Real-Time Factor (RTF)**:
    $$\text{RTF} = \frac{\text{Processing Time (s)}}{\text{Audio Duration (s)}}$$
    $$\text{Speedup} = \frac{1}{\text{RTF}}$$

### 3.3. Quality Evaluation Engine (`evaluator.py`)
* **Library**: `jiwer 4.0.0`.
* **Formula**:
  $$\text{WER} = \frac{S + D + I}{N}$$
  Where:
  * $S$: Substitutions (incorrectly recognized words).
  * $D$: Deletions (words omitted from the reference).
  * $I$: Insertions (spurious words added in hypothesis).
  * $H$: Hits (correctly transcribed words).
  * $N$: Total words in reference ($N = H + S + D$).
* **Edge Case Policies**:
  * **Empty Reference**: Raises `ValueError` and returns `HTTP 400 Bad Request` because computing error rate without ground-truth reference words ($N = 0$) is mathematically undefined.
  * **Empty Hypothesis**: Evaluated as complete deletion ($D = N, S = 0, I = 0, H = 0$), yielding $\text{WER} = 1.0$ (100.0%) and a descriptive policy note.
* **Text Normalization**: Strips punctuation, folds case to lower, collapses whitespace, eliminating acoustic-irrelevant formatting discrepancies.

### 3.4. Transcript Exporter (`exporter.py`)
* **SubRip (.srt)**: Generates valid subtitle timecode blocks:
  ```text
  1
  00:00:00,000 --> 00:00:02,500
  Welcome to VoxTrace.
  ```
  Implements custom rollover handling for millisecond rounding, seconds-to-minutes rollover (`59.999s` $\to$ `01:00,000`), and minutes-to-hours rollover (`3599.999s` $\to$ `01:00:00,000`).
* **Plain Text (.txt)**: Emits clean continuous text transcript.
* **JSON (.json)**: Serializes full Pydantic schema with timestamps, language confidence, and hardware metrics.

---

## 4. Frontend Client Tier

* **Framework**: React 19 + TypeScript + Vite.
* **Zero UI Library Bloat**: Pure CSS styling using modern CSS variables and flex/grid layouts. Gzipped bundle footprint is under $80\text{ KB}$.
* **API Service (`api.ts`)**: Type-safe HTTP client with custom `ApiError` class, user-friendly offline error messages, and browser `Blob` download trigger.
