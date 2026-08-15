from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

load_dotenv()  # explicitly load .env

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Encryption
    ENCRYPTION_KEY: str = "yzPlheec-Q6ikq8DKWJMaBVCcpZVaQcHDC8bLHsdAyAY="

    # AI Provider keys (optional – they can also be stored in Supabase)
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Defaults
    DEFAULT_PROVIDER: str = "Groq (Fastest)"
    DEFAULT_MODEL: str = "llama-3.1-8b-instant"

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://*.vercel.app"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()