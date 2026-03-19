from difflib import SequenceMatcher
from typing import Tuple

class ScoringService:
    @staticmethod
    def calculate_similarity(actual: str, expected: str) -> float:
        """
        Calculates similarity between two strings using difflib.
        """
        return SequenceMatcher(None, actual.lower().strip(), expected.lower().strip()).ratio()

    @staticmethod
    def update_flashcard_metrics(
        similarity: float, 
        old_ease_factor: float, 
        old_interval: int,
        threshold: float = 0.85
    ) -> Tuple[float, int]:
        """
        Updates flashcard metrics (ease_factor, interval) based on similarity.
        Correct answer (>= 0.85): Increases interval and ease_factor.
        Incorrect answer (< 0.85): Resets interval and decreases ease_factor.
        """
        if similarity >= threshold:
            # Correct answer logic: grow interval
            if old_interval == 0:
                new_interval = 1
            elif old_interval == 1:
                new_interval = 3
            else:
                new_interval = round(old_interval * old_ease_factor)
            
            new_ease_factor = old_ease_factor + 0.1
        else:
            # Incorrect answer logic: reset interval, drop ease
            new_ease_factor = max(1.3, old_ease_factor - 0.2)
            new_interval = 0  # Review immediately or next session
            
        return float(f"{new_ease_factor:.2f}"), int(new_interval)

    @staticmethod
    def evaluate_answer(
        actual: str, 
        expected: str, 
        current_ease_factor: float, 
        current_interval: int
    ) -> dict:
        """
        Evaluates user answer and returns updated metrics.
        Returns: {new_ease_factor, new_interval, is_correct, similarity_ratio}
        """
        similarity = ScoringService.calculate_similarity(actual, expected)
        is_correct = similarity >= 0.85
        
        new_ease, new_interval = ScoringService.update_flashcard_metrics(
            similarity, 
            current_ease_factor, 
            current_interval
        )
        
        return {
            "new_ease_factor": new_ease,
            "new_interval": new_interval,
            "is_correct": is_correct,
            "similarity_ratio": float(f"{similarity:.2f}")
        }
