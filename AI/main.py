from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from recommendation import recommend_resumes

app = FastAPI(title="Resume Recommender API")

# Allow calls from local dev frontends
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/recommend", summary="Get top N resumes for a job")
def recommend(job_id: str = Query(...), top_n: Optional[int] = 5):
    """
    Get top N recommended resumes for a given job_id.
    Handles multilingual resumes and job descriptions automatically.
    """
    try:
        results = recommend_resumes(job_id, top_n)
        return {"job_id": job_id, "recommendations": results}
    except Exception as e:
        return {"error": str(e)}
