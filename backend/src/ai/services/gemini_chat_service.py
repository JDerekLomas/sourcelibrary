import os
import re
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Tuple, AsyncGenerator

from npc_chat.models.npc_chat_model import Event
from google import genai

@dataclass
class Conversation:
    """
    Multi-participant conversation held in memory.

    - Each NPC gets its own Gemini chat (stateful persona).
    - We keep a shared transcript: list[(speaker_id, text)].
    - When an NPC speaks, we pass a compact context window from the transcript.
    """
    conversation_id: str
    # participant_id -> chat object (Gemini chat)
    chats: Dict[str, Any] = field(default_factory=dict)
    # participant_id -> system instruction string
    personas: Dict[str, str] = field(default_factory=dict)
    # chronological transcript of turns
    transcript: List[Tuple[str, str]] = field(default_factory=list)


class ChatOrchestrator:
    """
    Supports:
      1) Human ↔ NPC (one NPC replies per human message)
      2) Multi-NPC sequences (generate turns for a list of NPCs)
    In-memory only (no persistence).
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise RuntimeError("Missing GEMINI_API_KEY/GOOGLE_API_KEY")
        self.default_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self._client = genai.Client(api_key=self.api_key)
        self._aio = self._client.aio
        # conversation_id -> Conversation
        self._convos: Dict[str, Conversation] = {}

    # ---------- Lifecycle ----------

    async def start(self, conversation_id: str, participants: Dict[str, str]):
        """
        Start a conversation.

        Args:
            conversation_id: unique id for this thread
            participants: { participant_id: instruction_string }
                          e.g. { "Aristotle": "...Act and concise respond as Aristotle",
                                 "Pythagoras": "...Act and concise respond as Pythagoras" }
        """
        conv = Conversation(conversation_id=conversation_id)
        for pid, instruction in participants.items():
            chat = self._aio.chats.create(
                model=self.default_model,
                config={"system_instruction": instruction},
                history=None,  # fresh chat per participant
            )
            conv.chats[pid] = chat
            conv.personas[pid] = instruction

        self._convos[conversation_id] = conv
        return {"status": "ok"}

    async def end(self, conversation_id: str):
        self._convos.pop(conversation_id, None)

    # ---------- Internals ----------

    def _get_convo(self, conversation_id: str) -> Conversation:
        conv = self._convos.get(conversation_id)
        if not conv:
            raise RuntimeError("No active conversation. Call /session/start first.")
        return conv

    def _window_context(self, conv: Conversation, max_turns: int) -> List[Tuple[str, str]]:
        """Return the most recent N turns (N>=0)."""
        if max_turns is None or max_turns <= 0:
            return []
        return conv.transcript[-max_turns:]

    def _infer_target_npc(
        self,
        conv: Conversation,
        author_id: str,
        message: str,
        allow_auto_route: bool,
    ) -> Optional[str]:
        """
        Try to infer the NPC to reply when target_npc_id is omitted.
        Heuristics (in order):
          1) @mention or 'Name:' in message
          2) Last NPC who spoke
          3) None (ambiguous)
        """
        npc_ids = [pid for pid in conv.chats.keys() if pid != author_id]
        if len(npc_ids) == 1:
            return npc_ids[0]
        if not allow_auto_route:
            return None

        # 1) @mention or 'Name:' (case-insensitive)
        lower = message.lower()
        for candidate in npc_ids:
            name = candidate.strip()
            # simple patterns: @Name, Name:, Name (word boundary)
            patterns = [
                rf"@{re.escape(name)}\b",
                rf"\b{re.escape(name)}\s*:",
                rf"\b{re.escape(name)}\b",
            ]
            if any(re.search(p, lower, re.IGNORECASE) for p in patterns):
                return candidate

        # 2) last NPC who spoke
        for sid, _ in reversed(conv.transcript):
            if sid in npc_ids:
                return sid

        # 3) give up -> ambiguous
        return None

    async def _generate_for_speaker(self, conv: Conversation, speaker_id: str, max_turns: int) -> str:
        """
        Ask the specific participant's chat to respond using the recent transcript window as context.
        """
        if speaker_id not in conv.chats:
            raise RuntimeError(f"Unknown speaker_id: {speaker_id}")

        ctx = self._window_context(conv, max_turns=max_turns)
        lines = [f"{sid}: {text}" for sid, text in ctx]
        context_block = "\n".join(lines) if lines else "(no prior context)"

        prompt = (
            "Conversation context (recent turns):\n"
            f"{context_block}\n\n"
            f"Now respond strictly in-character as {speaker_id}.\n"
            "Write only this speaker's next line; do not write lines for others, "
            "and do not include speaker labels unless it fits the character's style."
        )

        resp = await conv.chats[speaker_id].send_message(prompt)
        text = (resp.text or "").strip()
        conv.transcript.append((speaker_id, text))
        return text

    # ---------- Public operations ----------

    async def user_send_and_get_npc_reply(
        self,
        conversation_id: str,
        author_id: str,
        message: str,
        target_npc_id: Optional[str],
        allow_auto_route: bool,
        max_turns: int,
    ) -> List[Event]:
        """
        Human/user sends a message, and ONE NPC replies.

        If target_npc_id is None:
          - if only one NPC exists, it replies;
          - else we try to infer via '@Name' or 'Name:' mention, then fall back to last NPC; else 400.
        Returns a list of events [{"speaker_id": ..., "text": ...}, ...] in order.
        """
        conv = self._get_convo(conversation_id)

        # Record the user's turn
        conv.transcript.append((author_id, message))

        # Determine NPC
        npc = target_npc_id or self._infer_target_npc(conv, author_id, message, allow_auto_route)
        if not npc:
            raise RuntimeError("Ambiguous target_npc_id: specify which NPC should reply or enable auto routing.")

        reply_text = await self._generate_for_speaker(conv, npc, max_turns=max_turns)
        return [Event(speaker_id=npc, text=reply_text)]

    async def advance_multi_npc(
        self,
        conversation_id: str,
        next_speakers: List[str],
        rounds: int,
        max_turns: int,
        hard_cap: int = 200,
    ) -> AsyncGenerator[List[Event], None]:
        """
        Generate sequential turns for the listed participants.
        You can repeat the sequence with `rounds` (>1) to create multiple back-and-forth exchanges in one call.

        Example: next_speakers=["Aristotle","Pythagoras"], rounds=3
        -> A, P, A, P, A, P

        hard_cap prevents accidental explosion of turns in a single request.
        """
        if rounds is None or rounds < 1:
            rounds = 1

        conv = self._get_convo(conversation_id)
        total = len(next_speakers) * rounds
        if total > hard_cap:
            raise RuntimeError(f"Too many generated turns ({total} > hard_cap={hard_cap}). Reduce rounds or speakers.")

        events: List[Event] = []
        for _ in range(rounds):
            for sid in next_speakers:
                text = await self._generate_for_speaker(conv, sid, max_turns=max_turns)
                new_event = Event(speaker_id=sid, text=text)
                events.append(new_event)
                yield [new_event]        
