from __future__ import annotations

import asyncio

import httpx
import trafilatura

from .config import Settings
from .models import SourceDocument
from .utils import trim_text


class SourceExtractor:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    async def enrich(self, sources: list[SourceDocument]) -> list[SourceDocument]:
        if not sources:
            return []

        ranked_by_provider = sorted(sources, key=lambda item: item.provider_score, reverse=True)
        candidates = [source for source in ranked_by_provider[:4] if self._needs_fetch(source)]

        fetch_tasks = [self._fetch_markdown(source) for source in candidates]
        fetched_markdown = await asyncio.gather(*fetch_tasks, return_exceptions=True)

        enriched_by_url: dict[str, str] = {}
        for source, result in zip(candidates, fetched_markdown):
            if isinstance(result, Exception):
                continue
            if result:
                enriched_by_url[source.url] = result

        enriched_sources: list[SourceDocument] = []
        for source in sources:
            markdown = enriched_by_url.get(source.url, source.markdown or source.snippet)
            snippet = source.snippet or trim_text(markdown, 500)
            enriched_sources.append(
                SourceDocument(
                    url=source.url,
                    title=source.title,
                    domain=source.domain,
                    snippet=snippet,
                    markdown=markdown,
                    provider_score=source.provider_score,
                    originating_query=source.originating_query,
                    published_at=source.published_at,
                )
            )
        return enriched_sources

    def _needs_fetch(self, source: SourceDocument) -> bool:
        return len((source.markdown or "").strip()) < 700

    async def _fetch_markdown(self, source: SourceDocument) -> str | None:
        response = await self.client.get(
            source.url,
            headers={"User-Agent": self.settings.http_user_agent},
            follow_redirects=True,
        )
        response.raise_for_status()
        content_type = response.headers.get("content-type", "").lower()
        if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
            return None

        markdown = trafilatura.extract(
            response.text,
            output_format="markdown",
            include_links=True,
            include_tables=True,
            favor_precision=True,
            deduplicate=True,
        )
        if not markdown:
            return None
        return markdown.strip()
