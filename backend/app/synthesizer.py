from __future__ import annotations

import json

import httpx

from .config import Settings


# ---------------------------------------------------------------------------
# Shared OpenAI-compatible streaming helper
# ---------------------------------------------------------------------------

async def _stream_openai_compat(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    payload: dict,
    timeout: float,
):
    """Stream SSE from any OpenAI-compatible endpoint and yield text deltas."""
    async with client.stream("POST", url, headers=headers, json=payload, timeout=timeout) as response:
        if not response.is_success:
            error_body = (await response.aread()).decode("utf-8", errors="ignore")
            raise RuntimeError(f"API error {response.status_code}: {error_body[:400]}")
        async for line in response.aiter_lines():
            if not line or not line.startswith("data:"):
                continue
            raw = line.removeprefix("data:").strip()
            if raw == "[DONE]":
                break
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                continue
            delta = event.get("choices", [{}])[0].get("delta", {}).get("content")
            if delta:
                yield delta


async def _complete_openai_compat(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    payload: dict,
    timeout: float,
) -> str:
    """Non-streaming completion from any OpenAI-compatible endpoint."""
    response = await client.post(url, headers=headers, json=payload, timeout=timeout)
    if not response.is_success:
        raise RuntimeError(f"API error {response.status_code}: {response.text[:400]}")
    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if isinstance(content, list):
        return "".join(item.get("text", "") for item in content if isinstance(item, dict)).strip()
    return str(content).strip()


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


class GroqSynthesizer:
    """
    Synthesis via Groq API (free tier at https://console.groq.com).
    Groq uses an OpenAI-compatible API format — just a different base URL and key.
    """

    GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    async def complete(self, messages: list[dict]) -> str:
        response = await self.client.post(
            self.GROQ_CHAT_URL,
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
            self.GROQ_CHAT_URL,
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
        if not self.settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured.")
        return {
            "Authorization": f"Bearer {self.settings.groq_api_key}",
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
        raise RuntimeError(f"Groq synthesis failed: {response.status_code} {message}")


class GeminiSynthesizer:
    """
    Synthesis via Google Gemini API (free tier available at https://ai.google.dev).
    """

    GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    def _endpoint(self, action: str) -> str:
        model = self.settings.synthesis_model or "gemini-2.0-flash-lite"
        return f"{self.GEMINI_BASE_URL}/{model}:{action}?key={self.settings.gemini_api_key}"

    def _to_gemini_contents(self, messages: list[dict]) -> tuple[list[dict], str | None]:
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


class HuggingFaceSynthesizer:
    """
    Synthesis via Hugging Face Inference API (free tier, EMAIL-ONLY signup).
    Sign up at https://huggingface.co — no phone number required.
    Get your token at https://huggingface.co/settings/tokens

    Uses the OpenAI-compatible endpoint:
      https://api-inference.huggingface.co/v1/chat/completions
    """

    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    @property
    def hf_chat_url(self) -> str:
        # The free Inference API requires the model ID in the URL
        return f"https://api-inference.huggingface.co/models/{self.settings.synthesis_model}/v1/chat/completions"

    def _headers(self) -> dict[str, str]:
        if not self.settings.hf_api_key:
            raise RuntimeError("HF_API_KEY is not configured. Get a free token at https://huggingface.co/settings/tokens")
        return {
            "Authorization": f"Bearer {self.settings.hf_api_key}",
            "Content-Type": "application/json",
        }

    def _payload(self, messages: list[dict], stream: bool) -> dict:
        return {
            "model": self.settings.synthesis_model,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 2048,
            "stream": stream,
        }

    async def complete(self, messages: list[dict]) -> str:
        return await _complete_openai_compat(
            self.client,
            self.hf_chat_url,
            self._headers(),
            self._payload(messages, stream=False),
            self.settings.request_timeout_seconds + 30,
        )

    async def stream(self, messages: list[dict]):
        async for delta in _stream_openai_compat(
            self.client,
            self.hf_chat_url,
            self._headers(),
            self._payload(messages, stream=True),
            self.settings.request_timeout_seconds + 30,
        ):
            yield delta

