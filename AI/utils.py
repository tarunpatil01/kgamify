import requests
import PyPDF2
import io
from sentence_transformers import util
from deep_translator import GoogleTranslator
from langdetect import detect

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

def translate_to_english(text):
    try:
        lang = detect(text)
        if lang != 'en':
            translated = GoogleTranslator(source='auto', target='en').translate(text)
            return translated
    except Exception as e:
        print(f"Translation error: {e}")
    return text

def calculate_skill_match(job_skills, job_description, resume_text, model):
    if not resume_text:
        return 0.0

    resume_embedding = model.encode(resume_text, convert_to_tensor=True)

    skill_scores = []
    for skill in job_skills:
        skill_embedding = model.encode(skill, convert_to_tensor=True)
        sim = util.cos_sim(skill_embedding, resume_embedding).item()
        skill_scores.append(sim)

    avg_skill_score = sum(skill_scores) / len(skill_scores) if skill_scores else 0.0

    desc_embedding = model.encode(job_description, convert_to_tensor=True)
    desc_score = util.cos_sim(desc_embedding, resume_embedding).item()

    final_score = 0.7 * avg_skill_score + 0.3 * desc_score
    return final_score

def semantic_match(text1, text2, model, threshold=0.75):
    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)
    score = util.cos_sim(emb1, emb2).item()
    is_match = score >= threshold
    return score, is_match

def match_experience(eligibility_text, applicant_exp_text, model):
    return semantic_match(eligibility_text, applicant_exp_text, model)

def match_education(eligibility_text, applicant_edu_text, model):
    return semantic_match(eligibility_text, applicant_edu_text, model)

def sort_key(applicant):
    return applicant["final_score"]
