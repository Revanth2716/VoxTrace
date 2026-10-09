import sys
import time
import platform
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.services.transcriber import SpeechTranscriber
from app.services.evaluator import evaluate_wer

def get_system_summary():
    return {
        "os": platform.system() + " " + platform.release(),
        "processor": platform.processor() or "x86_64",
        "python_version": platform.python_version(),
    }

def run_benchmarks():
    samples_dir = backend_dir.parent / "samples"
    if not samples_dir.exists():
        print(f"Error: Samples directory not found at {samples_dir}")
        return

    benchmark_cases = [
        {
            "audio": samples_dir / "sample_test.wav",
            "ground_truth": samples_dir / "sample_ground_truth.txt",
            "name": "Sample 1: Introduction (Short)",
        },
        {
            "audio": samples_dir / "sample_technical.wav",
            "ground_truth": samples_dir / "sample_technical_ground_truth.txt",
            "name": "Sample 2: Technical Description (Medium)",
        },
    ]

    print("=" * 70)
    print("VoxTrace Local Speech Intelligence — Reproducible Benchmark")
    print("=" * 70)
    sys_info = get_system_summary()
    print(f"OS: {sys_info['os']}")
    print(f"Python: {sys_info['python_version']}")
    print(f"Model: tiny | Quantization: int8 | Target: CPU (4 threads)")
    print("=" * 70)

    # Initialize transcriber
    print("\nLoading local WhisperModel (CPU int8)...")
    init_start = time.perf_counter()
    transcriber = SpeechTranscriber(
        model_name="tiny",
        device="cpu",
        compute_type="int8",
        cpu_threads=4,
    )
    init_time = time.perf_counter() - init_start
    print(f"Model initialized in {init_time:.2f}s.\n")

    results = []

    for case in benchmark_cases:
        audio_path = case["audio"]
        gt_path = case["ground_truth"]

        if not audio_path.exists():
            print(f"Skipping {case['name']}: audio file {audio_path.name} not found.")
            continue

        print(f"Benchmarking: {case['name']} ({audio_path.name})")

        # Run transcription
        res = transcriber.transcribe(audio_path)

        # Evaluate against ground truth if present
        wer_pct = "N/A"
        s_count = d_count = i_count = h_count = "N/A"
        ref_text = ""

        if gt_path.exists():
            ref_text = gt_path.read_text(encoding="utf-8").strip()
            eval_res = evaluate_wer(ref_text, res.text, normalize=True)
            wer_pct = f"{eval_res.wer_percent:.2f}%"
            s_count = eval_res.substitutions
            d_count = eval_res.deletions
            i_count = eval_res.insertions
            h_count = eval_res.hits

        results.append({
            "name": case["name"],
            "duration": f"{res.duration_seconds:.2f}s",
            "latency": f"{res.processing_time_seconds:.3f}s",
            "rtf": f"{res.real_time_factor:.3f}",
            "speedup": f"{(1 / res.real_time_factor):.1f}x" if res.real_time_factor > 0 else "N/A",
            "wer": wer_pct,
            "s": s_count,
            "d": d_count,
            "i": i_count,
            "h": h_count,
            "hypothesis": res.text,
            "reference": ref_text,
        })

        print(f"  Duration: {res.duration_seconds:.2f}s | Latency: {res.processing_time_seconds:.3f}s | RTF: {res.real_time_factor:.3f} | WER: {wer_pct}")
        print(f"  Hypothesis: \"{res.text}\"")
        if ref_text:
            print(f"  Reference:  \"{ref_text}\"")
        print("-" * 70)

    # Markdown Summary Table
    print("\n### Benchmark Summary Table (Measured Locally)")
    print("| Sample | Audio Length | Processing Time | Real-Time Factor (RTF) | Speed Multiplier | WER (%) | S | D | I | H |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for r in results:
        print(f"| {r['name']} | {r['duration']} | {r['latency']} | {r['rtf']} | {r['speedup']} | {r['wer']} | {r['s']} | {r['d']} | {r['i']} | {r['h']} |")

if __name__ == "__main__":
    run_benchmarks()
