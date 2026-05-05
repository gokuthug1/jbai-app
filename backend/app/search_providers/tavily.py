from __future__ import annotations

import asyncio

import httpx

from ..config import Settings
from ..models import PlannedQuery, SearchModeRequest, SourceDocument
from ..utils import extract_domain


class TavilySearchProvider:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    async def search_many(
        self,
        planned_queries: list[PlannedQuery],
        request: SearchModeRequest,
    ) -> list[SourceDocument]:
        if not self.settings.tavily_api_key:
            raise RuntimeError("TAVILY_API_KEY is not configured.")

        tasks = [self._search_single(query, request) for query in planned_queries]
        batches = await asyncio.gather(*tasks)

        flattened: list[SourceDocument] = []
        for batch in batches:
            flattened.extend(batch)
        return flattened

    async def _search_single(
        self,
        planned_query: PlannedQuery,
        request: SearchModeRequest,
    ) -> list[SourceDocument]:
        payload = {
            "query": planned_query.text,
            "topic": self._resolve_topic(request, planned_query),
            "search_depth": self._resolve_depth(request.mode),
            "max_results": request.max_results_per_query,
            "chunks_per_source": 3,
            "include_raw_content": "markdown",
            "include_answer": False,
            "include_domains": request.allowed_domains or None,
            "exclude_domains": request.blocked_domains or None,
            "country": request.country,
            "time_range": request.time_range or ("month" if planned_query.freshness_bias else None),
            "auto_parameters": True,
            "exact_match": planned_query.exact_match,
        }

        response_json = await self._post_with_retry(payload)
        results = response_json.get("results", [])

        documents: list[SourceDocument] = []
        for item in results:
            url = str(item.get("url") or "").strip()
            if not url:
                continue
            title = str(item.get("title") or url).strip()
            snippet = str(item.get("content") or "").strip()
            markdown = str(item.get("raw_content") or snippet).strip()
            score = float(item.get("score") or 0.0)
            published_at = item.get("published_date") or item.get("publishedDate")

            documents.append(
                SourceDocument(
                    url=url,
                    title=title,
                    domain=extract_domain(url),
                    snippet=snippet,
                    markdown=markdown,
                    provider_score=score,
                    originating_query=planned_query.text,
                    published_at=published_at,
                )
            )
        return documents

    def _resolve_depth(self, mode: str) -> str:
        if mode == "fast":
            return "fast"
        if mode == "deep":
            return "advanced"
        return "basic"

    def _resolve_topic(self, request: SearchModeRequest, planned_query: PlannedQuery) -> str:
        if request.search_topic == "finance":
            return "finance"
        if request.search_topic == "news" or planned_query.freshness_bias:
            return "news"
        return "general"

    async def _post_with_retry(self, payload: dict) -> dict:
        headers = {
            "Authorization": f"Bearer {self.settings.tavily_api_key}",
            "Content-Type": "application/json",
        }

        last_error: Exception | None = None
        for attempt in range(3):
            try:
                response = await self.client.post(
                    self.settings.tavily_search_url,
                    headers=headers,
                    json={key: value for key, value in payload.items() if value is not None},
                )
                if response.status_code in {429, 500, 502, 503, 504}:
                    delay = min(2.5, 0.4 * (2**attempt))
                    await asyncio.sleep(delay)
                    last_error = RuntimeError(
                        f"Tavily temporary failure: {response.status_code} {response.text[:200]}"
                    )
                    continue
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, ValueError) as error:
                last_error = error
                await asyncio.sleep(min(2.5, 0.4 * (2**attempt)))

        raise RuntimeError(f"Tavily search failed after retries: {last_error}") from last_error
