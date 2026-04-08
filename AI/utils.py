import requests
import PyPDF2
import io
from deep_translator import GoogleTranslator
from langdetect import detect
from langdetect.lang_detect_exception import LangDetectException

def extract_text_from_pdf(url):
    response = requests.get(url)
    with io.BytesIO(response.content) as f:
        reader = PyPDF2.PdfReader(f)
        text = ''
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
    return text

_translator = None


def translate_to_english(text):
    """Translate arbitrary text to English, safely handling empty/short strings.

    Avoids langdetect errors ("No features in text") by short‑circuiting when
    the input is empty or mostly whitespace. Caches translator instance.
    """
    if not text or not str(text).strip():
        return text

    try:
        lang = detect(text)
    except (LangDetectException, Exception):  # fallback on detection failure
        return text

    if lang == 'en':
        return text

    global _translator
    if _translator is None:
        _translator = GoogleTranslator(source='auto', target='en')
    try:
        return _translator.translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

def calculate_skill_match(job_skills, job_description, resume_text, model):
    if not resume_text:
        return 0.0

    resume_lower = str(resume_text).lower()
    skills = [str(skill).strip().lower() for skill in (job_skills or []) if str(skill).strip()]

    # Lightweight lexical scoring used by default in low-memory environments.
    skill_hits = sum(1 for skill in skills if skill in resume_lower)
    skill_ratio = (skill_hits / len(skills)) if skills else 0.0

    desc_tokens = [token for token in str(job_description or '').lower().split() if len(token) > 2]
    if desc_tokens:
        overlap = sum(1 for token in set(desc_tokens) if token in resume_lower)
        desc_ratio = overlap / len(set(desc_tokens))
    else:
        desc_ratio = 0.0

    if model is None:
        return (0.7 * skill_ratio) + (0.3 * desc_ratio)

    try:
        from sentence_transformers import util  # Imported lazily to avoid heavy startup memory usage.

        resume_embedding = model.encode(resume_text, convert_to_tensor=True)

        skill_scores = []
        for skill in skills:
            skill_embedding = model.encode(skill, convert_to_tensor=True)
            sim = util.cos_sim(skill_embedding, resume_embedding).item()
            skill_scores.append(sim)

        avg_skill_score = sum(skill_scores) / len(skill_scores) if skill_scores else 0.0

        desc_embedding = model.encode(job_description or '', convert_to_tensor=True)
        desc_score = util.cos_sim(desc_embedding, resume_embedding).item()

        return (0.7 * avg_skill_score) + (0.3 * desc_score)
    except Exception:
        return (0.7 * skill_ratio) + (0.3 * desc_ratio)

def semantic_match(text1, text2, model, threshold=0.75):
    if model is None:
        left = str(text1 or '').lower()
        right = str(text2 or '').lower()
        if not left or not right:
            return 0.0, False
        left_tokens = set(token for token in left.split() if len(token) > 2)
        right_tokens = set(token for token in right.split() if len(token) > 2)
        union = left_tokens | right_tokens
        score = (len(left_tokens & right_tokens) / len(union)) if union else 0.0
        is_match = score >= threshold
        return score, is_match

    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)
    from sentence_transformers import util
    score = util.cos_sim(emb1, emb2).item()
    is_match = score >= threshold
    return score, is_match

def match_experience(eligibility_text, applicant_exp_text, model):
    return semantic_match(eligibility_text, applicant_exp_text, model)

def match_education(eligibility_text, applicant_edu_text, model):
    return semantic_match(eligibility_text, applicant_edu_text, model)

def sort_key(applicant):
    return applicant["final_score"]
