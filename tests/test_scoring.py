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
    # Correct answer (similarity 0.96 >= 0.95): interval should grow, ease + 0.15
    new_ease, new_interval = ScoringService.update_flashcard_metrics(0.96, 2.5, 1)
    assert new_interval == 3
    assert new_ease == 2.65

    # Correct answer (similarity 0.90 >= 0.85): interval should grow, ease + 0.05
    new_ease2, new_interval2 = ScoringService.update_flashcard_metrics(0.90, 2.65, 3)
    assert new_interval2 == 8 # 3 * 2.65 = 7.95 -> 8
    assert new_ease2 == 2.70

    # Barely correct (similarity 0.80 >= 0.75): interval should grow, ease - 0.05
    new_ease3, new_interval3 = ScoringService.update_flashcard_metrics(0.80, 2.70, 8)
    assert new_interval3 == 22 # 8 * 2.70 = 21.6 -> 22
    assert new_ease3 == 2.65

def test_update_flashcard_metrics_incorrect():
    # Incorrect answer: ease should drop and interval reset
    new_ease, new_interval = ScoringService.update_flashcard_metrics(0.5, 2.5, 10)
    assert new_interval == 0
    assert new_ease == 2.3

def test_evaluate_answer():
    result = ScoringService.evaluate_answer("aple", "apple", [], 2.5, 1)
    assert result["is_correct"] is True
    assert result["new_interval"] == 3
    assert result["similarity_ratio"] > 0.85
    assert result["new_ease_factor"] == 2.55 # >= 0.85 so +0.05 to 2.50 = 2.55

def test_evaluate_answer_semantic_alternative():
    # If the user writes 'kavramak', and the actual is 'anlamak', score is practically 0 on string distance.
    # But because it is in alternatives, it should pass with 1.0 (exact match with alternative list item).
    result = ScoringService.evaluate_answer("kavramak", "anlamak", ["anladım", "kavramak"], 2.5, 1)
    assert result["is_correct"] is True
    assert result["similarity_ratio"] == 1.0
