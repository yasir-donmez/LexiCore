import spacy
from typing import List, Dict, Counter

class NLPService:
    def __init__(self, model_name: str = "en_core_web_sm"):
        try:
            self.nlp = spacy.load(model_name)
        except OSError:
            # If model is not found, we might need to download it
            # This is a bit tricky in a serverless environment, but 
            # for local development we can trigger a download.
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", model_name])
            self.nlp = spacy.load(model_name)

    def process_text(self, text: str) -> List[Dict]:
        """
        Processes text and extracts target words (Nouns, Verbs, Adjectives).
        Returns a list of dictionaries with word, lemma, and POS tag.
        """
        doc = self.nlp(text)
        words = []
        target_pos = {"NOUN", "VERB", "ADJ"}

        for token in doc:
            # Filter: not a stop word, is alpha, and is one of target POS tags
            if not token.is_stop and token.is_alpha and token.pos_ in target_pos:
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
