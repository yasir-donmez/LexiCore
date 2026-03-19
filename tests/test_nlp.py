import pytest
from app.services.nlp_service import NLPService

@pytest.fixture
def nlp_service():
    return NLPService()

def test_process_text(nlp_service):
    text = "The quick brown fox jumps over the lazy dog. Running is a good exercise."
    # We expect nouns, verbs, adjectives
    # fox (NOUN), jumps (VERB), lazy (ADJ), dog (NOUN), Running (VERB/NOUN), good (ADJ), exercise (NOUN)
    words = nlp_service.process_text(text)
    
    lemmas = [w["lemma"] for w in words]
    assert "fox" in lemmas
    assert "jump" in lemmas
    assert "lazy" in lemmas
    assert "dog" in lemmas
    assert "good" in lemmas

def test_get_word_frequencies(nlp_service):
    words = [
        {"lemma": "apple", "pos": "NOUN"},
        {"lemma": "apple", "pos": "NOUN"},
        {"lemma": "banana", "pos": "NOUN"}
    ]
    freqs = nlp_service.get_word_frequencies(words)
    assert freqs["apple"] == 2
    assert freqs["banana"] == 1
