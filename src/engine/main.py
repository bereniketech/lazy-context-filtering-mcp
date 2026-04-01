from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engine.filter import filter_items
from engine.models import ScoreRequest, ScoreResponse
from engine.scorer import TFIDFScorer

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
