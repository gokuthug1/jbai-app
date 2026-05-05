from __future__ import annotations

from datetime import datetime

from .models import PlannedQuery, SearchModeRequest
from .utils import dedupe_strings, looks_freshness_sensitive, normalize_whitespace, quoted_phrases, tokenize


class QueryPlanner:
    def plan(self, request: SearchModeRequest) -> list[PlannedQuery]:
        query = normalize_whitespace(request.query)
        keywords = tokenize(query)
        exact_phrases = quoted_phrases(query)
        current_year = datetime.utcnow().year
        freshness = looks_freshness_sensitive(query) or request.search_topic == "news"

        candidates: list[PlannedQuery] = [
            PlannedQuery(text=query, purpose="verbatim-user-query", freshness_bias=freshness),
        ]

        if keywords:
            condensed = " ".join(keywords[:10])
            candidates.append(
                PlannedQuery(
                    text=condensed,
                    purpose="condensed-keyword-query",
                    freshness_bias=freshness,
                )
            )

        if freshness:
            candidates.append(
                PlannedQuery(
                    text=f"{query} {current_year}",
                    purpose="freshness-boosted-query",
                    freshness_bias=True,
                )
            )

        if exact_phrases:
            phrase_query = " ".join(f'"{phrase}"' for phrase in exact_phrases[:2])
            if keywords:
                phrase_query = f"{phrase_query} {' '.join(keywords[:6])}"
            candidates.append(
                PlannedQuery(
                    text=phrase_query,
                    purpose="exact-entity-query",
                    freshness_bias=freshness,
                    exact_match=True,
                )
            )

        planned_texts = dedupe_strings(item.text for item in candidates)
        planned: list[PlannedQuery] = []
        for item in candidates:
            if item.text in planned_texts and all(existing.text != item.text for existing in planned):
                planned.append(item)

        return planned[: request.max_search_queries]
