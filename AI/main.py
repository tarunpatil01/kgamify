import os
print("Starting AI service...")
print("PORT from env:", os.getenv("PORT"))
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict
from pydantic import BaseModel
import re
import os
import threading

app = FastAPI(title="KGamify AI Services")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://kgamify-job.onrender.com",
    "https://kgamify-job-portal.vercel.app",
    "*"  # Allow all for now
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ML Models (Optional) ====================
models = {
    'grammar_corrector': None,
    'grammar_tokenizer': None,
    'device': 'cpu',
    'loaded': False
}

_recommend_resumes_fn = None
_recommend_resumes_detailed_fn = None
_chat_with_ollama_fn = None


def _get_recommend_resumes_fn():
    global _recommend_resumes_fn
    if _recommend_resumes_fn is None:
        from recommendation import recommend_resumes as _recommend
        _recommend_resumes_fn = _recommend
    return _recommend_resumes_fn


def _get_recommend_resumes_detailed_fn():
    global _recommend_resumes_detailed_fn
    if _recommend_resumes_detailed_fn is None:
        from recommendation import recommend_resumes_detailed as _recommend_detailed
        _recommend_resumes_detailed_fn = _recommend_detailed
    return _recommend_resumes_detailed_fn


def _get_chat_with_ollama_fn():
    global _chat_with_ollama_fn
    if _chat_with_ollama_fn is None:
        from chatbot import chat_with_ollama as _chat
        _chat_with_ollama_fn = _chat
    return _chat_with_ollama_fn

def load_ml_models():
    """Try to load ML models, gracefully fail if not available"""
    global models
    if models['loaded']:
        return
    
    try:
        import torch
        from transformers import T5Tokenizer, T5ForConditionalGeneration
        
        print("🤖 Loading ML models...")
        models['device'] = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        models['grammar_tokenizer'] = T5Tokenizer.from_pretrained(
            'vennify/t5-base-grammar-correction'
        )
        models['grammar_corrector'] = T5ForConditionalGeneration.from_pretrained(
            'vennify/t5-base-grammar-correction'
        ).to(models['device'])
        
        models['loaded'] = True
        print("✅ ML models loaded!")
    except Exception as e:
        print(f"⚠️ ML models not available: {e}")
        print("Using rule-based fallback")

def start_model_loader_in_background():
    """Load heavy ML models in a daemon thread so HTTP port can bind quickly."""
    def _loader():
        try:
            load_ml_models()
        except Exception as e:
            print(f"⚠️ Background model loader failed: {e}")

    threading.Thread(target=_loader, daemon=True).start()

@app.on_event("startup")
def on_startup():
    print("FastAPI startup complete. Starting background model loader...")
    start_model_loader_in_background()

# ==================== Tech Term Corrections ====================
TECH_CORRECTIONS = {
    r'\b[jJ][hH][aA][vV][aA]\b': 'Java',
    r'\b[jJ][aA][bB][aA]\b': 'Java',
    r'\b[pP][yY][tT][hH][nN]\b': 'Python',
    r'\b[pP][yY][tT][oO][nN]\b': 'Python',
    r'\b[pP][hH][yY][tT][oO][nN]\b': 'Python',
    r'\b[rR][eE][aA][cC][tT][tT]\b': 'React',
    r'\b[rR][aA][eE][cC][tT]\b': 'React',
    r'\b[jJ][aA][vV][aA][sS][cC][rR][pP][tT]\b': 'JavaScript',
    r'\b[jJ][aA][vV][aA][sS][rR][iI][pP][tT]\b': 'JavaScript',
    r'\b[tT][yY][pP][eE][sS][cC][iI][pP][tT]\b': 'TypeScript',
    r'\b[nN][oO][dD][eE][jJ][sS]\b': 'Node.js',
    r'\b[nN][oO][dD][jJ][sS]\b': 'Node.js',
    r'\b[mM][oO][nN][gG][oO][dD][bB]\b': 'MongoDB',
    r'\b[mM][aA][nN][gG][oO][dD][bB]\b': 'MongoDB',
    r'\b[aA][nN][gG][uU][aA][lL][rR]\b': 'Angular',
    r'\b[dD][jJ][aA][gG][oO]\b': 'Django',
    r'\b[dD][oO][cC][eE][kK][rR]\b': 'Docker',
    r'\b[dD][oO][kK][eE][rR]\b': 'Docker',
    r'\b[dD][eE][vV][lL][oO][pP][rR]\b': 'developer',
    r'\b[dD][eE][vV][eE][lL][oO][pP][rR]\b': 'developer',
    r'\b[eE][nN][gG][iI][nN][eE][rR]\b': 'engineer',
    r'\b[eE][xX][pP][eE][rR][iI][aA][nN][cC][eE]\b': 'experience',
}

def fix_tech_terms(text: str) -> str:
    """Fix common tech typos"""
    result = text
    for pattern, replacement in TECH_CORRECTIONS.items():
        result = re.sub(pattern, replacement, result)
    return result

