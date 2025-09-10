from fastapi import FastAPI, Query
from typing import Optional
from recommendation import recommend_resumes

app = FastAPI(title="Resume Recommender API")

@app.get("/recommend", summary="Get top N resumes for a job")
def recommend(job_id: str = Query(...), top_n: Optional[int] = 5):
    try:
        results = recommend_resumes(job_id, top_n)
        return {"job_id": job_id, "recommendations": results}
    except Exception as e:
        return {"error": str(e)}
