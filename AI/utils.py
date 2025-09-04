import requests
import PyPDF2
import io
import re
from sentence_transformers import util

# Prefer deep-translator on Python 3.13+; fall back to googletrans if available
try:
    from deep_translator import GoogleTranslator as DeepGoogleTranslator
    _use_deep = True
except Exception:
    _use_deep = False
    try:
        from googletrans import Translator as GTranslator
        _gt = GTranslator()
    except Exception:
        _gt = None

def detect_language(text: str) -> str:
    """Detect the dominant language in a text."""
    try:
        from langdetect import detect
        return detect(text)
    except Exception:
        return "unknown"

def translate_to_english(text: str) -> str:
    """Translate text to English using deep-translator (preferred) or googletrans."""
    text = text or ""
    if not text.strip():
        return text
    try:
        if _use_deep:
            return DeepGoogleTranslator(source="auto", target="en").translate(text)
        if _gt:
            return _gt.translate(text, dest="en").text
    except Exception:
        pass
    return text

def extract_text_from_pdf(url: str) -> str:
    """Download and extract text from a PDF resume."""
    response = requests.get(url, timeout=30)
    with io.BytesIO(response.content) as f:
        reader = PyPDF2.PdfReader(f)
        text = ''
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
    return text.strip()

def calculate_skill_match(required_skills, resume_text, model) -> float:
    """Calculate semantic similarity between required skills and resume text."""
    if not required_skills or not resume_text:
        return 0.0
    resume_embedding = model.encode(resume_text, convert_to_tensor=True)
    scores = []
    for skill in required_skills:
        skill_embedding = model.encode(skill, convert_to_tensor=True)
        sim = util.cos_sim(skill_embedding, resume_embedding).item()
        scores.append(sim)
    return sum(scores) / len(scores) if scores else 0.0

def calculate_experience_level(text: str) -> int:
    """Extract years of experience from text."""
    match = re.search(r'(\d+)\s*(?:years|yrs)', text, re.IGNORECASE)
    return int(match.group(1)) if match else 0

def calculate_education_level(text: str) -> int:
    """Infer education level from text."""
    levels = {
        "phd": 5,
        "m.tech": 4,
        "msc": 4,
        "master": 4,
        "b.tech": 3,
        "bachelor": 3,
        "diploma": 2,
        "12th": 2,
        "10th": 1
    }
    for edu, level in reversed(levels.items()):
        if edu in text.lower():
            return level
    return 0

def sort_key(applicant):
    """Sorting key for ranking resumes."""
    return applicant["final_score"]
