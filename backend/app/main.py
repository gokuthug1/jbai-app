from __future__ import annotations

import httpx
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import Settings, get_settings
from .models import SearchModeRequest, SearchModeResponse
from .orchestrator import WebSearchOrchestrator


app = FastAPI(
    title="J.B.A.I Web Search Mode API",
    version="0.1.0",
    description="Search-augmented generation backend for grounded, cited answers.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    settings = get_settings()
    app.state.http_client = httpx.AsyncClient(
        timeout=settings.request_timeout_seconds,
        follow_redirects=True,
        headers={"User-Agent": settings.http_user_agent},
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    client: httpx.AsyncClient | None = getattr(app.state, "http_client", None)
    if client is not None:
        await client.aclose()


def get_orchestrator(request: Request, settings: Settings = Depends(get_settings)) -> WebSearchOrchestrator:
    return WebSearchOrchestrator(settings=settings, client=request.app.state.http_client)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/web-search", response_model=SearchModeResponse)
async def web_search(
    payload: SearchModeRequest,
    orchestrator: WebSearchOrchestrator = Depends(get_orchestrator),
) -> SearchModeResponse:
    return await orchestrator.execute(payload)


@app.post("/v1/web-search/stream")
async def web_search_stream(
    payload: SearchModeRequest,
    orchestrator: WebSearchOrchestrator = Depends(get_orchestrator),
) -> StreamingResponse:
    return StreamingResponse(
        orchestrator.stream(payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
