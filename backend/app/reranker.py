from __future__ import annotations

from .models import RankedSource, SourceDocument
from .utils import canonicalize_url, looks_freshness_sensitive, overlap_score, recency_score, tokenize


class SourceReranker:
    def rank(self, query: str, sources: list[SourceDocument]) -> list[RankedSource]:
        if not sources:
            return []

        query_terms = set(tokenize(query))
        freshness_sensitive = looks_freshness_sensitive(query)

        deduped: dict[str, SourceDocument] = {}
        for source in sources:
            key = canonicalize_url(source.url)
            previous = deduped.get(key)
            if previous is None or source.provider_score > previous.provider_score:
                deduped[key] = source

        scored: list[RankedSource] = []
        for source in deduped.values():
            title_score = overlap_score(query_terms, set(tokenize(source.title)))
            snippet_score = overlap_score(query_terms, set(tokenize(source.snippet)))
            body_score = overlap_score(query_terms, set(tokenize(source.markdown[:3000])))
            provider_score = min(1.0, max(0.0, source.provider_score))
            freshness_score = recency_score(source.published_at) if freshness_sensitive else 0.0
            length_score = min(1.0, len(source.markdown) / 3000) if source.markdown else 0.0

            rank_score = (
                0.28 * title_score
                + 0.18 * snippet_score
                + 0.26 * body_score
                + 0.20 * provider_score
                + 0.05 * freshness_score
                + 0.03 * length_score
            )
            scored.append(RankedSource(source=source, rank_score=rank_score))

        scored.sort(key=lambda item: item.rank_score, reverse=True)

        diversified: list[RankedSource] = []
        seen_domains: dict[str, int] = {}
        for ranked in scored:
            domain_hits = seen_domains.get(ranked.source.domain, 0)
            penalty = 0.08 * domain_hits
            ranked.rank_score = max(0.0, ranked.rank_score - penalty)
            diversified.append(ranked)
            seen_domains[ranked.source.domain] = domain_hits + 1

        diversified.sort(key=lambda item: item.rank_score, reverse=True)
        return diversified
