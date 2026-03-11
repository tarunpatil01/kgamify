from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel

from recommendation import recommend_resumes
from chatbot import chat_with_ollama

app = FastAPI(title="KGamify AI Services")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Resume Recommendation API
# -------------------------------
@app.get("/recommend", summary="Get top N resumes for a job")
def recommend(job_id: str = Query(...), top_n: Optional[int] = 5):
    try:
        results = recommend_resumes(job_id, top_n)
        return {"job_id": job_id, "recommendations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------
# Chatbot API (🔥 FIXES 404)
# -------------------------------
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    reply = chat_with_ollama(req.message)
    return {"reply": reply}

# -------------------------------
# Health
# -------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {
        "service": "kgamify-ai",
        "endpoints": ["/recommend", "/chat", "/health"]
    }