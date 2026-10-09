import io
from unittest.mock import MagicMock
from starlette.testclient import TestClient
import pytest

from app.main import app
from app.schemas.transcription import Segment, TranscriptionResponse

@pytest.fixture
def client():
    return TestClient(app)

def test_api_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "VoxTrace"
    assert "device" in data
    assert "compute_type" in data
    assert "model_name" in data

def test_api_evaluate_valid(client):
    payload = {
        "reference": "The quick brown fox jumps over the lazy dog",
        "hypothesis": "The fast brown fox jumps over the lazy dog",
        "normalize": True,
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["reference_word_count"] == 9
    assert data["substitutions"] == 1
    assert data["deletions"] == 0
    assert data["insertions"] == 0
    assert data["hits"] == 8
    assert data["wer"] == pytest.approx(1 / 9, 0.001)

def test_api_evaluate_empty_reference_rejected(client):
    payload = {
        "reference": "",
        "hypothesis": "Some hypothesis text",
        "normalize": True,
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "Reference text cannot be empty" in data["detail"]

def test_api_evaluate_empty_hypothesis_handled(client):
    payload = {
        "reference": "Ground truth words",
        "hypothesis": "",
        "normalize": True,
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["wer"] == 1.0
    assert data["deletions"] == 3
    assert data["hits"] == 0

def test_api_export_txt(client):
    payload = {
        "text": "Exported transcript line.",
        "segments": [],
    }
    response = client.post("/api/v1/export/txt", json=payload)
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    assert response.text == "Exported transcript line.\n"

def test_api_export_srt(client):
    payload = {
        "text": "Exported transcript line.",
        "segments": [
            {"id": 0, "start": 0.0, "end": 2.0, "text": "Segment one."},
            {"id": 1, "start": 2.0, "end": 4.5, "text": "Segment two."},
        ],
    }
    response = client.post("/api/v1/export/srt", json=payload)
    assert response.status_code == 200
    assert "application/x-subrip" in response.headers["content-type"]
    assert "00:00:00,000 --> 00:00:02,000" in response.text
    assert "00:00:02,000 --> 00:00:04,500" in response.text

def test_api_export_json(client):
    payload = {
        "text": "Sample text",
        "segments": [{"id": 0, "start": 0.0, "end": 1.0, "text": "Sample text"}],
        "language": "en",
        "duration_seconds": 1.0,
        "processing_time_seconds": 0.1,
        "real_time_factor": 0.1,
        "device": "cpu",
        "compute_type": "int8",
        "model_name": "tiny",
    }
    response = client.post("/api/v1/export/json", json=payload)
    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]
    data = response.json()
    assert data["text"] == "Sample text"
    assert data["real_time_factor"] == 0.1

def test_api_export_invalid_format(client):
    payload = {"text": "Hello"}
    response = client.post("/api/v1/export/docx", json=payload)
    assert response.status_code == 400
    assert "Unsupported export format" in response.json()["detail"]

def test_api_transcribe_unsupported_file_extension(client):
    fake_file = io.BytesIO(b"fake binary content")
    response = client.post(
        "/api/v1/transcribe",
        files={"file": ("malicious.exe", fake_file, "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "Unsupported audio format" in response.json()["detail"]

def test_api_transcribe_mocked_pipeline(monkeypatch, client):
    """
    Ensure automated tests test the full route and schema serialization
    without downloading or invoking real models.
    """
    mock_response = TranscriptionResponse(
        text="Mocked local transcription output.",
        segments=[
            Segment(id=0, start=0.0, end=1.5, text="Mocked local transcription output.")
        ],
        language="en",
        language_probability=0.999,
        duration_seconds=1.5,
        processing_time_seconds=0.15,
        real_time_factor=0.1,
        device="cpu",
        compute_type="int8",
        model_name="tiny",
    )

    from app import main
    monkeypatch.setattr(main.transcriber_service, "transcribe", MagicMock(return_value=mock_response))

    fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00data\x00\x00\x00\x00")
    response = client.post(
        "/api/v1/transcribe",
        files={"file": ("test.wav", fake_wav, "audio/wav")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Mocked local transcription output."
    assert data["real_time_factor"] == 0.1
    assert len(data["segments"]) == 1
