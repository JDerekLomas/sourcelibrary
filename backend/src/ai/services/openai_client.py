import os
from typing import Iterable, overload, Literal
from openai import AsyncOpenAI, AsyncStream
from openai.types.chat import ChatCompletionMessageParam, ChatCompletion, ChatCompletionChunk

class OpenAIClient:
    """
    An asynchronous client for interacting with the OpenAI API.
    """
    def __init__(self):
        """
        Initializes the asynchronous OpenAI client.
        """
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    @overload
    async def get_response(self,
                           message: Iterable[ChatCompletionMessageParam],
                           stream: Literal[True]) -> AsyncStream[ChatCompletionChunk]:
        ...

    @overload
    async def get_response(self,
                           message: Iterable[ChatCompletionMessageParam],
                           stream: Literal[False]) -> ChatCompletion:
        ...
        
    @overload
    async def get_response(self,
                           message: Iterable[ChatCompletionMessageParam]) -> AsyncStream[ChatCompletionChunk]:
        ...
    async def get_response(self,
                           message: Iterable[ChatCompletionMessageParam],
                           stream: bool = True):
        """
        Gets a streaming response from the OpenAI API for a given prompt.

        Args:
            prompt: The prompt to send to the model.
            role: The role of the message sender. Defaults to "user".
            stream: Whether to stream the response. Defaults to True.

        Returns:
            A streaming or non-streaming response object depending on the stream parameter.
        """
        return await self.client.chat.completions.create(
            model=self.model_name,
            messages=message,
            stream=stream,
        )