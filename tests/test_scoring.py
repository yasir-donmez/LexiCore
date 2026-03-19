import pytest
from app.services.scoring_service import ScoringService

def test_calculate_similarity():
    # Exact match
    assert ScoringService.calculate_similarity("apple", "apple") == 1.0
    # Case insensitive
    assert ScoringService.calculate_similarity("Apple", "apple") == 1.0
    # Minor error (should be > 0.85)
    assert ScoringService.calculate_similarity("aple", "apple") > 0.85
    # completely different
    assert ScoringService.calculate_similarity("banana", "apple") < 0.2

def test_update_flashcard_metrics_correct():
    # Correct answer: interval should grow
    new_ease, new_interval = ScoringService.update_flashcard_metrics(0.9, 2.5, 1)
    assert new_interval == 3
    assert new_ease == 2.6

    new_ease2, new_interval2 = ScoringService.update_flashcard_metrics(0.9, 2.6, 3)
    assert new_interval2 == 8 # 3 * 2.6 = 7.8 -> 8
    assert new_ease2 == 2.7

def test_update_flashcard_metrics_incorrect():
    # Incorrect answer: ease should drop and interval reset
    new_ease, new_interval = ScoringService.update_flashcard_metrics(0.5, 2.5, 10)
    assert new_interval == 0
    assert new_ease == 2.3

def test_evaluate_answer():
    result = ScoringService.evaluate_answer("aple", "apple", 2.5, 1)
    assert result["is_correct"] is True
    assert result["new_interval"] == 3
    assert result["new_ease_factor"] == 2.6
    assert result["similarity_ratio"] > 0.85
