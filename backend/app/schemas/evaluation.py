from pydantic import BaseModel, Field

class EvaluationRequest(BaseModel):
    reference: str = Field(..., description="Ground-truth reference transcript")
    hypothesis: str = Field(..., description="Hypothesis transcript to evaluate")
    normalize: bool = Field(
        default=True,
        description="Whether to apply case folding and punctuation stripping before evaluation",
    )

class EvaluationResponse(BaseModel):
    wer: float = Field(..., description="Word Error Rate (0.0 to 1.0+)")
    wer_percent: float = Field(..., description="Word Error Rate as a percentage (0% to 100%+)")
    substitutions: int = Field(..., description="Number of substituted words (S)")
    deletions: int = Field(..., description="Number of deleted words (D)")
    insertions: int = Field(..., description="Number of inserted words (I)")
    hits: int = Field(..., description="Number of correctly recognized words (H)")
    reference_word_count: int = Field(..., description="Total words in reference (N)")
    hypothesis_word_count: int = Field(..., description="Total words in hypothesis")
    normalized_reference: str = Field(..., description="Reference text after normalization")
    normalized_hypothesis: str = Field(..., description="Hypothesis text after normalization")
    policy_note: str | None = Field(
        default=None,
        description="Notes on evaluation policy (e.g. empty hypothesis handling)",
    )
