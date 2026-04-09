import pymongo
import re
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
DB_NAME = os.getenv("DB_NAME") or os.getenv("MONGO_DB_NAME") or "test"
JOBS_COLLECTION = "jobs"
APPLICATIONS_COLLECTION = "applications"

_mongo_client = None
_model = None
USE_EMBEDDINGS = os.getenv("RECOMMENDER_USE_EMBEDDINGS", "false").lower() == "true"

COMMON_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "will", "from", "into", "your",
    "you", "our", "their", "have", "has", "are", "job", "role", "years", "year",
    "experience", "required", "requirements", "responsibilities", "ability", "strong",
    "good", "knowledge", "work", "team", "candidate", "must", "one", "more", "such",
    "as", "or", "to", "of", "in", "on", "at", "by", "is", "be", "an", "a"
}

KNOWN_SKILLS = {
    "python", "java", "javascript", "typescript", "node", "nodejs", "react", "angular",
    "vue", "django", "flask", "fastapi", "spring", "springboot", "express", "mongodb",
    "mysql", "postgresql", "sql", "nosql", "redis", "docker", "kubernetes", "aws", "gcp",
    "azure", "git", "linux", "rest", "graphql", "microservices", "c", "c++", "c#", "go",
    "rust", "php", "html", "css", "tailwind", "bootstrap", "pandas", "numpy", "ml", "ai"
}


def _get_client():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = pymongo.MongoClient(MONGO_URI)
    return _mongo_client


def _get_model():
    global _model
    if not USE_EMBEDDINGS:
        return None
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def _normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _parse_tokens(value):
    return [token for token in re.split(r"[,/|;\n]+", str(value or "")) if token.strip()]


def _extract_job_skills(job):
    raw_skills = job.get("skills") or ""
    skills = []
    if isinstance(raw_skills, str):
        skills.extend(_parse_tokens(raw_skills))
    elif isinstance(raw_skills, list):
        skills.extend(raw_skills)

    job_text = " ".join([
        job.get("jobTitle", ""),
        job.get("jobDescription", ""),
        job.get("responsibilities", ""),
        job.get("eligibility", ""),
        job.get("tags", "")
    ])

    text_tokens = [
        token for token in re.split(r"[^a-zA-Z0-9+#.]+", job_text)
        if token and len(token) > 1
    ]

    normalized = []
    for value in skills + text_tokens:
        token = _normalize_text(value)
        if not token:
            continue
        if token in COMMON_STOPWORDS:
            continue
        if token.isdigit():
            continue
        if token not in KNOWN_SKILLS and len(token) < 3:
            continue
        if token not in normalized:
            normalized.append(token)

    return normalized


def _merge_job_context(job, job_context):
    if not isinstance(job_context, dict):
        return job

    merged = dict(job or {})
    for key in ["jobTitle", "jobDescription", "responsibilities", "eligibility", "skills", "experienceLevel", "location", "tags"]:
        value = job_context.get(key)
        if value is not None:
            merged[key] = value
    return merged


def _extract_section_snippet(text, keywords, window=220):
    lower = text.lower()
    for keyword in keywords:
        index = lower.find(keyword)
        if index >= 0:
            start = max(0, index - window // 2)
            end = min(len(text), index + window)
            return re.sub(r"\s+", " ", text[start:end]).strip()
    return ""


def _parse_years(value):
    if not value:
        return 0.0
    text = _normalize_text(value)
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)", text)
    if range_match:
        return float(range_match.group(2))
    plus_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)", text)
    if plus_match:
        return float(plus_match.group(1))
    single_match = re.search(r"(\d+(?:\.\d+)?)", text)
    if single_match and any(token in text for token in ["year", "yr", "experience"]):
        return float(single_match.group(1))
    return 0.0


