"""
ML Server - Keeps models loaded in memory
Run once, serve multiple requests without reloading models

Usage:
    python ml_server.py  # Starts server on port 5001
    
    Then call from Node.js:
    curl -X POST http://localhost:5001/rephrase -d '{"text":"jhava developr"}'
    curl -X POST http://localhost:5001/spell-correct -d '{"text":"jhava developr"}'
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import re
from typing import Dict

try:
    from transformers import (
        T5Tokenizer, T5ForConditionalGeneration,
        AutoTokenizer, AutoModelForSeq2SeqLM
    )
    from textblob import TextBlob
    import torch
    MODELS_AVAILABLE = True
except ImportError:
    MODELS_AVAILABLE = False
    print("❌ ML libraries not installed. Install: pip install torch transformers textblob flask flask-cors")
    sys.exit(1)

# Flask app
app = Flask(__name__)
CORS(app)

# Global models (loaded once, kept in memory)
models = {
    'grammar_corrector': None,
    'grammar_tokenizer': None,
    'paraphraser': None,
    'paraphrase_tokenizer': None,
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',
    'loaded': False
}

def load_models():
    """Load models once on server startup"""
    global models
    
    if models['loaded']:
        return
    
    print("🤖 Loading AI models (one-time setup)...")
    
    try:
        # T5 Grammar
        print("📚 Loading T5 grammar model...")
        models['grammar_tokenizer'] = T5Tokenizer.from_pretrained(
            'vennify/t5-base-grammar-correction'
        )
        models['grammar_corrector'] = T5ForConditionalGeneration.from_pretrained(
            'vennify/t5-base-grammar-correction'
        ).to(models['device'])
        
        # Pegasus Paraphrase
        print("📚 Loading Pegasus paraphrase model...")
        models['paraphrase_tokenizer'] = AutoTokenizer.from_pretrained(
            'tuner007/pegasus_paraphrase'
        )
        models['paraphraser'] = AutoModelForSeq2SeqLM.from_pretrained(
            'tuner007/pegasus_paraphrase'
        ).to(models['device'])
        
        models['loaded'] = True
        print("✅ Models loaded and ready!")
        
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        raise

def fix_tech_terms(text: str) -> str:
    """Fix tech typos - case preserving"""
    corrections = {
        # Programming languages - common typos
        r'\b[jJ][hH][aA][vV][aA]\b': 'Java',
        r'\b[jJ][aA][bB][aA]\b': 'Java',
        r'\b[jJ][vV][aA]\b': 'Java',
        r'\b[pP][yY][tT][hH][nN]\b': 'Python',
        r'\b[pP][yY][tT][oO][nN]\b': 'Python',
        r'\b[pP][hH][yY][tT][oO][nN]\b': 'Python',
        r'\b[rR][eE][aA][cC][tT][tT]\b': 'React',
        r'\b[rR][aA][eE][cC][tT]\b': 'React',
        r'\b[rR][eE][cC][aA][tT]\b': 'React',
        
        # JavaScript variants
        r'\b[jJ][aA][vV][aA][sS][cC][rR][pP][tT]\b': 'JavaScript',
        r'\b[jJ][aA][vV][aA][sS][rR][iI][pP][tT]\b': 'JavaScript',
        r'\b[jJ][aA][vV][aA][sS][cC][iI][pP][tT]\b': 'JavaScript',
        
        # TypeScript
        r'\b[tT][yY][pP][eE][sS][cC][iI][pP][tT]\b': 'TypeScript',
        r'\b[tT][yY][eE][pP][sS][cC][rR][iI][pP][tT]\b': 'TypeScript',
        
        # Frameworks - common typos
        r'\b[nN][oO][dD][eE][jJ][sS]\b': 'Node.js',
        r'\b[nN][oO][dD][jJ][sS]\b': 'Node.js',
        r'\b[mM][oO][nN][gG][oO][dD][bB]\b': 'MongoDB',
        r'\b[mM][oO][nN][gG][oO][dD]\b': 'MongoDB',
        r'\b[mM][aA][nN][gG][oO][dD][bB]\b': 'MongoDB',
        r'\b[aA][nN][gG][uU][aA][lL][rR]\b': 'Angular',
        r'\b[aA][nN][gG][lL][aA][rR]\b': 'Angular',
        r'\b[vV][uU][eE][jJ][sS]\b': 'Vue.js',
        r'\b[vV][uU][eE][eE]\b': 'Vue.js',
        r'\b[sS][pP][rR][iI][nN][gG][bB][oO][oO][tT]\b': 'Spring Boot',
        r'\b[sS][pP][rR][iI][nN][bB][oO][oO][tT]\b': 'Spring Boot',
        r'\b[dD][jJ][aA][gG][oO]\b': 'Django',
        r'\b[jJ][aA][nN][gG][oO]\b': 'Django',
        r'\b[dD][oO][cC][eE][kK][rR]\b': 'Docker',
        r'\b[dD][oO][kK][cC][eE][rR]\b': 'Docker',
        r'\b[dD][oO][kK][eE][rR]\b': 'Docker',
        
        # Job titles - common typos
        r'\b[dD][eE][vV][lL][oO][pP][rR]\b': 'developer',
        r'\b[dD][eE][vV][eE][lL][oO][pP][rR]\b': 'developer',
        r'\b[dD][eE][vV][lL][oO][pP][eE][rR]\b': 'developer',
        r'\b[dD][eE][vV][eE][lL][oO][eE][pP][rR]\b': 'developer',
        r'\b[dD][eE][vV][eE][lL][pP][oO][rR]\b': 'developer',
        r'\b[eE][nN][gG][eE][nN][eE][eE][rR]\b': 'engineer',
        r'\b[eE][nN][gG][iI][nN][eE][aA][rR]\b': 'engineer',
        r'\b[eE][nN][gG][iI][nN][eE][rR]\b': 'engineer',
        r'\b[pP][rR][oO][gG][rR][aA][mM][eE][rR]\b': 'programmer',
        r'\b[pP][rR][oO][gG][rR][aA][mM][rR]\b': 'programmer',
        r'\b[dD][eE][sS][iI][nN][eE][rR]\b': 'designer',
        r'\b[dD][eE][sS][iI][nN][rR]\b': 'designer',
        
        # Common word misspellings
        r'\b[eE][xX][pP][eE][rR][iI][aA][nN][cC][eE]\b': 'experience',
        r'\b[eE][xX][pP][eE][rR][eE][nN][cC][eE]\b': 'experience',
        r'\b[mM][aA][nN][aA][gG][mM][eE][nN][tT]\b': 'management',
        r'\b[aA][rR][cC][hH][iI][tT][eE][cC][hH][tT][uU][rR][eE]\b': 'architecture',
        r'\b[cC][oO][mM][uU][nN][iI][cC][aA][tT][iI][oO][nN]\b': 'communication',
        r'\b[iI][nN][dD][eE][pP][eE][nN][dD][aA][nN][tT][lL][yY]\b': 'independently',
        r'\b[cC][aA][nN][dD][iI][tT][aA][tT][eE]\b': 'candidate',
        r'\b[rR][eE][sS][pP][oO][nN][sS][iI][bB][iI][lL][tT][yY]\b': 'responsibility',
        r'\b[mM][iI][cC][rR][oO][sS][eE][rR][vV][cC][eE][sS]\b': 'microservices',
    }
    
    result = text
    for pattern, replacement in corrections.items():
        result = re.sub(pattern, replacement, result)
    
    return result

def correct_grammar_t5(text: str) -> str:
    """Grammar correction using T5"""
    if not models['grammar_corrector']:
        return text
    
    try:
        inputs = models['grammar_tokenizer'].encode(
            f"grammar: {text}",
            return_tensors='pt',
            max_length=512,
            truncation=True
        ).to(models['device'])
        
        with torch.no_grad():
            outputs = models['grammar_corrector'].generate(
                inputs,
                max_length=512,
                num_beams=4,
                early_stopping=True
            )
        
        return models['grammar_tokenizer'].decode(outputs[0], skip_special_tokens=True)
    except:
        return text

def rephrase_full(text: str) -> Dict:
    """Full rephrasing pipeline - fixes + formalizes"""
    
    changes = []
    processed = text
    
    # Step 1: Tech terms FIRST (before any AI)
    tech_fixed = fix_tech_terms(processed)
    if tech_fixed != processed:
        changes.append("Tech terms corrected")
        processed = tech_fixed
    
    # Step 2: Grammar (T5) - Skip TextBlob to avoid "jhava" → "Cava"
    grammar_corrected = correct_grammar_t5(processed)
    if grammar_corrected and grammar_corrected != processed:
        changes.append("Grammar corrected (T5)")
        processed = grammar_corrected
    
    # Step 3: Tech terms AGAIN (in case T5 changed them)
    tech_fixed_again = fix_tech_terms(processed)
    if tech_fixed_again != processed:
        changes.append("Tech terms re-verified")
        processed = tech_fixed_again
    
    # Step 4: Remove contractions (formalize)
    contractions = {
        r"\bcan't\b": "cannot",
        r"\bdon't\b": "do not",
        r"\bwon't\b": "will not",
        r"\bisn't\b": "is not",
        r"\bare't\b": "are not",
        r"\bwe're\b": "we are",
        r"\byou'll\b": "you will",
        r"\bthey're\b": "they are",
        r"\bit's\b": "it is",
        r"\bwe'll\b": "we will",
        r"\bI'll\b": "I will",
        r"\bwouldn't\b": "would not",
        r"\bshouldn't\b": "should not",
        r"\bcouldn't\b": "could not",
        r"\bhasn't\b": "has not",
        r"\bhaven't\b": "have not",
        r"\bdidn't\b": "did not",
    }
    original_for_contractions = processed
    for pattern, replacement in contractions.items():
        processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
    if processed != original_for_contractions:
        changes.append("Contractions expanded")
    
    # Step 5: Informal to formal phrases
    informal_map = {
        r'\b[aA][sS][aA][pP]\b': 'as soon as possible',
        r'\brockstar\b': 'exceptional professional',
        r'\bninja\b': 'expert',
        r'\bguru\b': 'specialist',
        r'\bcool\b': 'excellent',
        r'\bawesome\b': 'outstanding',
        r'\bsuper\b': 'highly',
        r'\bkiller\b': 'exceptional',
    }
    original_for_informal = processed
    for pattern, replacement in informal_map.items():
        processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
    if processed != original_for_informal:
        changes.append("Informal language formalized")
    
    # Step 6: Cleanup
    processed = re.sub(r'\s{2,}', ' ', processed).strip()
    
    # Step 7: Capitalize first letter if needed
    if processed and processed[0].islower():
        processed = processed[0].upper() + processed[1:]
    
    return {
        "original": text,
        "rephrased": processed,
        "changes": changes,
        "confidence": 0.95 if processed != text else 1.0,
        "model_used": "ML"
    }

def spell_correct_only(text: str) -> Dict:
    """
    Spell + grammar correction ONLY.
    Does NOT change tone or rephrase sentences.
    Only fixes: typos, tech terms, grammar mistakes.
    """
    changes = []
    processed = text

    # Step 1: Fix tech terms (jhava→Java, developr→developer, etc.)
    tech_fixed = fix_tech_terms(processed)
    if tech_fixed != processed:
        changes.append("Tech terms corrected")
        processed = tech_fixed

    # Step 2: T5 grammar correction (no paraphrasing / formalization)
    grammar_corrected = correct_grammar_t5(processed)
    if grammar_corrected and grammar_corrected.strip() and grammar_corrected != processed:
        changes.append("Grammar corrected (T5)")
        processed = grammar_corrected

    # Step 3: Re-apply tech terms (protect from T5 changes)
    tech_final = fix_tech_terms(processed)
    if tech_final != processed:
        changes.append("Tech terms re-applied after grammar check")
        processed = tech_final

    # Step 4: Cleanup spaces only
    processed = re.sub(r'\s{2,}', ' ', processed).strip()

    return {
        "original": text,
        "corrected": processed,
        "changes": changes if changes else ["No changes needed"],
        "model_used": "ML" if models['grammar_corrector'] else "rules"
    }

# ==================== API ENDPOINTS ====================

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "ok",
        "models_loaded": models['loaded'],
        "device": models['device']
    })

@app.route('/rephrase', methods=['POST'])
def rephrase():
    """
    Full rephrase: fixes spelling + grammar + formalizes tone.
    Use when you want the text completely rewritten professionally.
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "Text required"}), 400
        
        result = rephrase_full(text)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/spell-correct', methods=['POST'])
def spell_correct():
    """
    Spell + grammar correction ONLY.
    Fixes typos, tech terms, grammar — does NOT rephrase or change tone.
    Use when you only want errors fixed, keeping original wording.
    """
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({"error": "Text required"}), 400

        result = spell_correct_only(text)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/suggest', methods=['POST'])
def suggest():
    """Quick suggestions for real-time detection"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        suggestions = []
        
        # Quick check: do tech terms need fixing?
        spell_fixed = fix_tech_terms(text)
        if spell_fixed != text:
            suggestions.append({
                "type": "spelling",
                "severity": "high",
                "message": "Spelling errors detected"
            })
        
        return jsonify({
            "success": True,
            "suggestions": suggestions,
            "hasIssues": len(suggestions) > 0,
            "issueCount": len(suggestions)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting ML Server...")
    
    # Load models on startup
    load_models()
    
    # Start server
    print("🌐 Server starting on http://localhost:5001")
    print("📡 Ready to receive requests!")
    print("   - POST /rephrase       → Full rephrase (spelling + grammar + formal)")
    print("   - POST /spell-correct  → Spell & grammar fix only (no tone change)")
    print("   - POST /suggest        → Real-time issue detection")
    print("   - GET  /health         → Server status")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
        threaded=True
    )