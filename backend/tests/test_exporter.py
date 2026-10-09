import json
from app.schemas.transcription import Segment, TranscriptionResponse
from app.services.exporter import (
    format_srt_timestamp,
    export_srt,
    export_txt,
    export_json,
)

def test_format_srt_timestamp_zero():
    assert format_srt_timestamp(0.0) == "00:00:00,000"
    assert format_srt_timestamp(-5.0) == "00:00:00,000"

def test_format_srt_timestamp_milliseconds():
    assert format_srt_timestamp(1.234) == "00:00:01,234"
    assert format_srt_timestamp(0.005) == "00:00:00,005"
    assert format_srt_timestamp(0.050) == "00:00:00,050"

def test_format_srt_timestamp_minute_rollover():
    # 65.432s -> 1 minute, 5 seconds, 432 ms
    assert format_srt_timestamp(65.432) == "00:01:05,432"
    # 59.9996s -> rounds to 60.000s -> 00:01:00,000
    assert format_srt_timestamp(59.9996) == "00:01:00,000"

def test_format_srt_timestamp_hour_rollover():
    # 3600s -> 01:00:00,000
    assert format_srt_timestamp(3600.0) == "01:00:00,000"
    # 3665.789s -> 1 hour, 1 minute, 5 seconds, 789 ms
    assert format_srt_timestamp(3665.789) == "01:01:05,789"
    # Multiple hours: 7322.050s -> 2 hours, 2 minutes, 2 seconds, 50 ms
    assert format_srt_timestamp(7322.050) == "02:02:02,050"

def test_export_srt_multi_segment_structure():
    segments = [
        Segment(id=0, start=0.0, end=2.5, text="Welcome to VoxTrace."),
        Segment(id=1, start=2.5, end=5.8, text="Local Speech Intelligence."),
    ]
    srt_out = export_srt(segments)

    expected = (
        "1\n"
        "00:00:00,000 --> 00:00:02,500\n"
        "Welcome to VoxTrace.\n\n"
        "2\n"
        "00:00:02,500 --> 00:00:05,800\n"
        "Local Speech Intelligence.\n"
    )
    assert srt_out == expected

def test_export_srt_empty_segments_fallback():
    srt_out = export_srt([], fallback_text="Fallback transcript text.", duration_seconds=3.5)
    expected = (
        "1\n"
        "00:00:00,000 --> 00:00:03,500\n"
        "Fallback transcript text.\n"
    )
    assert srt_out == expected

def test_export_srt_completely_empty():
    assert export_srt([]) == ""
    assert export_srt([], fallback_text="") == ""

def test_export_txt():
    text = "  First sentence. Second sentence.  "
    assert export_txt(text) == "First sentence. Second sentence.\n"
    assert export_txt("") == ""
    assert export_txt("   ") == ""

def test_export_json_serialization():
    resp = TranscriptionResponse(
        text="Sample transcript",
        segments=[Segment(id=0, start=0.0, end=1.0, text="Sample transcript")],
        language="en",
        language_probability=0.99,
        duration_seconds=1.0,
        processing_time_seconds=0.2,
        real_time_factor=0.2,
        device="cpu",
        compute_type="int8",
        model_name="tiny",
    )
    json_str = export_json(resp)
    parsed = json.loads(json_str)

    assert parsed["text"] == "Sample transcript"
    assert len(parsed["segments"]) == 1
    assert parsed["segments"][0]["start"] == 0.0
    assert parsed["real_time_factor"] == 0.2
    assert parsed["device"] == "cpu"
