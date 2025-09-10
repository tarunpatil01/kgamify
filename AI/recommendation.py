import pymongo
from sentence_transformers import SentenceTransformer
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
APPLICANTS_COLLECTION = "applicants"

def recommend_resumes(job_id, top_n=5):
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]

    job = db[JOBS_COLLECTION].find_one({"_id": job_id})
    if not job:
        return []

    applicants = list(db[APPLICANTS_COLLECTION].find({"applied_jobs": job_id}))
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Translate job details to English
    eligibility_text = translate_to_english(job.get("eligibility", ""))
    job_description = translate_to_english(job.get("description", ""))
    job_skills = [translate_to_english(skill) for skill in job.get("skills", [])]

    recommendations = []

    for applicant in applicants:
        resume_url = applicant.get("resume_url")
        if not resume_url:
            continue

        resume_text = extract_text_from_pdf(resume_url)
        resume_text = translate_to_english(resume_text)

        applicant_exp_text = translate_to_english(str(applicant.get("experience", "")))
        applicant_edu_text = translate_to_english(applicant.get("education", ""))

        # Semantic match for experience
        exp_score, exp_match = match_experience(eligibility_text, applicant_exp_text, model)

        # Semantic match for education
        edu_score, edu_match = match_education(eligibility_text, applicant_edu_text, model)

        # Semantic match for skills and description
        skill_score = calculate_skill_match(job_skills, job_description, resume_text, model)

        # Combine into final score
        final_score = 0.5 * skill_score + 0.25 * exp_score + 0.25 * edu_score

        recommendations.append({
            "applicant_id": str(applicant.get("_id")),
            "name": applicant.get("name", "N/A"),
            "experience": applicant_exp_text,
            "education": applicant_edu_text,
            "resume_url": resume_url,
            "skill_score": round(skill_score, 2),
            "exp_score": round(exp_score, 2),
            "edu_score": round(edu_score, 2),
            "final_score": round(final_score, 4)
        })

    return sorted(recommendations, key=sort_key, reverse=True)[:top_n]
