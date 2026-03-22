from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LexiCore"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str
    FIRESTORE_PROJECT_ID: Optional[str] = None
    ENV: str = "development"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
