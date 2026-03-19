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

class AIService:
    def __init__(self, api_key: Optional[str] = None):
        if not api_key:
            api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def get_flashcard_data(self, word: str) -> FlashcardData:
        """
        Calls Gemini API to get translation, context sentence, and pronunciation.
        """
        prompt = f"""
        Provide information for the English word: "{word}".
        Return the result in the following JSON format ONLY:
        {{
            "word_en": "{word}",
            "word_tr": "Turkish translation",
            "context_sentence": "A B2/C1 level English sentence using the word",
            "pronunciation": "Phonetic pronunciation (e.g., IPA)"
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
                data = json.loads(json_match.group())
                return FlashcardData(**data)
            else:
                raise ValueError("Could not parse JSON from Gemini response")
        except Exception as e:
            # Fallback or error handling
            return FlashcardData(
                word_en=word,
                word_tr="Error",
                context_sentence=f"Error generating context for {word}",
                pronunciation="N/A"
            )

    async def generate_flashcards_parallel(self, words: List[str]) -> List[FlashcardData]:
        """
        Generates flashcards for a list of words in parallel.
        """
        tasks = [self.get_flashcard_data(word) for word in words]
        return await asyncio.gather(*tasks)
