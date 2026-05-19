from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: Literal["user", "assistant", "system"] = "user"
    content: str = Field(min_length=1, max_length=12_000)


class SearchModeRequest(BaseModel):
    query: str = Field(min_length=2, max_length=4_000)
    conversation: list[ChatTurn] = Field(default_factory=list)
    mode: Literal["fast", "balanced", "deep"] = "balanced"
    search_topic: Literal["general", "news", "finance"] = "general"
    time_range: Literal["day", "week", "month", "year"] | None = None
    allowed_domains: list[str] = Field(default_factory=list)
    blocked_domains: list[str] = Field(default_factory=list)
    country: str | None = None
    max_search_queries: int = Field(default=4, ge=1, le=6)
    max_results_per_query: int = Field(default=5, ge=1, le=10)
    max_sources: int = Field(default=6, ge=1, le=10)
    debug: bool = False
    skill_instructions: str | None = None


@dataclass(slots=True)
class PlannedQuery:
    text: str
    purpose: str
    freshness_bias: bool = False
    exact_match: bool = False


@dataclass(slots=True)
class SourceDocument:
    url: str
    title: str
    domain: str
    snippet: str
    markdown: str
    provider_score: float
    originating_query: str
    published_at: str | None = None


@dataclass(slots=True)
class RankedSource:
    source: SourceDocument
    rank_score: float
    selected_passages: list[str] = field(default_factory=list)
    citation_id: int = 0
    token_count: int = 0


@dataclass(slots=True)
class GroundingBundle:
    context_text: str
    ranked_sources: list[RankedSource]
    token_count: int


class CitationOut(BaseModel):
    id: int
    title: str
    url: str
    domain: str
    published_at: str | None = None


class SourceSummaryOut(BaseModel):
    id: int
    title: str
    url: str
    domain: str
    score: float
    excerpt: str
    published_at: str | None = None


class SearchModeResponse(BaseModel):
    answer: str
    citations: list[CitationOut]
    sources: list[SourceSummaryOut]
    queries: list[str]
    insufficient_context: bool


class SkillCatalogItemOut(BaseModel):
    id: str
    name: str
    title: str
    description: str
    summary: str
    promptTemplate: str
    instructions: str = ""
    sourcePath: str | None = None


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model: str | None = None


class ImageGenerationResponse(BaseModel):
    image_data: str

