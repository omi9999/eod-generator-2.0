import json
from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    ENCRYPTION_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEFAULT_PROVIDER: str = "Groq (Fastest)"
    DEFAULT_MODEL: str = "llama-3.1-8b-instant"
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    CORS_ORIGINS: List[str] = ["*"]  # default fallback

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == "CORS_ORIGINS":
                if not raw_val:
                    return ["*"]
                # Try to parse as JSON array
                try:
                    return json.loads(raw_val)
                except json.JSONDecodeError:
                    # Fallback: split by comma
                    return [x.strip() for x in raw_val.split(',') if x.strip()]
            return raw_val

settings = Settings()