def _extract_candidate_features(resume_text):
    normalized_text = _normalize_text(resume_text)
    experience_snippet = _extract_section_snippet(resume_text, ["experience", "work experience", "professional experience", "internship"])
    projects_snippet = _extract_section_snippet(resume_text, ["projects", "project experience", "academic project"])
    education_snippet = _extract_section_snippet(resume_text, ["education", "academic", "qualification"])

    years_match = re.findall(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience)?", normalized_text)
    experience_years = max((float(v) for v in years_match), default=0.0)

    project_hits = sum(normalized_text.count(token) for token in ["project", "developed", "built", "deployed", "implemented", "led"])
    project_hits = min(10, project_hits)

    academic_score = 0.0
    academic_notes = []
    degree_terms = ["b.tech", "btech", "b.e", "be ", "m.tech", "mtech", "mca", "mba", "b.sc", "bsc", "m.sc", "msc", "phd", "diploma"]
    if any(term in normalized_text for term in degree_terms):
        academic_score += 0.35
        academic_notes.append("degree")
    cgpa_match = re.search(r"(?:cgpa|gpa)\s*[:\-]?\s*(\d+(?:\.\d+)?)", normalized_text)
    if cgpa_match:
        cgpa = float(cgpa_match.group(1))
        academic_score = max(academic_score, min(1.0, cgpa / 10.0))
        academic_notes.append(f"cgpa:{cgpa_match.group(1)}")
    percentage_match = re.search(r"(\d{2}(?:\.\d+)?)\s*%", normalized_text)
    if percentage_match:
        percentage = float(percentage_match.group(1))
        academic_score = max(academic_score, min(1.0, percentage / 100.0))
        academic_notes.append(f"percentage:{percentage_match.group(1)}")

    return {
        "experience_years": experience_years,
        "experience_snippet": experience_snippet,
        "projects_snippet": projects_snippet,
        "education_snippet": education_snippet,
        "project_hits": project_hits,
        "academic_score": round(max(academic_score, 0.0), 4),
        "academic_notes": academic_notes,
        "text_length": len(normalized_text),
    }


def _build_fallback_candidate_text(app):
    skills = app.get("skills") or []
    if isinstance(skills, list):
        skills_text = ", ".join(str(s).strip() for s in skills if str(s).strip())
    else:
        skills_text = str(skills or "")

    return " ".join([
        f"Candidate name: {app.get('applicantName', '')}",
        f"Skills: {skills_text}",
        f"Test score: {app.get('testScore', '')}",
        "Resume content unavailable; using application metadata fallback."
    ]).strip()


def _safe_resume_text(app):
    resume_url = app.get("resume")
    if not resume_url:
        return _build_fallback_candidate_text(app), False

    try:
        extracted = extract_text_from_pdf(resume_url)
        translated = translate_to_english(extracted)
        if translated and str(translated).strip():
            return translated, True
    except Exception:
        pass

    return _build_fallback_candidate_text(app), False


def _score_candidate(job, app, job_skills, model, resume_text):
    eligibility_text = translate_to_english(job.get("eligibility", ""))
    job_description = translate_to_english(job.get("jobDescription", ""))

    feature_text = translate_to_english(resume_text)
    candidate_features = _extract_candidate_features(feature_text)

    skill_similarity = calculate_skill_match(job_skills, job_description, feature_text, model)
    skill_score = max(0.0, min(1.0, (skill_similarity + 1.0) / 2.0))

    expected_years = _parse_years(job.get("experienceLevel", ""))
    if expected_years <= 0:
        expected_years = _parse_years(eligibility_text)
    if expected_years <= 0:
        expected_years = 2.0

    experience_years = candidate_features["experience_years"]
    experience_score = min(1.0, experience_years / max(expected_years, 1.0))

    project_score = min(1.0, candidate_features["project_hits"] / 6.0)
    academic_score = candidate_features["academic_score"]

    test_score_raw = 0.0
    try:
        test_score_raw = float(str(app.get("testScore", "")).replace("%", "").strip() or 0)
    except Exception:
        test_score_raw = 0.0
    test_score = min(1.0, max(0.0, test_score_raw / 100.0))

    resume_presence = 1.0 if app.get("resume") else 0.0
    final_score = (
        0.38 * skill_score +
        0.24 * experience_score +
        0.18 * project_score +
        0.12 * academic_score +
        0.05 * test_score +
        0.03 * resume_presence
    ) * 100.0

    matched_skills = []
    resume_lower = feature_text.lower()
    for skill in job_skills:
        if skill and skill.lower() in resume_lower:
            matched_skills.append(skill)

    feature_vector = [
        round(skill_score, 4),
        round(experience_score, 4),
        round(project_score, 4),
        round(academic_score, 4),
        round(test_score, 4),
        round(resume_presence, 4)
    ]

    return {
        "score": round(final_score, 2),
        "matched_skills": matched_skills,
        "candidate_features": candidate_features,
        "feature_vector": feature_vector,
        "signals": {
            "skill_score": round(skill_score, 4),
            "experience_score": round(experience_score, 4),
            "project_score": round(project_score, 4),
            "academic_score": round(academic_score, 4),
            "test_score": round(test_score, 4),
            "resume_presence": resume_presence,
        }
    }


