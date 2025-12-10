from typing import Dict, List, Optional
from pydantic import BaseModel, Field

# ---------- Start ----------

class StartConversationBody(BaseModel):
    conversation_id: str = Field(..., description="Unique ID for this conversation thread")
    # Map of participant_id -> instruction string (frontend provides persona strings)
    participants: Dict[str, str] = Field(
        ...,
        description="e.g., {'Aristotle': '...Act and concise respond as Aristotle', 'Pythagoras': '...'}"
    )

# ---------- User sends (human ↔ NPC) ----------

class UserSendBody(BaseModel):
    conversation_id: str
    author_id: str = Field(..., description="Who is speaking (e.g., 'User123')")
    message: str
    target_npc_id: Optional[str] = Field(
        None,
        description="Which NPC should reply. If omitted, service may auto-route if enabled."
    )
    allow_auto_route: Optional[bool] = Field(
        True,
        description="Allow the service to infer the NPC via @mention/Name: or last speaker."
    )
    max_context_turns: Optional[int] = Field(12, ge=0)

# ---------- Multi-NPC advance ----------

class AdvanceBody(BaseModel):
    conversation_id: str
    next_speakers: List[str] = Field(..., description="Order of participants to speak next")
    rounds: Optional[int] = Field(1, ge=1, description="Repeat the next_speakers sequence this many times")
    max_context_turns: Optional[int] = Field(12, ge=0)

# ---------- End ----------

class EndBody(BaseModel):
    conversation_id: str

# ---------- Common replies ----------

class Event(BaseModel):
    speaker_id: str
    text: str

class EventsReply(BaseModel):
    conversation_id: str
    events: List[Event]
