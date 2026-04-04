import spacy
from typing import List, Dict, Counter

class NLPService:
    def __init__(self, model_name: str = "en_core_web_sm"):
        try:
            print(f"DEBUG: Loading spacy model '{model_name}'...")
            self.nlp = spacy.load(model_name)
            print(f"DEBUG: Spacy model '{model_name}' loaded successfully.")
        except OSError:
            print(f"DEBUG: Spacy model '{model_name}' not found. Downloading...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", model_name])
            print(f"DEBUG: Spacy model '{model_name}' downloaded. Loading again...")
            self.nlp = spacy.load(model_name)

    def process_text(self, text: str) -> List[Dict]:
        """
        Processes text and extracts target words (Nouns, Verbs, Adjectives).
        Returns a list of dictionaries with word, lemma, and POS tag.
        """
        doc = self.nlp(text)
        words = []
        target_pos = {"NOUN", "VERB", "ADJ"}
        
        # BASIC_WORDS: Filtering out extremely common words to improve quality
        basic_words = {"and", "the", "with", "have", "this", "that", "from", "when", "then", "into", "over", "under"}

        for token in doc:
            # Filter: not a stop word, is alpha, and is one of target POS tags
            # Also skip very short words (<= 3 chars) and basic common words
            if (not token.is_stop and 
                token.is_alpha and 
                token.pos_ in target_pos and 
                len(token.text) >= 3 and
                token.text.lower() not in basic_words):
                
                words.append({
                    "text": token.text.lower(),
                    "lemma": token.lemma_.lower(),
                    "pos": token.pos_
                })
        return words

    def get_word_frequencies(self, words: List[Dict]) -> Dict[str, int]:
        """
        Calculates word frequencies based on lemmas.
        """
        lemmas = [w["lemma"] for w in words]
        return dict(Counter(lemmas))

    def filter_top_words(self, words: List[Dict], limit: int = 20) -> List[Dict]:
        """
        Filters the most frequent words and returns their details.
        """
        frequencies = self.get_word_frequencies(words)
        # Sort by frequency descending
        sorted_lemmas = sorted(frequencies.items(), key=lambda x: x[1], reverse=True)[:limit]
        top_lemmas = {lemma for lemma, freq in sorted_lemmas}

        # Return details only for top lemmas, taking the first occurrence for each lemma
        seen_lemmas = set()
        top_words_details = []
        for w in words:
            if w["lemma"] in top_lemmas and w["lemma"] not in seen_lemmas:
                top_words_details.append(w)
                seen_lemmas.add(w["lemma"])
        
        return top_words_details
