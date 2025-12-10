from typing import Optional, Dict
import traceback

# Import existing clients (may be None)
from ai.services.ai_client_interface import AiClientInterface
from ai.services.gemini_ai import gemini_client
from ai.services.mistral_ai import mistral_client

# Build registry of available clients (name -> client instance)
_registry: Dict[str, AiClientInterface] = {}

if mistral_client:
    _registry["mistral"] = mistral_client

if gemini_client:
    _registry["gemini"] = gemini_client

def get_ai_client(model_name: Optional[str]) -> AiClientInterface:
    if not model_name:
        raise Exception("Model name must be provided")
    name = model_name.lower()
    client = _registry.get(name)
    if not client:
        raise Exception(f"Unknown or unavailable model '{model_name}'. Supported: {', '.join(sorted(_registry.keys()))}")    
    return client

async def shutdown_all_ai_clients():
    """
    Shutdown/cleanup all registered AI clients.    
    Errors for individual clients are caught/logged and do not stop the overall shutdown.
    """
    errors = []
    for name, client in list(_registry.items()):
        try:            
            await client.cleanup()
            _registry.pop(name, None)
        except Exception as e:
            errors.append((name, str(e), traceback.format_exc()))
    if errors:
        # Raise a combined exception so callers are aware; caller (main) may handle/log
        combined = "\n".join([f"{n}: {msg}" for n, msg, _ in errors])
        raise Exception(f"Errors during AI clients shutdown:\n{combined}")
