import uuid
import asyncio
from datetime import datetime
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks

from .core.config import settings
from .services.pdf_service import PDFService
from .services.nlp_service import NLPService
from .services.ai_service import AIService
from .services.db_service import DBService
from .services.scoring_service import ScoringService
from .models.schemas import Flashcard, FlashcardCreate, FlashcardUpdate, Deck, DeckCreate, User

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# Dependency injection for services
def get_db_service():
    return DBService(project_id=settings.FIRESTORE_PROJECT_ID)

def get_nlp_service():
    return NLPService()

def get_ai_service():
    return AIService(api_key=settings.GEMINI_API_KEY)

async def process_pdf_background_task(
    deck_id: str, 
    pdf_content: bytes, 
    db: DBService, 
    nlp: NLPService, 
    ai: AIService
):
    """
    Processes PDF in chunks as a background task.
    """
    try:
        # 1. Extract text in chunks (e.g., 3 pages at a time)
        for chunk_text in PDFService.extract_text_chunks_from_pdf(pdf_content, chunk_size=3):
            # 2. NLP Processing for current chunk
            processed_words = nlp.process_text(chunk_text)
            top_words = nlp.filter_top_words(processed_words, limit=5) # Fewer words per chunk to avoid AI overload

            if not top_words:
                continue

            # 3. Generate Flashcard Data via AI
            lemmas = [w["lemma"] for w in top_words]
            ai_data_list = await ai.generate_flashcards_parallel(lemmas)

            # 4. Create Flashcards in DB incrementally
            flashcards = []
            for data in ai_data_list:
                card_id = str(uuid.uuid4())
                flashcard = Flashcard(
                    card_id=card_id,
                    deck_id=deck_id,
                    word_en=data.word_en,
                    word_tr=data.word_tr,
                    context_sentence=data.context_sentence,
                    pronunciation=data.pronunciation,
                    ease_factor=2.5,
                    interval=0,
                    next_review=datetime.utcnow(),
                    created_at=datetime.utcnow()
                )
                flashcards.append(flashcard)
            
            db.create_flashcards(flashcards)
            
    except Exception as e:
        print(f"Error in background task for deck {deck_id}: {str(e)}")
        # In a real app, we would update the deck status to 'error'

@app.post("/upload")
async def upload_pdf(
    user_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: DBService = Depends(get_db_service),
    nlp: NLPService = Depends(get_nlp_service),
    ai: AIService = Depends(get_ai_service)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    
    # 1. Create Deck immediately in Firestore
    deck_id = str(uuid.uuid4())
    deck = Deck(
        deck_id=deck_id,
        user_id=user_id,
        source_pdf_name=file.filename,
        created_at=datetime.utcnow()
    )
    db.create_deck(deck)

    # 2. Add background task to process the PDF
    background_tasks.add_task(
        process_pdf_background_task, 
        deck_id, 
        content, 
        db, 
        nlp, 
        ai
    )

    return {
        "status": "processing",
        "deck_id": deck_id,
        "message": "PDF arka planda işleniyor. Kartlar oluştukça destenize eklenecektir."
    }

@app.get("/decks/{deck_id}", response_model=List[Flashcard])
async def get_flashcards(deck_id: str, db: DBService = Depends(get_db_service)):
    return db.get_deck_flashcards(deck_id)

@app.post("/cards/{card_id}/answer")
async def answer_card(
    card_id: str,
    user_answer: str,
    db: DBService = Depends(get_db_service)
):
    # 1. Fetch card
    card = db.get_flashcard(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    # 2. Evaluate Answer
    evaluation = ScoringService.evaluate_answer(
        user_answer, 
        card.word_en, 
        card.ease_factor, 
        card.interval
    )
    
    # 3. Calculate next review date
    from datetime import timedelta
    next_review = datetime.utcnow() + timedelta(days=evaluation["new_interval"])

    # 4. Save updates to DB
    update = FlashcardUpdate(
        ease_factor=evaluation["new_ease_factor"],
        interval=evaluation["new_interval"],
        next_review=next_review
    )
    db.update_flashcard(card_id, update)
    
    return {
        "similarity": evaluation["similarity_ratio"],
        "is_correct": evaluation["is_correct"],
        "new_ease_factor": evaluation["new_ease_factor"],
        "new_interval": evaluation["new_interval"],
        "next_review": next_review
    }

@app.get("/stats/{user_id}")
async def get_user_stats(user_id: str, db: DBService = Depends(get_db_service)):
    decks = db.get_user_decks(user_id)
    all_flashcards = []
    for deck in decks:
        all_flashcards.extend(db.get_deck_flashcards(deck.deck_id))
    
    total_cards = len(all_flashcards)
    if total_cards == 0:
        return {
            "total_decks": len(decks),
            "total_flashcards": 0,
            "due_for_review": 0,
            "average_ease_factor": 0
        }
        
    due_cards = len([c for c in all_flashcards if c.next_review <= datetime.utcnow()])
    avg_ease = sum([c.ease_factor for c in all_flashcards]) / total_cards
    
    return {
        "total_decks": len(decks),
        "total_flashcards": total_cards,
        "due_for_review": due_cards,
        "average_ease_factor": float(f"{avg_ease:.2f}")
    }
