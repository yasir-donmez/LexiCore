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
        threshold: float = 0.75
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
            
            # Proportional Grading: Cut points or heavily reward based on string distance
            if similarity >= 0.95:
                ease_change = 0.15
            elif similarity >= 0.85:
                ease_change = 0.05
            else:
                ease_change = -0.05 # Barely correct, cut points slightly
                
            new_ease_factor = max(1.3, old_ease_factor + ease_change)
        else:
            # Incorrect answer logic: reset interval, drop ease
            new_ease_factor = max(1.3, old_ease_factor - 0.2)
            new_interval = 0  # Review immediately or next session
            
        return float(f"{new_ease_factor:.2f}"), int(new_interval)

    @staticmethod
    def evaluate_answer(
        actual: str, 
        expected: str, 
        alternatives: list,
        current_ease_factor: float, 
        current_interval: int
    ) -> dict:
        """
        Evaluates user answer and returns updated metrics.
        Returns: {new_ease_factor, new_interval, is_correct, similarity_ratio}
        """
        all_expected = [expected] + (alternatives if alternatives is not None else [])
        best_similarity = 0.0
        
        for exp in all_expected:
            sim = ScoringService.calculate_similarity(actual, exp)
            if sim > best_similarity:
                best_similarity = sim
                
        is_correct = best_similarity >= 0.75
        
        new_ease, new_interval = ScoringService.update_flashcard_metrics(
            best_similarity, 
            current_ease_factor, 
            current_interval
        )
        
        return {
            "new_ease_factor": new_ease,
            "new_interval": new_interval,
            "is_correct": is_correct,
            "similarity_ratio": float(f"{best_similarity:.2f}")
        }
