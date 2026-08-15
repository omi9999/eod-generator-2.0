import os
import json
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "Groq (Fastest)")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "llama-3.1-8b-instant")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")

    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "")
        if not raw or raw.strip() == "":
            return ["*"]
        if raw.strip() == "*":
            return ["*"]
        # Try parsing as JSON array
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
        except:
            pass
        # Fallback: split by comma
        parts = [x.strip() for x in raw.split(',') if x.strip()]
        return parts if parts else ["*"]

settings = Settings()