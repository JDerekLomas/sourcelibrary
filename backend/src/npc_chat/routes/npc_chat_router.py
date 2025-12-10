from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import json

from npc_chat.models.npc_chat_model import (
    StartConversationBody,
    UserSendBody,
    AdvanceBody,
    EndBody,
    EventsReply,
)
from ai.services.gemini_chat_service import ChatOrchestrator
from auth.services.rbac_service import need_permission, ResourceType, ActionType

router = APIRouter()
orchestrator = ChatOrchestrator()

# TODO: Enable permission check when game has login system
# permision_dependency = Depends(need_permission(ResourceType.TENANT, ActionType.CREATE))
permision_dependency = None

@router.post("/start", dependencies=permision_dependency)
async def start_conversation(body: StartConversationBody):
    await orchestrator.start(conversation_id=body.conversation_id, participants=body.participants)
    return {"status": "ok"}

@router.post("/send", response_model=EventsReply, dependencies=permision_dependency)
async def user_send(body: UserSendBody):
    try:
        events = await orchestrator.user_send_and_get_npc_reply(
            conversation_id=body.conversation_id,
            author_id=body.author_id,
            message=body.message,
            target_npc_id=body.target_npc_id,
            allow_auto_route=bool(body.allow_auto_route),
            max_turns=(body.max_context_turns or 12),
        )
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return EventsReply(conversation_id=body.conversation_id, events=events)

@router.post("/advance", response_model=EventsReply, dependencies=permision_dependency)
async def advance_multi_npc(body: AdvanceBody):
    async def event_stream():
        try:
            async for events in orchestrator.advance_multi_npc(
                conversation_id=body.conversation_id,
                next_speakers=body.next_speakers,
                rounds=(body.rounds or 1),
                max_turns=(body.max_context_turns or 12),
            ):
                reply= EventsReply(
                    conversation_id=body.conversation_id,
                    events=events
                )
                yield reply.model_dump_json() + "\n"

        except RuntimeError as e:
            # raise HTTPException(status_code=400, detail=str(e))
            yield json.dumps({"error": str(e)}) + "\n"
    return StreamingResponse(event_stream(), media_type="application/json")

@router.post("/end", dependencies=permision_dependency)
async def end_conversation(body: EndBody):
    await orchestrator.end(conversation_id=body.conversation_id)
    return {"status": "ok"}
