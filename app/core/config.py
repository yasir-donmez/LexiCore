from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LexiCore"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str
    FIRESTORE_PROJECT_ID: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    USE_MOCK_DB: bool = False
    FIREBASE_AUTH_REQUIRED: bool = True
    ENV: str = "development"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
