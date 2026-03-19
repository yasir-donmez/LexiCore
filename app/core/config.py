from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LexiCore"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str
    FIRESTORE_PROJECT_ID: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
