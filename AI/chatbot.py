import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3"

SYSTEM_PROMPT = """
You are KGamify AI Assistant.

ONLY answer questions related to:
- Jobs and career guidance
- Resume / CV building
- Interview preparation
- Skill roadmaps
- KGamify platform features

If the question is unrelated, politely refuse.
Be concise, professional, and helpful.
"""

def chat_with_ollama(user_message: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "prompt": f"{SYSTEM_PROMPT}\n\nUser: {user_message}\nAssistant:",
        "stream": False
    }

    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=120)
        res.raise_for_status()
        return res.json().get("response", "").strip()
    except Exception as e:
        print("Ollama error:", e)
        return "⚠️ AI service is temporarily unavailable. Please try again."