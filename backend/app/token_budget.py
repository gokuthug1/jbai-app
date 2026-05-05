from __future__ import annotations

from .config import Settings
from .models import GroundingBundle, RankedSource
from .utils import iter_paragraphs, overlap_score, tokenize, trim_text

try:
    import tiktoken
except ImportError:  # pragma: no cover
    tiktoken = None


class TokenBudgeter:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.encoding = self._build_encoding(settings.synthesis_model)

    def build(self, query: str, ranked_sources: list[RankedSource], max_sources: int) -> GroundingBundle:
        total_budget = max(1_500, self.settings.max_context_tokens - self.settings.reserved_answer_tokens - 1_200)
        selected_sources: list[RankedSource] = []
        blocks: list[str] = []
        used_tokens = 0

        for ranked in ranked_sources[:max_sources]:
            per_source_budget = max(250, total_budget // max(1, max_sources))
            passages = self._select_relevant_passages(query, ranked.source.markdown, ranked.source.snippet, per_source_budget)
            if not passages:
                passages = [trim_text(ranked.source.snippet or ranked.source.markdown, 600)]

            ranked.selected_passages = passages

            provisional_citation_id = len(selected_sources) + 1
            ranked.citation_id = provisional_citation_id
            source_block = self._format_source_block(ranked)
            source_tokens = self.count_tokens(source_block)
            if used_tokens + source_tokens > total_budget and selected_sources:
                continue

            ranked.token_count = source_tokens
            used_tokens += source_tokens
            selected_sources.append(ranked)
            blocks.append(source_block)

        return GroundingBundle(
            context_text="\n\n".join(blocks),
            ranked_sources=selected_sources,
            token_count=used_tokens,
        )

    def count_tokens(self, text: str) -> int:
        if not text:
            return 0
        if self.encoding is not None:
            return len(self.encoding.encode(text))
        return max(1, len(text) // 4)

    def _select_relevant_passages(
        self,
        query: str,
        markdown: str,
        fallback_snippet: str,
        budget_tokens: int,
    ) -> list[str]:
        query_terms = set(tokenize(query))
        paragraphs = iter_paragraphs(markdown)
        if not paragraphs:
            return [trim_text(fallback_snippet, 800)] if fallback_snippet else []

        scored = []
        for paragraph in paragraphs:
            score = overlap_score(query_terms, set(tokenize(paragraph)))
            score += min(0.2, len(paragraph) / 4000)
            scored.append((score, paragraph))

        scored.sort(key=lambda item: item[0], reverse=True)

        selected: list[str] = []
        used_tokens = 0
        for _, paragraph in scored:
            paragraph_tokens = self.count_tokens(paragraph)
            if paragraph_tokens > budget_tokens:
                paragraph = trim_text(paragraph, budget_tokens * 4)
                paragraph_tokens = self.count_tokens(paragraph)
            if used_tokens + paragraph_tokens > budget_tokens and selected:
                continue
            selected.append(paragraph)
            used_tokens += paragraph_tokens
            if used_tokens >= budget_tokens:
                break

        return selected

    def _format_source_block(self, ranked: RankedSource) -> str:
        source = ranked.source
        passages = "\n".join(f"- {passage}" for passage in ranked.selected_passages)
        published_line = f"\nPublished: {source.published_at}" if source.published_at else ""
        return (
            f"[{ranked.citation_id}] {source.title}\n"
            f"URL: {source.url}\n"
            f"Domain: {source.domain}{published_line}\n"
            f"Evidence:\n{passages}"
        )

    def _build_encoding(self, model: str):
        if tiktoken is None:
            return None
        try:
            return tiktoken.encoding_for_model(model)
        except KeyError:
            return tiktoken.get_encoding("cl100k_base")
