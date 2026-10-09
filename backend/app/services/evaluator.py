import jiwer
from app.schemas.evaluation import EvaluationResponse

# Reusable transformation pipelines
_NORMALIZER_STRING = jiwer.Compose([
    jiwer.ToLowerCase(),
    jiwer.RemovePunctuation(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
])

_NORMALIZER_WORDS = jiwer.Compose([
    jiwer.ToLowerCase(),
    jiwer.RemovePunctuation(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
    jiwer.ReduceToListOfListOfWords(),
])

_RAW_WORDS = jiwer.Compose([
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
    jiwer.ReduceToListOfListOfWords(),
])

def normalize_text(text: str) -> str:
    """
    Standardize text by converting to lowercase, stripping punctuation,
    collapsing multiple whitespace characters, and trimming ends.
    """
    if not text:
        return ""
    result = _NORMALIZER_STRING(text)
    # _NORMALIZER_STRING returns a string when ReduceToListOfListOfWords is omitted
    return str(result).strip()

def evaluate_wer(
    reference: str,
    hypothesis: str,
    normalize: bool = True,
) -> EvaluationResponse:
    """
    Evaluate Word Error Rate (WER) and Levenshtein alignment breakdown.

    Policy:
    - Empty Reference: If the reference is empty or normalizes to zero words,
      a ValueError is raised. WER requires ground truth words (N > 0).
    - Empty Hypothesis: If the hypothesis is empty or normalizes to zero words
      while reference has N words, WER is 1.0 (100% error rate), all words
      are counted as deletions (D = N), and S = I = H = 0.
    - Normalization: Enabled by default to eliminate case and punctuation mismatches.
    """
    if not reference or not reference.strip():
        raise ValueError(
            "Reference text cannot be empty. Ground-truth words are required to calculate WER."
        )

    norm_ref = normalize_text(reference) if normalize else reference.strip()
    norm_hyp = normalize_text(hypothesis) if normalize else hypothesis.strip()

    # Re-validate reference words post-normalization
    ref_words = norm_ref.split() if norm_ref else []
    if not ref_words:
        raise ValueError(
            "Reference text contains no valid words after normalization. Cannot evaluate WER."
        )

    hyp_words = norm_hyp.split() if norm_hyp else []
    ref_count = len(ref_words)
    hyp_count = len(hyp_words)

    # Empty hypothesis policy
    if hyp_count == 0:
        return EvaluationResponse(
            wer=1.0,
            wer_percent=100.0,
            substitutions=0,
            deletions=ref_count,
            insertions=0,
            hits=0,
            reference_word_count=ref_count,
            hypothesis_word_count=0,
            normalized_reference=norm_ref,
            normalized_hypothesis="",
            policy_note=(
                "Hypothesis contained no recognized words; "
                "all reference words were evaluated as deletions."
            ),
        )

    transform = _NORMALIZER_WORDS if normalize else _RAW_WORDS

    output = jiwer.process_words(
        reference,
        hypothesis,
        reference_transform=transform,
        hypothesis_transform=transform,
    )

    wer_value = round(float(output.wer), 4)
    wer_pct = round(wer_value * 100.0, 2)
    s = int(output.substitutions)
    d = int(output.deletions)
    i = int(output.insertions)
    h = int(output.hits)

    return EvaluationResponse(
        wer=wer_value,
        wer_percent=wer_pct,
        substitutions=s,
        deletions=d,
        insertions=i,
        hits=h,
        reference_word_count=ref_count,
        hypothesis_word_count=hyp_count,
        normalized_reference=norm_ref,
        normalized_hypothesis=norm_hyp,
        policy_note=None,
    )
