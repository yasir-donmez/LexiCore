from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    user_id: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DeckBase(BaseModel):
    user_id: str
    source_pdf_name: str

class DeckCreate(DeckBase):
    pass

class Deck(DeckBase):
    deck_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FlashcardBase(BaseModel):
    word_en: str
    word_tr: str
    context_sentence: str
    pronunciation: Optional[str] = None
    synonyms: Optional[List[str]] = Field(default_factory=list)
    antonyms: Optional[List[str]] = Field(default_factory=list)
    alternatives_tr: Optional[List[str]] = Field(default_factory=list)
    clue: Optional[str] = None
    ease_factor: float = 2.5
    interval: int = 0

class FlashcardCreate(FlashcardBase):
    deck_id: str

class Flashcard(FlashcardBase):
    card_id: str
    deck_id: str
    next_review: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Frozen models for Immutability (as requested in FP part of documentation)
class FlashcardUpdate(BaseModel):
    ease_factor: float
    interval: int
    next_review: datetime

    class Config:
        frozen = True
