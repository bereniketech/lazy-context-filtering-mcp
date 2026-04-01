from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ContextItemPayload(BaseModel):
    """Single context candidate sent from the TS MCP server."""

    id: str = Field(min_length=1)
    text: str = Field(min_length=1)
    metadata: dict[str, Any] | None = None


class ScoreRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str = Field(min_length=1)
    items: list[ContextItemPayload] = Field(min_length=1)
    top_k: int = Field(default=5, ge=1)


class ScoredItem(BaseModel):
    id: str = Field(min_length=1)
    text: str = Field(min_length=1)
    score: float
    metadata: dict[str, Any] | None = None


class ScoreResponse(BaseModel):
    items: list[ScoredItem]


class SummarizeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1)
    max_length: int = Field(default=200, ge=1)


class SummarizeResponse(BaseModel):
    summary: str


class TokenizeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1)
    model_family: str = Field(default="generic", min_length=1)


class TokenizeResponse(BaseModel):
    token_count: int = Field(ge=0)
    tokens: list[int] = Field(default_factory=list)