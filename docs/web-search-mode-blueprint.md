# Web Search Mode Blueprint

This blueprint adds an optional backend service that turns J.B.A.I into a Perplexity-style search-augmented system while keeping the existing direct client mode intact.

## Architecture Diagram

```text
Browser UI
  -> Search Mode toggle enabled
  -> POST /v1/web-search/stream

FastAPI Orchestrator
  -> Query Planner
     -> multi-search query variants
  -> Search Provider (Tavily)
     -> concurrent live web searches
  -> Extraction Layer
     -> use provider markdown when available
     -> fetch and extract fallback HTML for weak results
  -> Re-ranker
     -> dedupe, score relevance, apply freshness/domain diversity
  -> Token Budgeter
     -> select best passages per source
     -> fit context budget
  -> Synthesizer
     -> grounded prompt
     -> streamed answer with inline citations

Response Stream
  -> status: "Searching the web..."
  -> status: "Reading sources..."
  -> status: "Ranking source evidence..."
  -> status: "Analyzing evidence..."
  -> answer deltas
  -> complete payload with citations and source cards
```

## End-to-End Workflow

1. User submits a question with Search Mode enabled.
2. `QueryPlanner` rewrites the raw question into 2-4 search variants:
   - verbatim query
   - condensed keyword query
   - freshness-boosted query for current-events questions
   - exact-entity query when quoted phrases or named entities are present
3. `TavilySearchProvider` executes the variants concurrently.
4. `SourceExtractor` trusts Tavily's `include_raw_content=markdown` output first, then fetches only the weakest top results for fallback extraction.
5. `SourceReranker` removes duplicate URLs, scores title/snippet/body overlap, boosts freshness when the query is time-sensitive, and applies mild domain diversity penalties.
6. `TokenBudgeter` selects the most relevant passages from each source and enforces a strict total token budget before synthesis.
7. `OpenAISynthesizer` receives only the curated evidence bundle plus the strict grounding prompt.
8. The UI receives streamed phases and answer deltas, then renders final citations mapped to source URLs.

## Async and Latency Strategy

### What runs concurrently

- Search query variants run in parallel.
- Fallback extraction runs concurrently for the top weak sources only.
- UI status streaming begins before synthesis so the user sees forward progress immediately.

### Latency controls

- Use Tavily as the default provider because it can return both ranked results and extracted markdown in one call.
- Limit search variants to 3-4 queries for most requests.
- Cap fallback HTML fetches to 4 sources.
- Start with `mode=balanced`; escalate to `deep` only when evidence quality is poor.
- Reserve answer tokens up front so context packing never causes late truncation.

### Recommended future optimization

For the lowest p95 latency, promote the pipeline from stage-by-stage batching to a speculative flow:

1. Start synthesis as soon as 3-5 high-confidence sources are ready.
2. Continue extracting lower-ranked sources in the background.
3. Cancel remaining fetches once the evidence threshold is met.

## Search Provider Recommendation

### Default recommendation: Tavily

- Best fit for LLM grounding because search and extracted content come back together.
- Lower orchestration complexity than Serper because you are not forced into a second scraping pass for every result.
- Good tradeoff between freshness, relevance, and implementation speed.

### When to prefer Exa

- Semantic discovery is more important than Google-like SERP fidelity.
- You want embeddings-first retrieval behavior.

### When to prefer Serper

- You need Google SERP fidelity, shopping/news/maps variants, or exact SERP-style ranking.
- You are willing to own a separate extraction pipeline for result pages.

## Backend Module Map

- `backend/app/main.py`: FastAPI app and streaming endpoints.
- `backend/app/orchestrator.py`: end-to-end control plane.
- `backend/app/query_planner.py`: search query transformation.
- `backend/app/search_providers/tavily.py`: search adapter.
- `backend/app/extraction.py`: HTML fetch and markdown extraction fallback.
- `backend/app/reranker.py`: source filtering and ranking.
- `backend/app/token_budget.py`: context packing and passage selection.
- `backend/app/prompting.py`: strict grounding prompt.
- `backend/app/synthesizer.py`: streamed LLM synthesis.

## API Contract

### Streaming endpoint

`POST /v1/web-search/stream`

Request body:

