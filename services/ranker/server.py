import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from flashrank import Ranker, RerankRequest

app = FastAPI(title="Campus Network FlashRank Service", version="1.0.0")

# Initialize FlashRank model (cached locally)
MODEL_NAME = os.getenv("FLASHRANK_MODEL", "ms-marco-TinyBERT-L-2-v2")
CACHE_DIR = os.getenv("FLASHRANK_CACHE_DIR", "./.cache")
ranker = Ranker(model_name=MODEL_NAME, cache_dir=CACHE_DIR)

class PassageItem(BaseModel):
    id: str
    text: str

class RerankPayload(BaseModel):
    query: str
    passages: List[PassageItem]

class RankedItem(BaseModel):
    id: str
    score: float
    text: str

class RerankResponse(BaseModel):
    results: List[RankedItem]

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}

@app.post("/rerank", response_model=RerankResponse)
def rerank_passages(payload: RerankPayload):
    if not payload.passages:
        return {"results": []}

    passages_dict = [{"id": p.id, "text": p.text} for p in payload.passages]
    rerank_req = RerankRequest(query=payload.query, passages=passages_dict)

    try:
        ranked = ranker.rerank(rerank_req)
        formatted = [
            RankedItem(id=str(r["id"]), score=float(r["score"]), text=r.get("text", ""))
            for r in ranked
        ]
        return {"results": formatted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
