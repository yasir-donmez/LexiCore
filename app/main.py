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

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton DB instance for mock persistence
_db_instance = DBService(project_id=settings.FIRESTORE_PROJECT_ID, use_mock=True)

_nlp_instance = NLPService()
_ai_instance = AIService(api_key=settings.GEMINI_API_KEY)

def get_db_service():
    return _db_instance

def get_nlp_service():
    return _nlp_instance

def get_ai_service():
    return _ai_instance

async def process_pdf_background_task(
    deck_id: str, 
    pdf_content: bytes, 
    db: DBService, 
    nlp: NLPService, 
    ai: AIService,
    level: str = "B1"
):
    """
    Processes PDF in chunks as a background task.
    """
    try:
        print(f"DEBUG: Background task started for deck {deck_id}", flush=True)
        # 1. Extract text in chunks (e.g., 3 pages at a time)
        for chunk_idx, chunk_text in enumerate(PDFService.extract_text_chunks_from_pdf(pdf_content, chunk_size=3)):
            print(f"DEBUG: Processing chunk {chunk_idx + 1}...", flush=True)
            # 2. NLP Processing for current chunk
            processed_words = nlp.process_text(chunk_text)
            top_words = nlp.filter_top_words(processed_words, limit=5) # Fewer words per chunk to avoid AI overload

            if not top_words:
                print(f"DEBUG: No top words found in chunk {chunk_idx + 1}", flush=True)
                continue

            # 3. Generate Flashcard Data via AI
            lemmas = [w["lemma"] for w in top_words]
            print(f"DEBUG: Generating flashcards for lemmas: {lemmas}", flush=True)
            ai_data_list = await ai.generate_flashcards_parallel(lemmas, level=level)
            print(f"DEBUG: AI generation complete for chunk {chunk_idx + 1}", flush=True)

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
            print(f"DEBUG: Flashcards created in DB for chunk {chunk_idx + 1}", flush=True)
        
        print(f"DEBUG: Background task completed successfully for deck {deck_id}", flush=True)
            
    except Exception as e:
        print(f"DEBUG ERROR: Error in background task for deck {deck_id}: {str(e)}", flush=True)

@app.post("/upload")
async def upload_pdf(
    user_id: str,
    level: str = "B1",
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: DBService = Depends(get_db_service),
    nlp: NLPService = Depends(get_nlp_service),
    ai: AIService = Depends(get_ai_service)
):
    """
    Uploads PDF, creates Deck immediately, and starts background text extraction and AI generation.
    Returns status: processing instantly to prevent timeouts.
    """
    deck_id = str(uuid.uuid4())
    print(f"DEBUG: Processing upload for user {user_id}, Deck: {deck_id}", flush=True)
    
    # 1. Create Deck logically mapped to user immediately
    deck = Deck(
        deck_id=deck_id,
        user_id=user_id,
        source_pdf_name=file.filename,
        created_at=datetime.utcnow()
    )
    db.create_deck(deck)
    
    # 2. Extract content securely within request context
    content = await file.read()
    
    # 3. Add chunking and LLM processing to background tasks
    if background_tasks:
        background_tasks.add_task(
            process_pdf_background_task,
            deck_id,
            content,
            db,
            nlp,
            ai,
            level
        )
        
    return {
        "status": "processing",
        "deck_id": deck_id,
        "message": "PDF arka planda inceleniyor ve flashcard'lar oluşturuluyor."
    }
@app.post("/analyze")
async def analyze_pdf(
    file: UploadFile = File(...),
    nlp: NLPService = Depends(get_nlp_service)
):
    """
    Analyzes PDF and returns top extracted words for user selection.
    """
    content = await file.read()
    print(f"DEBUG: Analyzing PDF: {file.filename}", flush=True)
    
    # Extract text and get words
    all_words = []
    for chunk_text in PDFService.extract_text_chunks_from_pdf(content):
        all_words.extend(nlp.process_text(chunk_text))
    
    # Filter top words (e.g., top 40 for selection)
    top_words = nlp.filter_top_words(all_words, limit=40)
    
    return {
        "filename": file.filename,
        "words": top_words
    }

@app.post("/generate")
async def generate_cards(
    user_id: str,
    selected_words: List[str],
    level: str = "B1",
    db: DBService = Depends(get_db_service),
    ai: AIService = Depends(get_ai_service)
):
    """
    Generates enriched flashcards for the selected words.
    """
    deck_id = str(uuid.uuid4())
    print(f"DEBUG: Generating cards for deck {deck_id}, Level: {level}", flush=True)
    with open("api_debug.log", "a", encoding="utf-8") as f:
        f.write(f"GENERATE REQUEST: deck_id={deck_id}, level={level}, words={selected_words}\n")
    
    deck = Deck(
        deck_id=deck_id,
        user_id=user_id,
        source_pdf_name="Seçilmiş Kelimeler Listesi",
        created_at=datetime.utcnow()
    )
    db.create_deck(deck)
    
    # Generate in parallel
    ai_data_list = await ai.generate_flashcards_parallel(selected_words, level=level)
    
    with open("api_debug.log", "a", encoding="utf-8") as f:
        f.write(f"AI RESPONSE: received {len(ai_data_list)} responses\n")
    
    flashcards = []
    for data in ai_data_list:
        # Skip failed generations
        if data.word_tr == "Error" or data.word_en == "Error":
            print(f"DEBUG: Skipping failed generation for {data.word_en}", flush=True)
            continue
            
        card_id = str(uuid.uuid4())
        flashcard = Flashcard(
            card_id=card_id,
            deck_id=deck_id,
            word_en=data.word_en,
            word_tr=data.word_tr,
            context_sentence=data.context_sentence,
            pronunciation=data.pronunciation,
            synonyms=data.synonyms,
            antonyms=data.antonyms,
            alternatives_tr=data.alternatives_tr,
            clue=data.clue,
            ease_factor=2.5,
            interval=0,
            next_review=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        flashcards.append(flashcard)
    
    if flashcards:
        db.create_flashcards(flashcards)
    else:
        print("DEBUG: No valid flashcards were generated.", flush=True)
        with open("api_debug.log", "a", encoding="utf-8") as f:
            f.write(f"FILTER RESULT: 0 VALID CARDS (all filtered as Error)\n")
    
    return {
        "status": "success",
        "deck_id": deck_id,
        "card_count": len(flashcards),
        "message": f"{len(flashcards)} adet zenginleştirilmiş kart başarıyla oluşturuldu."
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
        card.word_tr, 
        card.alternatives_tr,
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

@app.get("/users/{user_id}/decks", response_model=List[Deck])
async def get_user_decks(user_id: str, db: DBService = Depends(get_db_service)):
    return db.get_user_decks(user_id)

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
            "average_ease_factor": 0,
            "perfect_cards": 0,
            "good_cards": 0,
            "struggling_cards": 0
        }
        
    due_cards = len([c for c in all_flashcards if c.next_review <= datetime.utcnow()])
    avg_ease = sum([c.ease_factor for c in all_flashcards]) / total_cards
    
    perfect_cards = len([c for c in all_flashcards if c.ease_factor >= 2.6])
    good_cards = len([c for c in all_flashcards if 2.4 <= c.ease_factor < 2.6])
    struggling_cards = len([c for c in all_flashcards if c.ease_factor < 2.4])
    
    return {
        "total_decks": len(decks),
        "total_flashcards": total_cards,
        "due_for_review": due_cards,
        "average_ease_factor": float(f"{avg_ease:.2f}"),
        "perfect_cards": perfect_cards,
        "good_cards": good_cards,
        "struggling_cards": struggling_cards
    }
