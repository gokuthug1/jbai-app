from __future__ import annotations

import json

import httpx

from .config import Settings


class OpenAISynthesizer:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    async def complete(self, messages: list[dict]) -> str:
        response = await self.client.post(
            self.settings.openai_chat_completions_url,
            headers=self._headers(),
            json=self._payload(messages, stream=False),
            timeout=self.settings.request_timeout_seconds + 30,
        )
        self._raise_for_error(response, response.text)
        payload = response.json()
        content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
        if isinstance(content, list):
            return "".join(item.get("text", "") for item in content if isinstance(item, dict)).strip()
        return str(content).strip()

    async def stream(self, messages: list[dict]):
        async with self.client.stream(
            "POST",
            self.settings.openai_chat_completions_url,
            headers=self._headers(),
            json=self._payload(messages, stream=True),
            timeout=self.settings.request_timeout_seconds + 30,
        ) as response:
            if not response.is_success:
                error_body = (await response.aread()).decode("utf-8", errors="ignore")
                self._raise_for_error(response, error_body)
            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                payload = line.removeprefix("data:").strip()
                if payload == "[DONE]":
                    break
                try:
                    event = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                delta = event.get("choices", [{}])[0].get("delta", {}).get("content")
                if delta:
                    yield delta

    def _headers(self) -> dict[str, str]:
        if not self.settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")
        return {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }

    def _payload(self, messages: list[dict], stream: bool) -> dict:
        return {
            "model": self.settings.synthesis_model,
            "messages": messages,
            "temperature": 0.1,
            "stream": stream,
        }

    def _raise_for_error(self, response: httpx.Response, body_text: str = "") -> None:
        if response.is_success:
            return
        message = body_text[:500]
        raise RuntimeError(f"OpenAI synthesis failed: {response.status_code} {message}")
