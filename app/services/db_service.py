import os
from google.cloud import firestore
from typing import List, Optional, Dict, Any
from ..models.schemas import User, Deck, Flashcard, FlashcardUpdate
from datetime import datetime

class DBService:
    def __init__(self, project_id: Optional[str] = None, use_mock: bool = True):
        self.use_mock = use_mock
        self.mock_db = {
            "users": {},
            "decks": {},
            "flashcards": {}
        }
        
        if not self.use_mock:
            try:
                self.db = firestore.Client(project=project_id)
            except Exception as e:
                print(f"Firestore initialization failed: {e}. Falling back to mock DB.")
                self.use_mock = True

    def create_user(self, user: User) -> bool:
        if self.use_mock:
            self.mock_db["users"][user.user_id] = user.dict()
            return True
        doc_ref = self.db.collection("users").document(user.user_id)
        doc_ref.set(user.dict())
        return True

    def create_deck(self, deck: Deck) -> bool:
        if self.use_mock:
            self.mock_db["decks"][deck.deck_id] = deck.dict()
            return True
        doc_ref = self.db.collection("decks").document(deck.deck_id)
        doc_ref.set(deck.dict())
        return True

    def create_flashcards(self, flashcards: List[Flashcard]) -> bool:
        if self.use_mock:
            for fc in flashcards:
                self.mock_db["flashcards"][fc.card_id] = fc.dict()
            return True
        batch = self.db.batch()
        for fc in flashcards:
            doc_ref = self.db.collection("flashcards").document(fc.card_id)
            batch.set(doc_ref, fc.dict())
        batch.commit()
        return True

    def get_deck_flashcards(self, deck_id: str) -> List[Flashcard]:
        if self.use_mock:
            return [Flashcard(**fc) for fc in self.mock_db["flashcards"].values() if fc["deck_id"] == deck_id]
        docs = self.db.collection("flashcards").where("deck_id", "==", deck_id).stream()
        return [Flashcard(**doc.to_dict()) for doc in docs]

    def update_flashcard(self, card_id: str, update: FlashcardUpdate) -> bool:
        if self.use_mock:
            if card_id in self.mock_db["flashcards"]:
                card = self.mock_db["flashcards"][card_id]
                card.update(update.dict())
                return True
            return False
        doc_ref = self.db.collection("flashcards").document(card_id)
        doc_ref.update(update.dict())
        return True

    def get_flashcard(self, card_id: str) -> Optional[Flashcard]:
        if self.use_mock:
            fc = self.mock_db["flashcards"].get(card_id)
            return Flashcard(**fc) if fc else None
        doc = self.db.collection("flashcards").document(card_id).get()
        if doc.exists:
            return Flashcard(**doc.to_dict())
        return None

    def get_user_decks(self, user_id: str) -> List[Deck]:
        if self.use_mock:
            return [Deck(**d) for d in self.mock_db["decks"].values() if d["user_id"] == user_id]
        docs = self.db.collection("decks").where("user_id", "==", user_id).stream()
        return [Deck(**doc.to_dict()) for doc in docs]
