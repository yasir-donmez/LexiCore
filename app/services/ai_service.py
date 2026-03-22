import google.generativeai as genai
import asyncio
import os
from typing import List, Dict, Optional
from pydantic import BaseModel

class FlashcardData(BaseModel):
    word_en: str
    word_tr: str
    context_sentence: str
    pronunciation: str
    synonyms: List[str] = []
    antonyms: List[str] = []
    alternatives_tr: List[str] = []
    clue: Optional[str] = None

class AIService:
    def __init__(self, api_key: Optional[str] = None):
        if not api_key:
            api_key = os.getenv("GEMINI_API_KEY")
        print(f"DEBUG: Configuring Gemini AI with key starting with: {api_key[:8]}...", flush=True)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        print(f"DEBUG: Gemini AI model 'gemini-2.5-flash' initialized.", flush=True)

    async def get_flashcard_data(self, word: str, level: str = "B1") -> FlashcardData:
        """
        Calls Gemini API to get translation, context sentence, and pronunciation.
        Correctly handles both English and Turkish source words and respects user's level.
        """
        prompt = f"""
        Identify the language of the word: "{word}".
        - If it is English, find its Turkish equivalent.
        - If it is Turkish, find its most common English equivalent.
        
        Important: The user is a Turkish speaker learning English at "{level}" level. 
        Please provide:
        1. word_en: The English version/translation.
        2. word_tr: The Turkish version/translation.
        3. context_sentence: A simple, educational Example Sentence in ENGLISH (matches {level} level).
        4. synonyms: 2-3 English synonyms.
        5. antonyms: 1-2 English antonyms.
        6. clue: A very simple hint in English (NOT the word itself).
        7. pronunciation: A Turkish-friendly phonetic "sounds-like" guide (e.g., for 'technologies' return 'tek-no-lo-jiz'). Use Turkish characters to represent the English sound.
        8. alternatives_tr: 3-4 Alternative Turkish meanings, synonyms, or common grammatical conjugations (e.g., if word_tr is "anlamak", alternatives_tr could be ["kavramak", "anladım", "fark etmek", "anlaşılmak"]). This helps evaluate user's semantic understanding.

        Return in THIS JSON format:
        {{
            "word_en": "...",
            "word_tr": "...",
            "context_sentence": "...",
            "pronunciation": "...",
            "synonyms": [...],
            "antonyms": [...],
            "alternatives_tr": [...],
            "clue": "..."
        }}
        """
        
        # Note: In a real async environment, we'd use an async client for Gemini
        # but the current SDK is blocking for generate_content. 
        # We can wrap it in a thread for true async if needed, 
        # or use the async methods if available in newer SDK versions.
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, self.model.generate_content, prompt)
        
        # Simple JSON parsing (expecting Gemini to follow the prompt)
        import json
        import re
        
        try:
            # Extract JSON from response text
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                # Log success for debug
                with open("ai_debug.log", "a", encoding="utf-8") as f:
                    f.write(f"SUCCESS [{word}]: {json_str[:100]}...\n")
                return FlashcardData(**data)
            else:
                with open("ai_debug.log", "a", encoding="utf-8") as f:
                    f.write(f"FAILURE [{word}]: No JSON found in response. Text: {response.text[:200]}\n")
                raise ValueError("Could not parse JSON from Gemini response")
        except Exception as e:
            # Log error
            with open("ai_debug.log", "a", encoding="utf-8") as f:
                f.write(f"ERROR [{word}]: {str(e)}\n")
            # Fallback or error handling
            return FlashcardData(
                word_en=word,
                word_tr="Error",
                context_sentence=f"Error generating context for {word}",
                pronunciation="N/A"
            )

    async def generate_flashcards_parallel(self, words: List[str], level: str = "B1") -> List[FlashcardData]:
        """
        Generates flashcards for a list of words in parallel with concurrency limit.
        """
        # Limit to 5 concurrent requests to avoid rate limits
        semaphore = asyncio.Semaphore(5)
        
        async def sem_task(word):
            async with semaphore:
                return await self.get_flashcard_data(word, level=level)

        print(f"DEBUG: Starting parallel generation for {len(words)} words...", flush=True)
        tasks = [sem_task(word) for word in words]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_results = []
        for i, res in enumerate(results):
            if isinstance(res, Exception):
                print(f"DEBUG ERROR: Failed to generate for '{words[i]}': {str(res)}", flush=True)
                # Fallback to simple card if it failed completely
                valid_results.append(FlashcardData(
                    word_en=words[i], 
                    word_tr="Error", 
                    context_sentence=f"Could not generate context for {words[i]}",
                    pronunciation="N/A"
                ))
            else:
                valid_results.append(res)
                
        print(f"DEBUG: Parallel generation complete. Success: {len(valid_results)}/{len(words)}", flush=True)
        return valid_results
