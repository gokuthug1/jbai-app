from __future__ import annotations

from dataclasses import dataclass

import httpx

from .config import Settings
from .models import CitationOut, GroundingBundle, SearchModeRequest, SearchModeResponse, SourceSummaryOut
from .prompting import build_grounded_messages
from .query_planner import QueryPlanner
from .reranker import SourceReranker
from .search_providers import TavilySearchProvider
from .synthesizer import OpenAISynthesizer
from .token_budget import TokenBudgeter
from .utils import format_sse, trim_text
from .extraction import SourceExtractor


@dataclass(slots=True)
class PreparedSearch:
    request: SearchModeRequest
    queries: list[str]
    grounding: GroundingBundle
    insufficient_context: bool


class WebSearchOrchestrator:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client
        self.query_planner = QueryPlanner()
        self.search_provider = TavilySearchProvider(settings, client)
        self.extractor = SourceExtractor(settings, client)
        self.reranker = SourceReranker()
        self.budgeter = TokenBudgeter(settings)
        self.synthesizer = OpenAISynthesizer(settings, client)

    async def execute(self, request: SearchModeRequest) -> SearchModeResponse:
        prepared = await self._prepare(request)
        if prepared.insufficient_context:
            answer = "I do not have enough grounded evidence in the retrieved sources to answer that confidently."
        else:
            messages = build_grounded_messages(
                query=request.query,
                conversation=request.conversation,
                grounding=prepared.grounding,
            )
            answer = await self.synthesizer.complete(messages)

        return self._build_response(prepared, answer)

    async def stream(self, request: SearchModeRequest):
        try:
            yield format_sse("status", {"phase": "query_planning", "message": "Optimizing search queries..."})
            planned = self.query_planner.plan(request)
            yield format_sse(
                "query_plan",
                {"queries": [item.text for item in planned], "count": len(planned)},
            )

            yield format_sse("status", {"phase": "searching", "message": "Searching the web..."})
            raw_sources = await self.search_provider.search_many(planned, request)

            yield format_sse("status", {"phase": "reading", "message": "Reading and extracting sources..."})
            enriched_sources = await self.extractor.enrich(raw_sources)

            yield format_sse("status", {"phase": "ranking", "message": "Ranking source evidence..."})
            ranked = self.reranker.rank(request.query, enriched_sources)
            grounding = self.budgeter.build(
                request.query,
                ranked_sources=ranked,
                max_sources=min(request.max_sources, self.settings.max_sources),
            )
            prepared = PreparedSearch(
                request=request,
                queries=[item.text for item in planned],
                grounding=grounding,
                insufficient_context=self._insufficient_context(grounding),
            )

            yield format_sse("sources", self._sources_payload(prepared))

            if prepared.insufficient_context:
                answer = "I do not have enough grounded evidence in the retrieved sources to answer that confidently."
                yield format_sse("complete", self._build_response(prepared, answer).model_dump())
                return

            yield format_sse("status", {"phase": "synthesizing", "message": "Analyzing evidence and composing answer..."})
            messages = build_grounded_messages(
                query=request.query,
                conversation=request.conversation,
                grounding=prepared.grounding,
            )

            answer_parts: list[str] = []
            async for delta in self.synthesizer.stream(messages):
                answer_parts.append(delta)
                yield format_sse("answer_delta", {"delta": delta})

            answer = "".join(answer_parts).strip()
            yield format_sse("complete", self._build_response(prepared, answer).model_dump())
        except Exception as error:  # pragma: no cover
            yield format_sse("error", {"message": str(error)})

    async def _prepare(self, request: SearchModeRequest) -> PreparedSearch:
        planned = self.query_planner.plan(request)
        raw_sources = await self.search_provider.search_many(planned, request)
        enriched_sources = await self.extractor.enrich(raw_sources)
        ranked = self.reranker.rank(request.query, enriched_sources)
        grounding = self.budgeter.build(
            request.query,
            ranked_sources=ranked,
            max_sources=min(request.max_sources, self.settings.max_sources),
        )
        return PreparedSearch(
            request=request,
            queries=[item.text for item in planned],
            grounding=grounding,
            insufficient_context=self._insufficient_context(grounding),
        )

    def _insufficient_context(self, grounding: GroundingBundle) -> bool:
        return len(grounding.ranked_sources) < 2 or grounding.token_count < 300

    def _build_response(self, prepared: PreparedSearch, answer: str) -> SearchModeResponse:
        citations = [
            CitationOut(
                id=ranked.citation_id,
                title=ranked.source.title,
                url=ranked.source.url,
                domain=ranked.source.domain,
                published_at=ranked.source.published_at,
            )
            for ranked in prepared.grounding.ranked_sources
        ]
        sources = [
            SourceSummaryOut(
                id=ranked.citation_id,
                title=ranked.source.title,
                url=ranked.source.url,
                domain=ranked.source.domain,
                score=round(ranked.rank_score, 4),
                excerpt=trim_text(" ".join(ranked.selected_passages) or ranked.source.snippet, 320),
                published_at=ranked.source.published_at,
            )
            for ranked in prepared.grounding.ranked_sources
        ]
        return SearchModeResponse(
            answer=answer,
            citations=citations,
            sources=sources,
            queries=prepared.queries,
            insufficient_context=prepared.insufficient_context,
        )

    def _sources_payload(self, prepared: PreparedSearch) -> dict:
        return {
            "sources": [
                {
                    "id": ranked.citation_id,
                    "title": ranked.source.title,
                    "url": ranked.source.url,
                    "domain": ranked.source.domain,
                    "score": round(ranked.rank_score, 4),
                }
                for ranked in prepared.grounding.ranked_sources
            ]
        }
