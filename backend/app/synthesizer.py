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


class GeminiSynthesizer:
    """
    Synthesis via Google Gemini API (free tier available at https://ai.google.dev).
    Uses the generateContent endpoint with the OpenAI-compatible message format.
    """

    GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    def _endpoint(self, action: str) -> str:
        model = self.settings.synthesis_model or "gemini-2.0-flash-lite"
        return f"{self.GEMINI_BASE_URL}/{model}:{action}?key={self.settings.gemini_api_key}"

    def _to_gemini_contents(self, messages: list[dict]) -> tuple[list[dict], str | None]:
        """Convert OpenAI-style messages to Gemini contents + systemInstruction."""
        system_text: list[str] = []
        contents: list[dict] = []
        for msg in messages:
            role = msg.get("role", "user")
            text = msg.get("content", "")
            if role == "system":
                system_text.append(text)
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": text}]})
            else:
                contents.append({"role": "user", "parts": [{"text": text}]})
        return contents, "\n\n".join(system_text) if system_text else None

    async def complete(self, messages: list[dict]) -> str:
        if not self.settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")
        contents, system_text = self._to_gemini_contents(messages)
        payload: dict = {"contents": contents, "generationConfig": {"temperature": 0.1}}
        if system_text:
            payload["systemInstruction"] = {"parts": [{"text": system_text}]}

        response = await self.client.post(
            self._endpoint("generateContent"),
            json=payload,
            timeout=self.settings.request_timeout_seconds + 30,
        )
        self._raise_for_error(response, response.text)
        data = response.json()
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts).strip()

    async def stream(self, messages: list[dict]):
        """Stream via streamGenerateContent (server-sent events)."""
        if not self.settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")
        contents, system_text = self._to_gemini_contents(messages)
        payload: dict = {"contents": contents, "generationConfig": {"temperature": 0.1}}
        if system_text:
            payload["systemInstruction"] = {"parts": [{"text": system_text}]}

        async with self.client.stream(
            "POST",
            self._endpoint("streamGenerateContent") + "&alt=sse",
            json=payload,
            timeout=self.settings.request_timeout_seconds + 30,
        ) as response:
            if not response.is_success:
                error_body = (await response.aread()).decode("utf-8", errors="ignore")
                self._raise_for_error(response, error_body)
            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                raw = line.removeprefix("data:").strip()
                if not raw:
                    continue
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                parts = event.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                for part in parts:
                    text = part.get("text", "")
                    if text:
                        yield text

    def _raise_for_error(self, response: httpx.Response, body_text: str = "") -> None:
        if response.is_success:
            return
        message = body_text[:500]
        raise RuntimeError(f"Gemini synthesis failed: {response.status_code} {message}")
