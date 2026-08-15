import json
import os
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
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == "CORS_ORIGINS":
                if not raw_val:
                    return ["*"]
                # If raw_val is a single string like "*", return ["*"]
                if raw_val.strip() == "*":
                    return ["*"]
                # Try to parse as JSON array
                try:
                    parsed = json.loads(raw_val)
                    if isinstance(parsed, list):
                        return parsed
                except json.JSONDecodeError:
                    pass
                # Fallback: split by comma
                parts = [x.strip() for x in raw_val.split(',') if x.strip()]
                return parts if parts else ["*"]
            return raw_val

settings = Settings()