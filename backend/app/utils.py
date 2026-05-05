from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Iterable
from urllib.parse import urlparse, urlunparse


STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "latest",
    "most",
    "new",
    "of",
    "on",
    "or",
    "recent",
    "that",
    "the",
    "this",
    "to",
    "up",
    "was",
    "what",
    "when",
    "where",
    "which",
    "who",
    "with",
}

FRESHNESS_TERMS = {
    "current",
    "latest",
    "live",
    "new",
    "news",
    "recent",
    "recently",
    "today",
    "update",
    "updated",
    "yesterday",
}


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def tokenize(value: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[A-Za-z0-9]{2,}", (value or "").lower())
        if token not in STOPWORDS
    ]


def dedupe_strings(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for value in values:
        normalized = normalize_whitespace(value)
        if not normalized:
            continue
        lowered = normalized.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        deduped.append(normalized)
    return deduped


def quoted_phrases(text: str) -> list[str]:
    return re.findall(r'"([^"]+)"', text or "")


def looks_freshness_sensitive(query: str) -> bool:
    query_tokens = set(tokenize(query))
    return any(token in query_tokens for token in FRESHNESS_TERMS)


def canonicalize_url(url: str) -> str:
    parsed = urlparse(url or "")
    clean_path = parsed.path.rstrip("/") or "/"
    clean_query = "&".join(
        segment
        for segment in parsed.query.split("&")
        if segment and not segment.startswith("utm_")
    )
    clean = parsed._replace(
        scheme=(parsed.scheme or "https").lower(),
        netloc=(parsed.netloc or "").lower(),
        path=clean_path,
        params="",
        query=clean_query,
        fragment="",
    )
    return urlunparse(clean)


def extract_domain(url: str) -> str:
    return (urlparse(url or "").netloc or "").lower().removeprefix("www.")


def trim_text(text: str, limit: int) -> str:
    normalized = normalize_whitespace(text)
    if len(normalized) <= limit:
        return normalized
    return normalized[: max(0, limit - 3)].rstrip() + "..."


def iter_paragraphs(markdown: str) -> list[str]:
    raw_parts = re.split(r"\n\s*\n+", markdown or "")
    cleaned: list[str] = []
    for part in raw_parts:
        normalized = normalize_whitespace(part)
        if len(normalized) >= 40:
            cleaned.append(normalized)
    return cleaned


def overlap_score(query_terms: set[str], document_terms: set[str]) -> float:
    if not query_terms or not document_terms:
        return 0.0
    return len(query_terms & document_terms) / max(1, len(query_terms))


def parse_published_at(value: str | None) -> datetime | None:
    if not value:
        return None
    candidate = value.strip()
    if not candidate:
        return None
    try:
        return datetime.fromisoformat(candidate.replace("Z", "+00:00"))
    except ValueError:
        return None


def recency_score(published_at: str | None) -> float:
    parsed = parse_published_at(published_at)
    if parsed is None:
        return 0.0
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    age_days = max(0.0, (datetime.now(timezone.utc) - parsed).total_seconds() / 86_400)
    if age_days <= 1:
        return 1.0
    if age_days <= 7:
        return 0.8
    if age_days <= 30:
        return 0.5
    if age_days <= 180:
        return 0.2
    return 0.05


def format_sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=True)}\n\n"
