from __future__ import annotations

from typing import Protocol

from ..models import PlannedQuery, SearchModeRequest, SourceDocument


class SearchProvider(Protocol):
    async def search_many(
        self,
        planned_queries: list[PlannedQuery],
        request: SearchModeRequest,
    ) -> list[SourceDocument]:
        ...
