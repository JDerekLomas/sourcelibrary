from pydantic import BaseModel, Field
from typing import List, Dict, Any

class DivinationRequest(BaseModel):
    """Request model for a divination."""
    query: str = Field(...)
    turnstile_token: str  # Add Turnstile token field

class DivinationResponse(BaseModel):
    """Response model for a cabalistic divination prophecy."""
    prophecy: str
    prophecy_en: str
    final_grid: List[List[int]]
    # calculation_steps: Dict[str, Any]

class ProphecyAndTranslationResponse(BaseModel):
    """Response model for the translation of a prophecy."""
    german_prophecy: str
    english_prophecy: str