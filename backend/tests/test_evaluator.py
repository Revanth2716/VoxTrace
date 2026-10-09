import pytest
from app.services.evaluator import evaluate_wer, normalize_text

def test_identical_transcripts_produce_zero_wer():
    ref = "the quick brown fox jumps over the lazy dog"
    hyp = "the quick brown fox jumps over the lazy dog"
    result = evaluate_wer(ref, hyp)

    assert result.wer == 0.0
    assert result.wer_percent == 0.0
    assert result.substitutions == 0
    assert result.deletions == 0
    assert result.insertions == 0
    assert result.hits == 9
    assert result.reference_word_count == 9
    assert result.hypothesis_word_count == 9

def test_normalization_handles_case_and_punctuation():
    ref = "Hello, world! Are you ready?"
    hyp = "hello world are you ready"
    result = evaluate_wer(ref, hyp, normalize=True)

    assert result.wer == 0.0
    assert result.hits == 5
    assert result.substitutions == 0
    assert result.deletions == 0
    assert result.insertions == 0
    assert result.normalized_reference == "hello world are you ready"
    assert result.normalized_hypothesis == "hello world are you ready"

def test_known_substitution_example():
    ref = "the cat sat on the mat"
    hyp = "the dog sat on the mat"
    result = evaluate_wer(ref, hyp)

    # 6 words, 1 substitution ("dog" for "cat")
    assert result.reference_word_count == 6
    assert result.substitutions == 1
    assert result.deletions == 0
    assert result.insertions == 0
    assert result.hits == 5
    assert result.wer == pytest.approx(1 / 6, 0.001)

def test_known_deletion_example():
    ref = "the cat sat on the mat"
    hyp = "the sat on the mat"
    result = evaluate_wer(ref, hyp)

    # 6 words, 1 deletion ("cat" deleted)
    assert result.reference_word_count == 6
    assert result.substitutions == 0
    assert result.deletions == 1
    assert result.insertions == 0
    assert result.hits == 5
    assert result.wer == pytest.approx(1 / 6, 0.001)

def test_known_insertion_example():
    ref = "the cat sat on the mat"
    hyp = "the black cat sat on the mat"
    result = evaluate_wer(ref, hyp)

    # 6 reference words, 1 insertion ("black")
    assert result.reference_word_count == 6
    assert result.substitutions == 0
    assert result.deletions == 0
    assert result.insertions == 1
    assert result.hits == 6
    assert result.wer == pytest.approx(1 / 6, 0.001)

def test_empty_reference_raises_value_error():
    with pytest.raises(ValueError, match="Reference text cannot be empty"):
        evaluate_wer("", "hello world")

    with pytest.raises(ValueError, match="Reference text cannot be empty"):
        evaluate_wer("   ", "hello world")

def test_punctuation_only_reference_raises_value_error():
    with pytest.raises(ValueError, match="no valid words after normalization"):
        evaluate_wer("... ??? ,,,", "hello world", normalize=True)

def test_empty_hypothesis_produces_full_deletions():
    ref = "speech intelligence on your machine"
    result = evaluate_wer(ref, "")

    assert result.wer == 1.0
    assert result.wer_percent == 100.0
    assert result.substitutions == 0
    assert result.deletions == 5
    assert result.insertions == 0
    assert result.hits == 0
    assert result.reference_word_count == 5
    assert result.hypothesis_word_count == 0
    assert result.policy_note is not None

def test_unnormalized_evaluation():
    ref = "Hello World"
    hyp = "hello world"
    # When normalization is turned off, case mismatch is treated as substitutions
    result = evaluate_wer(ref, hyp, normalize=False)

    assert result.wer == 1.0
    assert result.substitutions == 2
    assert result.hits == 0

def test_normalize_text_utility():
    assert normalize_text("  Speech,   Intelligence! ") == "speech intelligence"
    assert normalize_text("") == ""
    assert normalize_text("100% Accuracy.") == "100 accuracy"
