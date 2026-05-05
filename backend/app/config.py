from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    search_provider: str = "tavily"
    synthesis_provider: str = "groq"

    tavily_api_key: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    hf_api_key: str | None = None

    synthesis_model: str = "llama-3.3-70b-versatile"
    max_context_tokens: int = Field(default=10_000, ge=2_000, le=64_000)
    reserved_answer_tokens: int = Field(default=1_600, ge=256, le=8_192)
    max_sources: int = Field(default=6, ge=1, le=12)
    max_search_queries: int = Field(default=4, ge=1, le=8)
    max_results_per_query: int = Field(default=5, ge=1, le=10)
    request_timeout_seconds: float = Field(default=25.0, ge=5.0, le=120.0)
    http_user_agent: str = "JBAI-WebSearch/1.0"

    tavily_search_url: str = "https://api.tavily.com/search"
    openai_chat_completions_url: str = "https://api.openai.com/v1/chat/completions"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
