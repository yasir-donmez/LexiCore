import os
from google.cloud import firestore
from typing import List, Optional, Dict, Any
from ..models.schemas import User, Deck, Flashcard, FlashcardUpdate
from datetime import datetime

class DBService:
    def __init__(self, project_id: Optional[str] = None):
        # In a real environment, project_id would be set or credentials loaded from .env
        self.db = firestore.Client(project=project_id)

    def create_user(self, user: User) -> bool:
        doc_ref = self.db.collection("users").document(user.user_id)
        doc_ref.set(user.dict())
        return True

    def create_deck(self, deck: Deck) -> bool:
        doc_ref = self.db.collection("decks").document(deck.deck_id)
        doc_ref.set(deck.dict())
        return True

    def create_flashcards(self, flashcards: List[Flashcard]) -> bool:
        batch = self.db.batch()
        for fc in flashcards:
            doc_ref = self.db.collection("flashcards").document(fc.card_id)
            batch.set(doc_ref, fc.dict())
        batch.commit()
        return True

    def get_deck_flashcards(self, deck_id: str) -> List[Flashcard]:
        docs = self.db.collection("flashcards").where("deck_id", "==", deck_id).stream()
        return [Flashcard(**doc.to_dict()) for doc in docs]

    def update_flashcard(self, card_id: str, update: FlashcardUpdate) -> bool:
        doc_ref = self.db.collection("flashcards").document(card_id)
        doc_ref.update(update.dict())
        return True

    def get_flashcard(self, card_id: str) -> Optional[Flashcard]:
        doc = self.db.collection("flashcards").document(card_id).get()
        if doc.exists:
            return Flashcard(**doc.to_dict())
        return None

    def get_user_decks(self, user_id: str) -> List[Deck]:
        docs = self.db.collection("decks").where("user_id", "==", user_id).stream()
        return [Deck(**doc.to_dict()) for doc in docs]
