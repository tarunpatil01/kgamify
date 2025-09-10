import pymongo
from sentence_transformers import SentenceTransformer
from bson import ObjectId
from utils import (
    extract_text_from_pdf,
    calculate_skill_match,
    match_experience,
    match_education,
    sort_key,
    translate_to_english
)

from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
JOBS_COLLECTION = "jobs"
APPLICATIONS_COLLECTION = "applications"

_mongo_client = None
_model = None


def _get_client():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = pymongo.MongoClient(MONGO_URI)
    return _mongo_client


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def recommend_resumes(job_id, top_n=5):
    client = _get_client()
    db = client[DB_NAME]

    # Ensure ObjectId lookup still works if job_id is a hex string
    job_oid = None
    if ObjectId.is_valid(job_id):
        job_oid = ObjectId(job_id)

    job = db[JOBS_COLLECTION].find_one({"_id": job_oid}) if job_oid else None
    if not job:
        return []

    # Pull application documents referencing this job
    applications_query = {"jobId": job_oid} if job_oid else {"jobId": job_id}
    applications = list(db[APPLICATIONS_COLLECTION].find(applications_query))
    model = _get_model()

    # Translate job details to English (schema uses jobDescription & skills is a comma-separated string)
    eligibility_text = translate_to_english(job.get("eligibility", ""))
    job_description = translate_to_english(job.get("jobDescription", ""))
    raw_skills = job.get("skills") or ""
    if isinstance(raw_skills, str):
        skills_list = [s.strip() for s in raw_skills.split(',') if s.strip()]
    else:
        skills_list = raw_skills if isinstance(raw_skills, list) else []
    job_skills = [translate_to_english(skill) for skill in skills_list]

    recommendations = []

    for app in applications:
        resume_url = app.get("resume")  # stored Cloudinary URL
        if not resume_url:
            continue

        resume_text = extract_text_from_pdf(resume_url)
        resume_text = translate_to_english(resume_text)
        # Experience / education fields not in current schema; placeholders for scoring
        applicant_exp_text = ""
        applicant_edu_text = ""

        # Semantic match for experience
        exp_score, exp_match = match_experience(eligibility_text, applicant_exp_text, model)

        # Semantic match for education
        edu_score, edu_match = match_education(eligibility_text, applicant_edu_text, model)

        # Semantic match for skills and description
        skill_score = calculate_skill_match(job_skills, job_description, resume_text, model)

        # Combine into final score
        final_score = 0.5 * skill_score + 0.25 * exp_score + 0.25 * edu_score

        recommendations.append({
            "application_id": str(app.get("_id")),
            "applicantName": app.get("applicantName", "N/A"),
            "applicantEmail": app.get("applicantEmail"),
            "experience": applicant_exp_text,
            "education": applicant_edu_text,
            "resume_url": resume_url,
            "skill_score": round(skill_score, 2),
            "exp_score": round(exp_score, 2),
            "edu_score": round(edu_score, 2),
            "final_score": round(final_score, 4)
        })

    return sorted(recommendations, key=sort_key, reverse=True)[:top_n]
