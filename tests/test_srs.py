from app.services import srs

def test_calculate_sm2_forgot():
    ef, interval, reps = srs.calculate_sm2(
        ease_factor=250, interval=10, repetitions=5, quality=1
    )
    assert reps == 0
    assert interval == 1

def test_calculate_sm2_first_success():
    ef, interval, reps = srs.calculate_sm2(
        ease_factor=250, interval=0, repetitions=0, quality=4
    )
    assert reps == 1
    assert interval == 1

def test_calculate_sm2_second_success():
    ef, interval, reps = srs.calculate_sm2(
        ease_factor=250, interval=1, repetitions=1, quality=4
    )
    assert reps == 2
    assert interval == 6

def test_calculate_sm2_subsequent_success():
    ef, interval, reps = srs.calculate_sm2(
        ease_factor=250, interval=6, repetitions=2, quality=4
    )
    assert reps == 3
    assert interval == 15

def test_calculate_sm2_ease_factor_decrease():
    old_ef = 250
    ef, interval, reps = srs.calculate_sm2(
        ease_factor=old_ef, interval=1, repetitions=1, quality=3
    )
    assert ef < old_ef

def test_get_quality_from_rating():
    assert srs.get_quality_from_rating("again") == 1
    assert srs.get_quality_from_rating("hard") == 3
    assert srs.get_quality_from_rating("good") == 4
    assert srs.get_quality_from_rating("easy") == 5
    assert srs.get_quality_from_rating("random") == 4
