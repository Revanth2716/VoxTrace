from enum import Enum
from pydantic import BaseModel, Field

class ExportFormat(str, Enum):
    TXT = "txt"
    SRT = "srt"
    JSON = "json"

class Segment(BaseModel):
    id: int
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    text: str = Field(..., description="Transcribed segment text")

class TranscriptionResponse(BaseModel):
    text: str = Field(..., description="Full transcribed text")
    segments: list[Segment] = Field(default_factory=list, description="Timestamped segments")
    language: str = Field(default="en", description="Detected language code (e.g. 'en')")
    language_probability: float = Field(default=1.0, description="Confidence probability of detected language")
    duration_seconds: float = Field(default=0.0, description="Duration of processed audio in seconds")
    processing_time_seconds: float = Field(default=0.0, description="Total inference time in seconds")
    real_time_factor: float = Field(default=0.0, description="Real-Time Factor: processing_time / duration")
    device: str = Field(default="cpu", description="Execution device used (cpu or cuda)")
    compute_type: str = Field(default="int8", description="Precision/quantization used (e.g. int8)")
    model_name: str = Field(default="tiny", description="Whisper model name (e.g. tiny)")

class HealthResponse(BaseModel):
    status: str
    project: str
    version: str
    device: str
    compute_type: str
    model_name: str
