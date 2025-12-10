from typing import Protocol, Dict, Any, AsyncGenerator

class DivinationService(Protocol):
    """
    A protocol defining the standard interface for any divination service.
    Each service must be able to process a user query and return a standardized prophecy dictionary.
    """
    async def get_prophecy(self, query: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generates a prophecy based on a user query string, yielding results as they are computed.

        Args:
            query: The user's question or input string.

        Yields:
            A dictionary containing the partial results of the calculation.
        """
        ...
        yield {} # This makes it a valid generator protocol