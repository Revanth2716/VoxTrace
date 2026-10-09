import sys
import time
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.services.transcriber import SpeechTranscriber

def main():
    sample_file = backend_dir.parent / "samples" / "sample_test.wav"
    if not sample_file.exists():
        print(f"Error: {sample_file} does not exist!")
        sys.exit(1)

    print(f"Testing local transcription on: {sample_file}")
    print(f"File size: {sample_file.stat().st_size} bytes")

    start_init = time.perf_counter()
    transcriber = SpeechTranscriber(model_name="tiny", device="cpu", compute_type="int8", cpu_threads=4)
    init_time = time.perf_counter() - start_init
    print(f"Model initialization completed in {init_time:.2f} seconds.")

    print("Running transcription...")
    res = transcriber.transcribe(sample_file)

    print("\n--- Transcription Results ---")
    print(f"Model: {res.model_name} on {res.device} ({res.compute_type})")
    print(f"Detected Language: {res.language} (Confidence: {res.language_probability})")
    print(f"Audio Duration: {res.duration_seconds}s")
    print(f"Processing Time: {res.processing_time_seconds}s")
    print(f"Real-Time Factor (RTF): {res.real_time_factor}")
    print(f"Full Text: \"{res.text}\"")
    print("\nSegments:")
    for s in res.segments:
        print(f"  [{s.start:.2f}s -> {s.end:.2f}s]: {s.text}")

    print("\nSUCCESS: Local transcription completed without errors!")

if __name__ == "__main__":
    main()
