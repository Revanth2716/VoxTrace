import time
import logging
from pathlib import Path
from faster_whisper import WhisperModel
from app.config import settings
from app.schemas.transcription import Segment, TranscriptionResponse

logger = logging.getLogger("voxtrace.transcriber")
logging.basicConfig(level=logging.INFO)

class SpeechTranscriber:
    def __init__(
        self,
        model_name: str = settings.MODEL_NAME,
        device: str = settings.DEVICE,
        compute_type: str = settings.COMPUTE_TYPE,
        cpu_threads: int = settings.CPU_THREADS,
    ):
        self.model_name = model_name
        self.device = device
        self.compute_type = compute_type
        self.cpu_threads = cpu_threads
        self.model: WhisperModel | None = None
        self._load_model()

    def _load_model(self) -> None:
        logger.info(
            f"Loading Whisper model '{self.model_name}' on {self.device} ({self.compute_type})..."
        )
        try:
            self.model = WhisperModel(
                self.model_name,
                device=self.device,
                compute_type=self.compute_type,
                cpu_threads=self.cpu_threads,
            )
            logger.info("Model loaded successfully.")
        except Exception as e:
            if self.device != "cpu":
                logger.warning(
                    f"Failed to load model on {self.device} ({e}). Falling back to CPU int8..."
                )
                self.device = "cpu"
                self.compute_type = "int8"
                self.model = WhisperModel(
                    self.model_name,
                    device=self.device,
                    compute_type=self.compute_type,
                    cpu_threads=self.cpu_threads,
                )
                logger.info("Fallback CPU model loaded successfully.")
            else:
                logger.error(f"Failed to load Whisper model on CPU: {e}")
                raise

    def transcribe(self, audio_path: str | Path) -> TranscriptionResponse:
        if self.model is None:
            self._load_model()

        audio_path_str = str(audio_path)
        start_time = time.perf_counter()

        # faster-whisper transcribe generator
        segments_generator, info = self.model.transcribe(
            audio_path_str,
            beam_size=5,
            word_timestamps=False,
        )

        segments: list[Segment] = []
        full_text_parts: list[str] = []

        for idx, seg in enumerate(segments_generator):
            clean_text = seg.text.strip()
            segments.append(
                Segment(
                    id=idx,
                    start=round(seg.start, 3),
                    end=round(seg.end, 3),
                    text=clean_text,
                )
            )
            full_text_parts.append(clean_text)

        processing_time = round(time.perf_counter() - start_time, 3)
        duration = round(info.duration, 3) if info.duration else 0.0
        rtf = round(processing_time / duration, 3) if duration > 0 else 0.0
        full_text = " ".join(full_text_parts).strip()

        return TranscriptionResponse(
            text=full_text,
            segments=segments,
            language=info.language,
            language_probability=round(info.language_probability, 4),
            duration_seconds=duration,
            processing_time_seconds=processing_time,
            real_time_factor=rtf,
            device=self.device,
            compute_type=self.compute_type,
            model_name=self.model_name,
        )

# Global singleton transcriber instance
transcriber_service = SpeechTranscriber()
