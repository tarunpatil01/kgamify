import pymongo
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from utils import (
    extract_text_from_pdf,
    calculate_skill_match,
    calculate_experience_level,
    calculate_education_level,
    sort_key,
    detect_language,
    translate_to_english
)

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
JOBS_COLLECTION = "jobs"
APPLICANTS_COLLECTION = "applicants"

# Experience levels mapping
exp_map = {
    "junior": 1,
    "mid": 2,
    "senior": 3
}

# Education levels mapping
edu_levels = {
    "10th": 1,
    "12th": 2,
    "diploma": 2,
    "bachelor": 3,
    "b.tech": 3,
    "bsc": 3,
    "m.tech": 4,
    "msc": 4,
    "master": 4,
    "phd": 5
}

def recommend_resumes(job_id, top_n=5):
    """Return top N recommended resumes for a given job_id."""

    # Connect to MongoDB
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client[DB_NAME]
        job = db[JOBS_COLLECTION].find_one({"_id": job_id, "status": "active"})
        applicants = list(db[APPLICANTS_COLLECTION].find({"applied_jobs": job_id}))
    except Exception:
        return []

    if not job:
        return []

    # Load multilingual model
    model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

    job_skills = job.get("skills", [])
    job_description = job.get("description", "")
    required_exp = exp_map.get(job.get("experience", "").lower(), 0)
    required_edu = edu_levels.get(job.get("education", "").lower(), 0)

    # Detect job language
    job_lang = detect_language(" ".join(job_skills) + " " + job_description)

    recommendations = []

    for applicant in applicants:
        # Extract resume text
        resume_text = ""
        if applicant.get("resume_url"):
            resume_text = extract_text_from_pdf(applicant["resume_url"])
        else:
            resume_text = applicant.get("resume_text", "")

        if not resume_text.strip():
            continue

        # Detect resume language
        resume_lang = detect_language(resume_text)

        # Translate to English if languages differ
        if job_lang != resume_lang:
            job_skills_translated = [translate_to_english(skill) for skill in job_skills]
            job_description_translated = translate_to_english(job_description)
            resume_text_translated = translate_to_english(resume_text)
        else:
            job_skills_translated = job_skills
            job_description_translated = job_description
            resume_text_translated = resume_text

        # Calculate scores
        test_score = applicant.get("test_score", None)
        skill_score = calculate_skill_match(job_skills_translated, resume_text_translated, model)
        exp_level = calculate_experience_level(resume_text_translated)
        edu_level = calculate_education_level(resume_text_translated)

        exp_score = 1.0 if exp_level >= required_exp else 0.5
        edu_score = 1.0 if edu_level >= required_edu else 0.5

        if test_score is not None:
            norm_test_score = test_score / 100
            final_score = (
                0.35 * norm_test_score +
                0.35 * skill_score +
                0.15 * exp_score +
                0.15 * edu_score
            )
        else:
            final_score = (
                0.45 * skill_score +
                0.275 * exp_score +
                0.275 * edu_score
            )

        recommendations.append({
            "applicant_id": str(applicant.get("_id")),
            "name": applicant.get("name", "N/A"),
            "test_score": test_score,
            "skill_score": round(skill_score, 2),
            "exp_score": exp_score,
            "edu_score": edu_score,
            "final_score": round(final_score, 4),
            "resume_url": applicant.get("resume_url")
        })

    return sorted(recommendations, key=sort_key, reverse=True)[:top_n]
