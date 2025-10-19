"""Utility functions for calculating technical indicators."""
from __future__ import annotations

from dataclasses import dataclass
from math import log, sqrt
from typing import Iterable, List, Optional, Sequence


def _to_number(value: object) -> Optional[float]:
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return number if number == number else None  # guard against NaN


def _rounded(value: Optional[float], digits: int = 2) -> Optional[float]:
    if value is None:
        return None
    return round(value, digits)


@dataclass
class BollingerBands:
    middle: Optional[float]
    upper: Optional[float]
    lower: Optional[float]


def simple_moving_average(values: Sequence[float], window: int) -> Optional[float]:
    if window <= 0 or len(values) < window:
        return None
    window_slice = values[-window:]
    return _rounded(sum(window_slice) / window)


def exponential_moving_average(values: Sequence[float], window: int) -> Optional[float]:
    if window <= 0 or len(values) < window:
        return None
    smoothing = 2 / (window + 1)
    ema = values[-window]
    for price in values[-window + 1 :]:
        ema = (price * smoothing) + (ema * (1 - smoothing))
    return _rounded(ema)


def relative_strength_index(values: Sequence[float], window: int) -> Optional[float]:
    if window <= 0 or len(values) <= window:
        return None

    gains: List[float] = []
    losses: List[float] = []

    for previous, current in zip(values[-window - 1 : -1], values[-window:]):
        change = current - previous
        if change > 0:
            gains.append(change)
        else:
            losses.append(abs(change))

    if not gains and not losses:
        return 50.0

    average_gain = sum(gains) / window if gains else 0.0
    average_loss = sum(losses) / window if losses else 0.0

    if average_loss == 0:
        return 100.0

    rs = average_gain / average_loss
    rsi = 100 - (100 / (1 + rs))
    return _rounded(rsi)


def bollinger_bands(values: Sequence[float], window: int) -> BollingerBands:
    if window <= 0 or len(values) < window:
        return BollingerBands(None, None, None)
    middle = simple_moving_average(values, window)
    if middle is None:
        return BollingerBands(None, None, None)

    window_slice = values[-window:]
    squared_diffs = [(price - middle) ** 2 for price in window_slice]
    variance = sum(squared_diffs) / window
    std_dev = sqrt(variance)

    return BollingerBands(
        middle=_rounded(middle),
        upper=_rounded(middle + (2 * std_dev)),
        lower=_rounded(middle - (2 * std_dev)),
    )


def annualised_volatility(values: Sequence[float], window: int = 30) -> Optional[float]:
    if window <= 0 or len(values) <= window:
        return None

    recent = values[-(window + 1) :]
    log_returns = []
    for previous, current in zip(recent, recent[1:]):
        if previous > 0 and current > 0:
            log_returns.append(log(current / previous))

    if not log_returns:
        return None

    avg_return = sum(log_returns) / len(log_returns)
    variance = sum((ret - avg_return) ** 2 for ret in log_returns) / len(log_returns)
    daily_vol = sqrt(variance)
    annualised = daily_vol * sqrt(252) * 100
    return _rounded(annualised)


def extract_valid_closes(history: Iterable[dict]) -> List[float]:
    closes: List[float] = []
    for entry in history:
        value = _to_number(entry.get("price"))
        if value is not None:
            closes.append(value)
    return closes


def build_indicator_summary(history: Iterable[dict]) -> dict:
    closes = extract_valid_closes(history)
    return {
        "sma20": simple_moving_average(closes, 20),
        "ema20": exponential_moving_average(closes, 20),
        "rsi14": relative_strength_index(closes, 14),
        "bollingerBands": bollinger_bands(closes, 20).__dict__,
        "annualisedVolatility": annualised_volatility(closes, 30),
    }


def trim_history(raw_history: Sequence[Sequence[float]], limit: int = 180) -> List[dict]:
    trimmed = raw_history[-limit:] if raw_history else []
    normalised = []
    for point in trimmed:
        if len(point) < 2:
            continue
        timestamp, price = point[0], point[1]
        try:
            iso_timestamp = _to_iso_timestamp(timestamp)
        except Exception:  # pragma: no cover - defensive
            continue
        price_value = _to_number(price)
        if price_value is None:
            continue
        normalised.append({"timestamp": iso_timestamp, "price": round(price_value, 4)})
    return normalised


def _to_iso_timestamp(value: object) -> str:
    import datetime as _dt

    if isinstance(value, (int, float)):
        return _dt.datetime.fromtimestamp(value / 1000, tz=_dt.timezone.utc).isoformat()
    if isinstance(value, str):
        return _dt.datetime.fromisoformat(value).astimezone(_dt.timezone.utc).isoformat()
    raise ValueError("Unsupported timestamp format")
