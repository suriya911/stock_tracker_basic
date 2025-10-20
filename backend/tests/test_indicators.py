from __future__ import annotations

from backend.indicators import (
    BollingerBands,
    annualised_volatility,
    bollinger_bands,
    build_indicator_summary,
    exponential_moving_average,
    relative_strength_index,
    simple_moving_average,
    trim_history,
)


def test_simple_moving_average():
    values = list(range(1, 21))
    assert simple_moving_average(values, 5) == 18.0
    assert simple_moving_average(values, 20) == 10.5
    assert simple_moving_average(values, 25) is None


def test_exponential_moving_average():
    values = [1, 2, 3]
    assert exponential_moving_average(values, 3) == 2.25
    assert exponential_moving_average(values, 4) is None


def test_relative_strength_index():
    increasing = list(range(1, 17))
    assert relative_strength_index(increasing, 14) == 100.0

    flat = [100] * 20
    assert relative_strength_index(flat, 14) == 50.0

    mixed = [100, 101, 102, 101, 100, 102, 104, 103, 102, 101, 103, 105, 104, 103, 104]
    rsi = relative_strength_index(mixed, 14)
    assert rsi is not None
    assert 0.0 <= rsi <= 100.0


def test_bollinger_bands():
    values = [100] * 20
    bands = bollinger_bands(values, 20)
    assert isinstance(bands, BollingerBands)
    assert bands.middle == 100.0
    assert bands.upper == 100.0
    assert bands.lower == 100.0

    assert bollinger_bands(values, 25).middle is None


def test_annualised_volatility():
    values = [100 + (i % 3) for i in range(35)]
    vol = annualised_volatility(values, 30)
    assert vol is not None
    assert vol >= 0

    assert annualised_volatility(values, 40) is None


def test_trim_history_and_summary():
    raw = [[1_700_000_000_000, 100.1234], [1_700_000_060_000, 101.5678], [1_700_000_120_000, "bad"], [1_700_000_180_000, 102.0]]
    trimmed = trim_history(raw, limit=3)
    assert len(trimmed) == 2
    assert trimmed[0]["price"] == 101.5678

    summary = build_indicator_summary(trimmed)
    assert summary["sma20"] is None  # not enough data yet
    assert summary["bollingerBands"]["middle"] is None