```json
{
  "query": "What changed in OpenAI's latest developer tools announcements?",
  "conversation": [
    { "role": "user", "content": "Keep it concise." }
  ],
  "mode": "balanced",
  "search_topic": "news",
  "max_search_queries": 4,
  "max_results_per_query": 5,
  "max_sources": 6
}
```

SSE event types:

- `status`
- `query_plan`
- `sources`
- `answer_delta`
- `complete`
- `error`

### Non-streaming endpoint

`POST /v1/web-search`

Returns:

```json
{
  "answer": "Grounded answer with [1][2] citations.",
  "citations": [
    { "id": 1, "title": "...", "url": "...", "domain": "..." }
  ],
  "sources": [
    { "id": 1, "title": "...", "url": "...", "score": 0.92, "excerpt": "..." }
  ],
  "queries": ["...", "..."],
  "insufficient_context": false
}
```

## Context Processing and RAG Strategy

### Extraction

- Preferred path: use Tavily `raw_content` in markdown form.
- Fallback path: fetch HTML and run `trafilatura.extract(..., output_format="markdown")`.
- If extraction fails, keep the provider snippet but lower its downstream confidence.

### Re-ranking

Rank score is a hybrid of:

- title overlap with the user query
- snippet overlap
- body overlap across the extracted markdown
- original provider score
- recency boost for freshness-sensitive questions
- small diversity penalty for repeated domains

This keeps the first pass cheap and deterministic. If you later need better precision, replace the reranker with a cross-encoder or model-based rerank service behind the same interface.

### Token management

- Reserve answer tokens before packing context.
- Allocate a per-source token budget.
- Split source markdown into paragraphs.
- Score paragraphs by query overlap.
- Keep only the highest-value passages until the source cap is reached.
- Drop overflow sources instead of truncating the full prompt indiscriminately.

## Strict Grounding Prompt

The production prompt lives in `backend/app/prompting.py`. The core contract is:

```text
You are J.B.A.I Search Mode, a web-grounded synthesis engine.

1. Use only the provided grounding sources for factual claims.
2. Every factual claim must be backed by inline citations [1], [2], or [1][3].
3. Do not use prior knowledge to fill gaps.
4. If the sources are insufficient or conflicting, say so plainly.
5. Never invent citations or facts.
```

## UI and State Management

### Toggle behavior

Add a dedicated `searchMode` flag to the client settings model. In the current app, the most natural integration points are:

- [script.js](C:/Users/jb/Documents/GitHub/jbai-app/script.js:901) for the settings modal toggle
- [script.js](C:/Users/jb/Documents/GitHub/jbai-app/script.js:1568) for stream transport selection
- [script.js](C:/Users/jb/Documents/GitHub/jbai-app/script.js:1753) for generation lifecycle updates

### Suggested client state machine

- `idle`
- `query_planning`
- `searching`
- `reading`
- `ranking`
- `synthesizing`
- `complete`
- `error`

### User-facing labels

- `query_planning` -> `Optimizing search...`
- `searching` -> `Searching the web...`
- `reading` -> `Reading sources...`
- `ranking` -> `Ranking evidence...`
- `synthesizing` -> `Analyzing data...`

### Perceived-performance guidance

- Show source cards as soon as the `sources` event arrives instead of waiting for the full answer.
- Keep the phase label sticky above the streaming response.
- If the answer is still running after 5-8 seconds, rotate sub-status text such as `Cross-checking sources...` or `Comparing evidence...`.
- Preserve the final citations even if the user stops generation mid-stream.

## Error Handling and Hallucination Mitigation

### Error handling

- Retry transient search failures (`429`, `500`, `502`, `503`, `504`) with jittered backoff.
- Fail fast on missing API keys or invalid configuration.
- Emit structured `error` events over SSE so the UI can exit gracefully.
- Time-box fallback extraction; do not let slow websites dominate tail latency.
- Return partial source lists when some fetches fail.

### Hallucination mitigation

- Never let the model see raw user intent without the evidence bundle.
- Require citations for every factual claim.
- Short-circuit with an insufficiency response when fewer than 2 sources or too little evidence survives filtering.
- Dedupe repeated URLs to avoid false confidence from duplicated evidence.
- Bias toward fresh sources when the question is temporally unstable.
- Keep temperature low during synthesis.

## Runbook

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `TAVILY_API_KEY` and `OPENAI_API_KEY`.
3. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

5. Point the frontend Search Mode transport at `http://localhost:8000/v1/web-search/stream`.
