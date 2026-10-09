import json
from pydantic import BaseModel
from app.schemas.transcription import Segment, TranscriptionResponse

def format_srt_timestamp(seconds: float) -> str:
    """
    Format a floating-point second timestamp into standard SubRip timecode:
    HH:MM:SS,mmm
    Handles millisecond rounding, minute rollover, and hour boundaries cleanly.
    """
    if seconds < 0:
        seconds = 0.0
    total_ms = int(round(seconds * 1000))
    ms = total_ms % 1000
    total_seconds = total_ms // 1000
    s = total_seconds % 60
    total_minutes = total_seconds // 60
    m = total_minutes % 60
    h = total_minutes // 60
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def export_srt(
    segments: list[Segment],
    fallback_text: str = "",
    duration_seconds: float = 0.0,
) -> str:
    """
    Convert timestamped transcription segments into a valid SubRip (.srt) subtitle document.
    """
    if not segments and fallback_text.strip():
        # Fallback single block if segments are not available
        end_time = max(duration_seconds, 1.0)
        start_str = format_srt_timestamp(0.0)
        end_str = format_srt_timestamp(end_time)
        return f"1\n{start_str} --> {end_str}\n{fallback_text.strip()}\n"

    if not segments:
        return ""

    blocks: list[str] = []
    for idx, seg in enumerate(segments, start=1):
        start_str = format_srt_timestamp(seg.start)
        end_str = format_srt_timestamp(seg.end)
        text_str = seg.text.strip()
        blocks.append(f"{idx}\n{start_str} --> {end_str}\n{text_str}")

    return "\n\n".join(blocks) + "\n"

def export_txt(text: str) -> str:
    """
    Export raw continuous readable transcript as plain text.
    """
    return text.strip() + "\n" if text.strip() else ""

def export_json(data: TranscriptionResponse | dict) -> str:
    """
    Export full transcription metadata, performance metrics, and segments as indented JSON.
    """
    if isinstance(data, BaseModel):
        return data.model_dump_json(indent=2)
    return json.dumps(data, indent=2, ensure_ascii=False)
