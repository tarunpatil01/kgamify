from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from recommendation import recommend_resumes

app = FastAPI(title="Resume Recommender API")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# NOTE: Avoid using '*' together with allow_credentials=True; browsers will reject.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/recommend", summary="Get top N resumes for a job")
def recommend(job_id: str = Query(...), top_n: Optional[int] = 5):
    try:
        results = recommend_resumes(job_id, top_n)
        return {"job_id": job_id, "recommendations": results}
    except HTTPException:
        raise
    except Exception as e:
        # Surface server error with proper status code so frontend can distinguish
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", summary="Health check")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"service": "resume-recommender", "endpoints": ["/recommend", "/health"]}
