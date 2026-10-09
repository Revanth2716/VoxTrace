import shutil
import tempfile
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas.transcription import (
    ExportFormat,
    HealthResponse,
    TranscriptionResponse,
)
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.services.transcriber import transcriber_service
from app.services.evaluator import evaluate_wer
from app.services.exporter import export_srt, export_txt, export_json

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Local Speech Intelligence API powered by faster-whisper",
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(f"{settings.API_V1_PREFIX}/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        device=transcriber_service.device,
        compute_type=transcriber_service.compute_type,
        model_name=transcriber_service.model_name,
    )

@app.post(f"{settings.API_V1_PREFIX}/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    # Validate file extension
    filename = file.filename or ""
    suffix = Path(filename).suffix.lower()
    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported audio format '{suffix}'. "
                f"Allowed formats: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
            ),
        )

    # Safely save uploaded bytes to temporary file on Windows
    temp_dir = Path(tempfile.gettempdir()) / "voxtrace_uploads"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = temp_dir / f"upload_{tempfile.mktemp()[-8:]}{suffix}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Execute local transcription
        result = transcriber_service.transcribe(temp_path)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription error: {str(e)}",
        )
    finally:
        # Guarantee cleanup on Windows filesystem
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

@app.post(f"{settings.API_V1_PREFIX}/evaluate", response_model=EvaluationResponse)
async def evaluate_transcript(request: EvaluationRequest):
    """
    Evaluate hypothesis against reference ground truth to compute Word Error Rate (WER).
    """
    try:
        result = evaluate_wer(
            reference=request.reference,
            hypothesis=request.hypothesis,
            normalize=request.normalize,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation error: {str(e)}",
        )

@app.post(f"{settings.API_V1_PREFIX}/export/{{export_format}}")
async def export_transcript(
    export_format: str,
    transcription: TranscriptionResponse,
):
    """
    Export transcription data in TXT, SRT, or JSON formats with appropriate media headers.
    """
    fmt_lower = export_format.lower()
    if fmt_lower not in {f.value for f in ExportFormat}:
        allowed = ", ".join(sorted([f.value for f in ExportFormat]))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported export format '{export_format}'. Allowed formats: {allowed}",
        )

    if fmt_lower == ExportFormat.TXT.value:
        content = export_txt(transcription.text)
        media_type = "text/plain; charset=utf-8"
        filename = "transcript.txt"
    elif fmt_lower == ExportFormat.SRT.value:
        content = export_srt(
            segments=transcription.segments,
            fallback_text=transcription.text,
            duration_seconds=transcription.duration_seconds,
        )
        media_type = "application/x-subrip; charset=utf-8"
        filename = "transcript.srt"
    elif fmt_lower == ExportFormat.JSON.value:
        content = export_json(transcription)
        media_type = "application/json; charset=utf-8"
        filename = "transcript.json"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
