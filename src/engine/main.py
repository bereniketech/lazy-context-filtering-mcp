from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engine.filter import filter_items
from engine.models import (
    ScoreRequest,
    ScoreResponse,
    SummarizeRequest,
    SummarizeResponse,
    TokenizeRequest,
    TokenizeResponse,
)
from engine.scorer import TFIDFScorer
from engine.summarizer import summarize
from engine.tokenizer import count_tokens

app = FastAPI(title="lazy-context-filtering-engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scorer once at startup
scorer = TFIDFScorer()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@app.post("/score")
async def score(request: ScoreRequest) -> ScoreResponse:
    """
    Score and rank context items by relevance to the query.
    
    Returns the top-k most relevant items ranked by relevance score.
    """
    scored_items = scorer.score(request.query, request.items)
    filtered_items = filter_items(scored_items, min_score=0.0, limit=request.top_k)
    
    return ScoreResponse(items=filtered_items)


@app.post("/summarize")
async def summarize_text(request: SummarizeRequest) -> SummarizeResponse:
    return SummarizeResponse(summary=summarize(request.text, request.max_length))


@app.post("/tokenize")
async def tokenize_text(request: TokenizeRequest) -> TokenizeResponse:
    token_count = count_tokens(request.text, request.model_family)
    return TokenizeResponse(token_count=token_count, tokens=[])
