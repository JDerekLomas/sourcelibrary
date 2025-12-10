from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import json

from astrology.models.divination_models import DivinationRequest
from astrology.services.cabalistic_divination import CabalisticDivination
from astrology.services.base_divination import DivinationService
from captcha.services.turnstile_service import TurnstileService
from auth.services.rbac_service import need_permission, ResourceType, ActionType

router = APIRouter()

# Dependency to provide the currently active divination service.
# To switch to a different algorithm, you would just change this provider.
def _get_divination_service() -> DivinationService:
    return CabalisticDivination()

def _get_turnstile_service() -> TurnstileService:
    return TurnstileService()

@router.post("/predict", dependencies=[Depends(need_permission(ResourceType.TENANT, ActionType.CREATE))])
async def predict_prophecy(
    request_data: DivinationRequest,
    request: Request,
    service: DivinationService = Depends(_get_divination_service),
    turnstile_service: TurnstileService = Depends(_get_turnstile_service)
):
    """
    Performs divination based on a user query string, streaming results as they are generated.
    Requires valid Turnstile token for verification.
    """
    # Verify Turnstile token first
    client_ip = request.client.host if request.client else ""
    is_valid = await turnstile_service.is_token_valid(request_data.turnstile_token, client_ip)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid captcha verification")
    
    async def stream_generator() -> AsyncGenerator[str, None]:
        try:
            async for result_chunk in service.get_prophecy(request_data.query):
                yield f"data: {json.dumps(result_chunk)}\n\n"
        except ValueError as e:
            error_message = json.dumps({"error": str(e)})
            yield f"data: {error_message}\n\n"
        except Exception as e:
            error_message = json.dumps({"error": f"An internal error occurred: {e}"})
            yield f"data: {error_message}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")