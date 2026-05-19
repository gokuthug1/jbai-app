from __future__ import annotations

import base64
import urllib.parse
import httpx
from fastapi import Depends, FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import Settings, get_settings
from .models import SearchModeRequest, SearchModeResponse, SkillCatalogItemOut, ImageGenerationRequest, ImageGenerationResponse
from .orchestrator import WebSearchOrchestrator
from .skills_catalog import discover_skill_catalog



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


@app.get("/v1/skills/catalog", response_model=list[SkillCatalogItemOut])
async def skills_catalog() -> list[SkillCatalogItemOut]:
    return discover_skill_catalog()


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


@app.post("/v1/images/generate", response_model=ImageGenerationResponse)
async def generate_image(
    payload: ImageGenerationRequest,
    settings: Settings = Depends(get_settings),
) -> ImageGenerationResponse:
    client: httpx.AsyncClient = app.state.http_client
    prompt = payload.prompt

    # 1. Try Hugging Face FLUX if api key exists
    if settings.hf_api_key:
        try:
            url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
            headers = {"Authorization": f"Bearer {settings.hf_api_key}"}
            res = await client.post(url, headers=headers, json={"inputs": prompt}, timeout=60.0)
            if res.status_code == 200 and res.content:
                content_type = res.headers.get("content-type", "image/jpeg")
                b64_data = base64.b64encode(res.content).decode("utf-8")
                return ImageGenerationResponse(image_data=f"data:{content_type};base64,{b64_data}")
        except Exception:
            # Fall back to Pollinations if HF fails
            pass

    # 2. Fallback to Pollinations AI
    try:
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
        res = await client.get(url, timeout=30.0)
        if res.status_code == 200 and res.content:
            content_type = res.headers.get("content-type", "image/jpeg")
            b64_data = base64.b64encode(res.content).decode("utf-8")
            return ImageGenerationResponse(image_data=f"data:{content_type};base64,{b64_data}")
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch image from Pollinations AI")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

