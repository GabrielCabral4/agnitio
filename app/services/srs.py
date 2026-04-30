"""
SM-2 Spaced Repetition Algorithm Implementation

Based on the SuperMemo-2 algorithm used by Anki and other SRS systems.

The algorithm calculates:
- Ease Factor (EF): How easy the card is to remember (130-250, default 250 = 2.5)
- Interval: Days until next review
- Repetitions: Consecutive correct answers

Quality ratings (0-5):
- 0-2: Incorrect response (forgot completely)
- 3: Incorrect response with difficulty
- 4: Correct response with difficulty
- 5: Perfect response
"""

from datetime import datetime, timedelta
from typing import Tuple


class SM2Review:
    """
    Represents the result of an SM-2 review calculation.
    """
    def __init__(
        self,
        ease_factor: int,
        interval: int,
        repetitions: int,
        next_review_at: datetime
    ):
        self.ease_factor = ease_factor  # EF * 100 (to avoid floats)
        self.interval = interval  # Days
        self.repetitions = repetitions
        self.next_review_at = next_review_at


def calculate_sm2(
    ease_factor: int,
    interval: int,
    repetitions: int,
    quality: int
) -> Tuple[int, int, int]:
    """
    Calculate the new SM-2 parameters based on user response.

    Args:
        ease_factor: Current ease factor (EF * 100, e.g., 250 = 2.5)
        interval: Current interval in days
        repetitions: Number of consecutive correct answers
        quality: Response quality (0-5)
            0-2: Forgot completely
            3: Hard (remembered with difficulty)
            4: Good
            5: Easy

    Returns:
        Tuple of (new_ease_factor, new_interval, new_repetitions)
    """
    # Clamp quality to valid range
    quality = max(0, min(5, quality))

    # Convert EF to float for calculation
    ef = ease_factor / 100.0

    # Calculate new ease factor
    # EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    # EF minimum is 1.3
    ef = max(1.3, ef)

    # Convert back to integer representation
    new_ease_factor = int(round(ef * 100))

    # Calculate new interval and repetitions
    if quality <= 2:
        # Forgot the card - reset
        new_repetitions = 0
        new_interval = 1  # Review tomorrow
    else:
        # Remembered the card
        new_repetitions = repetitions + 1

        if new_repetitions == 1:
            new_interval = 1  # First successful review: 1 day
        elif new_repetitions == 2:
            new_interval = 6  # Second successful review: 6 days
        else:
            # Subsequent reviews: interval * EF
            new_interval = int(round(interval * ef))
            # Minimum interval of 1 day
            new_interval = max(1, new_interval)

    return new_ease_factor, new_interval, new_repetitions


def process_review(
    ease_factor: int,
    interval: int,
    repetitions: int,
    quality: int,
    last_review_at: datetime = None
) -> SM2Review:
    """
    Process a flashcard review and return the updated SRS parameters.

    Args:
        ease_factor: Current ease factor (EF * 100)
        interval: Current interval in days
        repetitions: Current number of consecutive correct answers
        quality: Response quality (0-5)
        last_review_at: When the card was last reviewed

    Returns:
        SM2Review object with updated parameters
    """
    new_ef, new_interval, new_reps = calculate_sm2(
        ease_factor, interval, repetitions, quality
    )

    # Calculate next review date
    now = datetime.now(timezone.utc)
    next_review = now + timedelta(days=new_interval)

    return SM2Review(
        ease_factor=new_ef,
        interval=new_interval,
        repetitions=new_reps,
        next_review_at=next_review
    )


def get_quality_from_rating(rating: str) -> int:
    """
    Convert a user-friendly rating to SM-2 quality score.

    Args:
        rating: One of "again", "hard", "good", "easy"

    Returns:
        SM-2 quality score (0-5)
    """
    mapping = {
        "again": 1,  # Forgot completely
        "hard": 3,   # Remembered with difficulty
        "good": 4,   # Correct response
        "easy": 5,   # Perfect response
    }
    return mapping.get(rating.lower(), 4)  # Default to "good"


def get_cards_due_for_review(
    flashcard_reviews: list,
    limit: int = 20
) -> list:
    """
    Filter and sort flashcards that are due for review.

    Args:
        flashcard_reviews: List of FlashCardReview objects
        limit: Maximum number of cards to return

    Returns:
        List of flashcard reviews due for review, sorted by priority
    """
    now = datetime.now(timezone.utc)

    # Filter cards that are due
    due_cards = [
        review for review in flashcard_reviews
        if review.next_review_at <= now
    ]

    # Sort by next_review_at (oldest first = highest priority)
    due_cards.sort(key=lambda r: r.next_review_at)

    return due_cards[:limit]


def calculate_maturity(interval: int) -> str:
    """
    Calculate the maturity level of a card based on its interval.

    Args:
        interval: Current interval in days

    Returns:
        Maturity level string
    """
    if interval == 0:
        return "new"
    elif interval < 2:
        return "learning"
    elif interval < 7:
        return "young"
    elif interval < 30:
        return "mature"
    else:
        return "very_mature"


def get_study_stats(flashcard_reviews: list) -> dict:
    """
    Calculate study statistics for a set of flashcard reviews.

    Args:
        flashcard_reviews: List of FlashCardReview objects

    Returns:
        Dictionary with study statistics
    """
    now = datetime.now(timezone.utc)

    total = len(flashcard_reviews)
    due = sum(1 for r in flashcard_reviews if r.next_review_at <= now)
    new = sum(1 for r in flashcard_reviews if r.repetitions == 0)
    mature = sum(1 for r in flashcard_reviews if r.interval >= 21)

    # Calculate average ease factor
    avg_ef = sum(r.ease_factor for r in flashcard_reviews) / total if total > 0 else 250

    return {
        "total": total,
        "due": due,
        "new": new,
        "mature": mature,
        "average_ease_factor": round(avg_ef / 100, 2),  # Convert back to float
        "learned_percentage": round((total - new) / total * 100, 1) if total > 0 else 0
    }