def recommend_resumes(job_id, top_n=5, job_context=None):
    detailed = recommend_resumes_detailed(job_id, top_n, job_context=job_context)
    return detailed.get("recommendations", [])


def recommend_resumes_detailed(job_id, top_n=5, job_context=None):
    client = _get_client()
    db = client[DB_NAME]

    job_oid = ObjectId(job_id) if ObjectId.is_valid(job_id) else None
    job = db[JOBS_COLLECTION].find_one({"_id": job_oid}) if job_oid else None
    if not job and not job_context:
        return {"job_id": job_id, "job": None, "recommendations": [], "vectorData": {}}

    job = _merge_job_context(job or {}, job_context)

    applications_query = {"jobId": job_oid} if job_oid else {"jobId": job_id}
    applications = list(db[APPLICATIONS_COLLECTION].find(applications_query))
    model = _get_model()
    job_skills = _extract_job_skills(job)

    recommendations = []
    for app in applications:
        resume_url = app.get("resume")
        resume_text, parsed_resume_ok = _safe_resume_text(app)
        scoring = _score_candidate(job, app, job_skills, model, resume_text)

        recommendations.append({
            "application_id": str(app.get("_id")),
            "applicantName": app.get("applicantName", "N/A"),
            "applicantEmail": app.get("applicantEmail"),
            "resume_url": resume_url,
            "skills": app.get("skills") or [],
            "experience": scoring["candidate_features"]["experience_snippet"],
            "projects": scoring["candidate_features"]["projects_snippet"],
            "education": scoring["candidate_features"]["education_snippet"],
            "academic_score": scoring["candidate_features"]["academic_score"],
            "matched_skills": scoring["matched_skills"],
            "score": scoring["score"],
            "final_score": scoring["score"],
            "skill_score": scoring["signals"]["skill_score"],
            "exp_score": scoring["signals"]["experience_score"],
            "project_score": scoring["signals"]["project_score"],
            "edu_score": scoring["signals"]["academic_score"],
            "test_score": scoring["signals"]["test_score"],
            "resume_parsed": parsed_resume_ok,
            "vectorData": {
                "featureVector": scoring["feature_vector"],
                "signals": scoring["signals"],
                "candidateFeatures": scoring["candidate_features"],
            },
            "source": "python-vector-model"
        })

    sorted_recommendations = sorted(recommendations, key=sort_key, reverse=True)[:top_n]

    return {
        "job_id": job_id,
        "job": {
            "jobTitle": job.get("jobTitle", ""),
            "jobDescription": job.get("jobDescription", ""),
            "skills": job_skills,
            "experienceLevel": job.get("experienceLevel", ""),
            "eligibility": job.get("eligibility", ""),
            "location": job.get("location", "")
        },
        "recommendations": sorted_recommendations,
        "vectorData": {
            "jobSkills": job_skills,
            "jobTitle": job.get("jobTitle", ""),
            "experienceLevel": job.get("experienceLevel", ""),
            "candidateCount": len(recommendations),
            "modelMode": "embedding" if USE_EMBEDDINGS else "lightweight-lexical"
        }
    }
