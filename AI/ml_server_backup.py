"""
ML Server - Keeps models loaded in memory
Run once, serve multiple requests without reloading models

Usage:
    python ml_server.py  # Starts server on port 5001
    
    Then call from Node.js:
    curl -X POST http://localhost:5001/rephrase -d '{"text":"jhava developr"}'
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
    """Fix tech typos"""
    corrections = {
        r'\bjhava\b': 'Java', r'\bjaba\b': 'Java',
        r'\bpythn\b': 'Python', r'\bpyton\b': 'Python',
        r'\breactt\b': 'React', r'\braect\b': 'React',
        r'\bjavascript\b': 'JavaScript', r'\btypescipt\b': 'TypeScript',
        r'\bnodejs\b': 'Node.js', r'\bmongodb\b': 'MongoDB',
        r'\bdevlopr\b': 'developer', r'\bdevelopr\b': 'developer',
        r'\bdevloper\b': 'developer', r'\bengeneer\b': 'engineer',
        r'\bprogramer\b': 'programmer', r'\bdesiner\b': 'designer',
    }
    
    result = text
    for pattern, replacement in corrections.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
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
    """Full rephrasing pipeline"""
    
    changes = []
    processed = text
    
    # 1. Tech terms first
    processed = fix_tech_terms(processed)
    if processed != text:
        changes.append("Tech terms corrected")
    
    # 2. Spelling (TextBlob)
    try:
        spell_corrected = str(TextBlob(processed).correct())
        if spell_corrected != processed:
            changes.append("Spelling corrected")
            processed = spell_corrected
    except:
        pass
    
    # 3. Grammar (T5)
    grammar_corrected = correct_grammar_t5(processed)
    if grammar_corrected and grammar_corrected != processed:
        changes.append("Grammar corrected (T5)")
        processed = grammar_corrected
    
    # 4. Tech terms again (ensure they stick)
    processed = fix_tech_terms(processed)
    
    # 5. Cleanup
    processed = re.sub(r'\s{2,}', ' ', processed).strip()
    
    return {
        "original": text,
        "rephrased": processed,
        "changes": changes,
        "confidence": 0.95 if processed != text else 1.0,
        "model_used": "ML"
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
    """Rephrase endpoint"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "Text required"}), 400
        
        result = rephrase_full(text)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/suggest', methods=['POST'])
def suggest():
    """Quick suggestions"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        suggestions = []
        
        # Quick checks
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
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
        threaded=True
    )