def correct_grammar_t5(text: str) -> str:
    """Grammar correction using T5 model"""
    if not models['grammar_corrector']:
        return text
    try:
        import torch
        inputs = models['grammar_tokenizer'].encode(
            f"grammar: {text}",
            return_tensors='pt',
            max_length=512,
            truncation=True
        ).to(models['device'])
        
        with torch.no_grad():
            outputs = models['grammar_corrector'].generate(
                inputs, max_length=512, num_beams=4, early_stopping=True
            )
        return models['grammar_tokenizer'].decode(outputs[0], skip_special_tokens=True)
    except:
        return text

# ==================== Request Models ====================
class ChatRequest(BaseModel):
    message: str

class TextRequest(BaseModel):
    text: str

# -------------------------------
# Resume Recommendation API
# -------------------------------
@app.get("/recommend", summary="Get top N resumes for a job")
def recommend(job_id: str = Query(...), top_n: Optional[int] = 5):
    try:
        recommend_resumes = _get_recommend_resumes_fn()
        results = recommend_resumes(job_id, top_n)
        return {"job_id": job_id, "recommendations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend-detailed", summary="Get detailed vector-based recommendations and summary data")
def recommend_detailed(job_id: str = Query(...), top_n: Optional[int] = 5):
    try:
        recommend_resumes_detailed = _get_recommend_resumes_detailed_fn()
        return recommend_resumes_detailed(job_id, top_n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------
# Chatbot API
# -------------------------------
@app.post("/chat")
def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    chat_with_ollama = _get_chat_with_ollama_fn()
    reply = chat_with_ollama(req.message)
    return {"reply": reply}

# -------------------------------
# Rephrase API (Full correction + formalization)
# -------------------------------
@app.post("/rephrase")
def rephrase(req: TextRequest):
    """Full rephrase: fixes spelling + grammar + formalizes tone"""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text required")
    
    text = req.text
    changes = []
    processed = text
    
    # Step 1: Fix tech terms
    tech_fixed = fix_tech_terms(processed)
    if tech_fixed != processed:
        changes.append("Tech terms corrected")
        processed = tech_fixed
    
    # Step 2: Grammar correction (T5 if available)
    grammar_corrected = correct_grammar_t5(processed)
    if grammar_corrected != processed:
        changes.append("Grammar corrected")
        processed = grammar_corrected
    
    # Step 3: Re-apply tech terms
    processed = fix_tech_terms(processed)
    
    # Step 4: Remove contractions
    contractions = {
        r"\bcan't\b": "cannot", r"\bdon't\b": "do not", r"\bwon't\b": "will not",
        r"\bisn't\b": "is not", r"\bwe're\b": "we are", r"\bit's\b": "it is",
        r"\bthey're\b": "they are", r"\byou'll\b": "you will",
    }
    for pattern, replacement in contractions.items():
        new_processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
        if new_processed != processed:
            changes.append("Contractions expanded")
            processed = new_processed
            break
    
    # Cleanup
    processed = re.sub(r'\s{2,}', ' ', processed).strip()
    if processed and processed[0].islower():
        processed = processed[0].upper() + processed[1:]
    
    return {
        "original": text,
        "rephrased": processed,
        "changes": changes if changes else ["No changes needed"],
        "model_used": "ML" if models['loaded'] else "rules"
    }

# -------------------------------
# Spell Correct API (Only fixes, no rephrasing)
# -------------------------------
@app.post("/spell-correct")
def spell_correct(req: TextRequest):
    """Spell + grammar correction only, no tone changes"""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text required")
    
    text = req.text
    changes = []
    processed = text
    
    # Fix tech terms
    tech_fixed = fix_tech_terms(processed)
    if tech_fixed != processed:
        changes.append("Tech terms corrected")
        processed = tech_fixed
    
    # Grammar correction
    grammar_corrected = correct_grammar_t5(processed)
    if grammar_corrected != processed:
        changes.append("Grammar corrected")
        processed = grammar_corrected
    
    # Re-apply tech terms
    processed = fix_tech_terms(processed)
    processed = re.sub(r'\s{2,}', ' ', processed).strip()
    
    return {
        "original": text,
        "corrected": processed,
        "changes": changes if changes else ["No changes needed"],
        "model_used": "ML" if models['loaded'] else "rules"
    }

# -------------------------------
# Suggest API (Real-time issue detection)
# -------------------------------
@app.post("/suggest")
def suggest(req: TextRequest):
    """Quick suggestions for real-time detection"""
    if not req.text.strip():
        return {"success": True, "suggestions": [], "hasIssues": False, "issueCount": 0}
    
    suggestions = []
    spell_fixed = fix_tech_terms(req.text)
    
    if spell_fixed != req.text:
        suggestions.append({
            "type": "spelling",
            "severity": "high",
            "message": "Spelling errors detected"
        })
    
    return {
        "success": True,
        "suggestions": suggestions,
        "hasIssues": len(suggestions) > 0,
        "issueCount": len(suggestions)
    }

# -------------------------------
# Health Check
# -------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": models['loaded'],
        "device": models['device']
    }

@app.get("/")
def root():
    return {
        "service": "kgamify-ai",
        "endpoints": ["/recommend", "/chat", "/rephrase", "/spell-correct", "/suggest", "/health"],
        "models_loaded": models['loaded']
    }