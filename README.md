# VoxTrace — Local Speech Intelligence

[![Backend Tests](https://img.shields.io/badge/pytest-29%20passed-brightgreen.svg)](#testing)
[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#licensing)
[![Cost](https://img.shields.io/badge/cost-%E2%82%B90%20(100%25%20Local)-blueviolet.svg)](#privacy--zero-cost-architecture)

> **VoxTrace** is an on-device Automatic Speech Recognition (ASR) intelligence system and evaluation platform running 100% locally on Windows. It delivers speech-to-text decoding, segment timestamping, multi-format transcript export (TXT, SRT, JSON), and standardized Word Error Rate (WER) evaluation with Levenshtein alignment breakdown.

---

## 1. Engineering Motivation & Project Overview

Many AI engineering candidates showcase projects that simply invoke closed-source cloud APIs (e.g. OpenAI Whisper API, Deepgram). While functional, this leaves key production AI engineering competencies unaddressed:
* **Inference optimization**: How to deploy models on edge/consumer hardware under strict memory budgets.
* **Quantization**: Leveraging integer quantization (`int8`) to reduce compute latency and model RAM footprint by up to 70%.
* **Standardized evaluation**: Quantifying model accuracy using Levenshtein distance on words (Word Error Rate), rather than subjective inspection.
* **Privacy & Cost**: Achieving $\text{₹}0$ operating cost and total data privacy by keeping all audio processing entirely on-device.

VoxTrace was built from the ground up to solve these engineering challenges on a consumer laptop with 8 GB RAM and an AMD Ryzen 5 processor.

---

## 2. Key Features

* **Real Local Transcription**: Runs offline via `faster-whisper` (CTranslate2 inference engine) using the `tiny` model in `int8` precision.
* **Timestamped Segments**: Generates precise start and end time boundaries for every sentence or spoken phrase.
* **Production Performance Metrics**: Measures wall-clock decoding latency and calculates the **Real-Time Factor (RTF)** and throughput speedup.
* **Transcript Exports**: One-click downloads for:
  * **`.TXT`**: Clean continuous text document.
  * **`.SRT`**: Standard SubRip subtitles with accurate `HH:MM:SS,mmm` millisecond timecode boundaries and minute/hour rollovers.
  * **`.JSON`**: Complete structured payload including segment timestamps, confidence score, and hardware metadata.
* **ASR Quality Benchmarking (WER)**: Evaluates hypothesis transcripts against ground-truth reference text using `jiwer 4.0.0` with:
  * Word Error Rate percentage ($\text{WER}\%$).
  * Levenshtein error breakdown: Substitutions ($S$), Deletions ($D$), Insertions ($I$), and Hits ($H$).
  * Automated case and punctuation normalization.
* **Modern Reactive UI**: Fast React 19 + TypeScript + Vite dashboard with drag-and-drop file upload, audio player preview, and zero UI library bloat ($< 80\text{ KB}$ gzipped).

---

## 3. Technology Stack

| Layer | Technologies | Rationale |
| :--- | :--- | :--- |
| **ASR Engine** | `faster-whisper` 1.2.1 (`CTranslate2` 4.8.2) | 4x faster inference than vanilla Whisper with 70% lower memory footprint via `int8` quantization. |
| **Audio Processing** | `PyAV` 13.1.0 (`av<14`), `FFmpeg` | High-performance audio stream decoding and format conversion. |
| **Evaluation** | `jiwer` 4.0.0 | Standardized Word Error Rate (WER) calculation and word-level alignment. |
| **Backend API** | `FastAPI` 0.143.0, `Uvicorn`, `Pydantic` 2.14 | Typed, high-throughput asynchronous REST API endpoints with automated OpenAPI documentation. |
| **Testing** | `pytest` 9.1.1, `Starlette TestClient` | 29 automated offline unit and integration tests. |
| **Frontend** | React 19, TypeScript, Vite 8, `lucide-react` | Strict typed contracts, instant Hot Module Replacement (HMR), responsive dark UI. |

---

## 4. Architecture & Data Flow

```text
[Audio File Upload]
        │
        ▼
[FastAPI Ingestion /api/v1/transcribe] ──> Validates format (.wav, .mp3, .m4a, .ogg, .flac)
        │
        ▼
[faster-whisper Engine (CTranslate2)] ──> int8 AVX2 CPU inference (4 threads)
        │
        ├──> Extracts Segment Timestamps (start, end, text)
        └──> Computes Processing Latency & Real-Time Factor (RTF)
        │
        ▼
[Frontend Workspace]
        │
        ├──> [Export Service /api/v1/export/{format}] ──> .TXT, .SRT Subtitles, .JSON
        │
        └──> [WER Evaluator /api/v1/evaluate] ─────────> Computes WER%, S, D, I, H
```

For detailed architecture diagrams and subsystem breakdowns, see [docs/architecture.md](docs/architecture.md).

---

## 5. Getting Started (Windows Setup)

### Prerequisites
* Windows 10/11 (64-bit).
* Python 3.12 (Installed via Python Launcher or `uv`).
* Node.js 18+ (Node 20 or 24 recommended).
* FFmpeg on your system `PATH`.

### Step 1: Clone or Open the Workspace
```powershell
cd "d:\Revanth projects\VoxTrace — Local Speech Intelligence"
```

### Step 2: Set Up Python Backend with `uv`
```powershell
# Create an isolated Python 3.12 virtual environment
uv venv --python 3.12 backend/.venv

# Install pinned dependencies
uv pip install --python backend\.venv\Scripts\python.exe -r backend/requirements.txt
```

### Step 3: Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

---

## 6. Running VoxTrace Locally

Open **two separate PowerShell terminals**:

### Terminal 1 — Start the FastAPI Backend:
```powershell
cd "d:\Revanth projects\VoxTrace — Local Speech Intelligence\backend"
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will run at `http://127.0.0.1:8000` (API documentation at `http://127.0.0.1:8000/docs`).*

### Terminal 2 — Start the React Dashboard:
```powershell
cd "d:\Revanth projects\VoxTrace — Local Speech Intelligence\frontend"
npm run dev
```
*Frontend will run at `http://localhost:5173`.*

---

## 7. API Endpoints

### `GET /api/v1/health`
Returns system status, active model, and hardware configuration.
```json
{
  "status": "healthy",
  "project": "VoxTrace",
  "version": "0.1.0",
  "device": "cpu",
  "compute_type": "int8",
  "model_name": "tiny"
}
```

### `POST /api/v1/transcribe`
Accepts `multipart/form-data` with an audio `file`.
```powershell
# PowerShell upload example:
curl.exe -X POST "http://127.0.0.1:8000/api/v1/transcribe" -F "file=@../samples/sample_test.wav"
```
**Response**:
```json
{
  "text": "Welcome to Vox Trace. Local Speech Intelligence running entirely on your machine.",
  "segments": [
    { "id": 0, "start": 0.0, "end": 2.0, "text": "Welcome to Vox Trace." },
    { "id": 1, "start": 2.0, "end": 6.383, "text": "Local Speech Intelligence running entirely on your machine." }
  ],
  "language": "en",
  "language_probability": 0.9842,
  "duration_seconds": 6.383,
  "processing_time_seconds": 0.935,
  "real_time_factor": 0.146,
  "device": "cpu",
  "compute_type": "int8",
  "model_name": "tiny"
}
```

### `POST /api/v1/evaluate`
Evaluates a hypothesis transcript against ground-truth reference text.
```json
{
  "reference": "Welcome to VoxTrace. Local speech intelligence running entirely on your machine.",
  "hypothesis": "Welcome to Vox Trace. Local Speech Intelligence running entirely on your machine.",
  "normalize": true
}
```
**Response**:
```json
{
  "wer": 0.1818,
  "wer_percent": 18.18,
  "substitutions": 1,
  "deletions": 0,
  "insertions": 1,
  "hits": 10,
  "reference_word_count": 11,
  "hypothesis_word_count": 12,
  "normalized_reference": "welcome to voxtrace local speech intelligence running entirely on your machine",
  "normalized_hypothesis": "welcome to vox trace local speech intelligence running entirely on your machine",
  "policy_note": null
}
```

### `POST /api/v1/export/{format}`
Exports the transcription into `txt`, `srt`, or `json` format with appropriate `Content-Disposition: attachment` headers.

---

## 8. Benchmark Methodology & Measured Results

### Test Environment
* **Processor**: AMD Ryzen 5 5600H (6 Cores, 12 Threads, AVX2 SIMD enabled).
* **RAM**: 8 GB System RAM (~1.0 GB physical free RAM baseline).
* **Model**: `Systran/faster-whisper-tiny` (~39M parameters).
* **Precision**: `int8` Quantization (4 CPU threads).
* **OS**: Windows 11 (64-bit).

### Reproducible Benchmark Results (Measured Locally)
To reproduce these exact benchmarks on your machine, run:
```powershell
backend\.venv\Scripts\python.exe backend/benchmark.py
```

| Sample | Audio Length | Processing Time | Real-Time Factor (RTF) | Speed Multiplier | WER (%) | Substitutions (S) | Deletions (D) | Insertions (I) | Hits (H) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sample 1: Introduction** (`sample_test.wav`) | 6.38s | 1.093s | **0.171** | **5.8x** | 18.18% | 1 | 0 | 1 | 10 |
| **Sample 2: Technical Description** (`sample_technical.wav`) | 9.67s | 1.209s | **0.125** | **8.0x** | 13.64% | 2 | 0 | 1 | 20 |

> [!NOTE]
> **Performance Nuance**: The Real-Time Factor (RTF) is calculated as $\text{Processing Time} / \text{Audio Duration}$. An RTF of $0.125$ means 1 minute of audio is transcribed in $7.5$ seconds. Performance varies based on background noise, audio complexity, and available CPU cores.

---

## 9. Testing

The project includes 29 automated tests across evaluation logic, timecode formatting, and API routes. Tests are completely offline and mock model inference to guarantee instant execution ($< 2.5\text{s}$) without downloading external weights.

```powershell
# Run the test suite:
backend\.venv\Scripts\pytest.exe -v
```

```text
tests/test_api.py (10 tests) .................... PASSED
tests/test_evaluator.py (10 tests) .............. PASSED
tests/test_exporter.py (9 tests) ................ PASSED

======================== 29 passed in 1.85s ========================
```

---

## 10. Troubleshooting & Known Engineering Issues

1. **Python 3.14 Pre-release Wheels**:
   * *Problem*: Python 3.14 is pre-release/preview; binary wheels for CTranslate2 and PyTorch do not exist yet on PyPI.
   * *Solution*: VoxTrace strictly pins `Python 3.12` via `uv venv --python 3.12`.
2. **PyAV `metadata_errors` Breaking Change**:
   * *Problem*: In `av==19.0.1`, PyAV removed the `metadata_errors` keyword argument, causing `faster-whisper`'s `decode_audio` to crash with `TypeError`.
   * *Solution*: Pinned `av<14` (installed `av==13.1.0`) in `requirements.txt`.
3. **Windows File Locking**:
   * *Problem*: `tempfile.NamedTemporaryFile` locks files on Windows when read by FFmpeg.
   * *Solution*: Staged audio bytes in a custom `voxtrace_uploads/` directory and unlinked in a guaranteed `finally` block.

---

## 11. Privacy & Zero-Cost Architecture

* **100% On-Device Processing**: Audio recordings uploaded to VoxTrace are transcribed on your machine's CPU/GPU. No audio bytes or metadata are ever transmitted over the network.
* **Initial Weight Download**: During the very first launch, `faster-whisper` downloads the open-source model weights (~75 MB for `tiny`) from Hugging Face Hub to your local cache (`~/.cache/huggingface/hub`). Once downloaded, the application works completely offline.
* **₹0 Operating Cost**: No API keys, subscriptions, or cloud infrastructure required.

---

## 12. Roadmap

- [ ] **Model Size Switcher**: Add UI selector to dynamically load `base` (~140 MB) or `small` (~460 MB) models if system RAM permits.
- [ ] **Windows CUDA Verification**: Provide an automated cuDNN DLL detector to enable hardware-accelerated GPU inference on NVIDIA GTX 1650.
- [ ] **Live Microphone Recording**: Integrate browser `MediaRecorder` API to record directly from laptop microphone.
- [ ] **Speaker Diarization**: Add local voice clustering to distinguish multiple speakers.

---

## Licensing
This project is licensed under the MIT License. Whisper model weights are provided under the Apache 2.0 license by OpenAI / Systran.
