from fastapi import FastAPI

app = FastAPI(title="lazy-context-filtering-engine")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
