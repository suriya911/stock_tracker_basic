from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List

from fastapi.testclient import TestClient

from backend import app as backend_app


class DummyClient:
    def __init__(self, quote: Dict[str, Any], history: Dict[str, Any]):
        self._quote = quote
        self._history = history
        self.called_with: List[str] = []

    def fetch_quote_and_history(self, symbol: str):
        self.called_with.append(symbol)
        return self._quote, self._history


def _build_history(prices: List[float]) -> Dict[str, Any]:
    base = datetime(2024, 1, 1, tzinfo=timezone.utc)
    series = []
    for idx, price in enumerate(prices):
        timestamp = int((base + timedelta(minutes=idx)).timestamp() * 1000)
        series.append([timestamp, price])
    return {"grapthData": series}


def test_get_stock_success(monkeypatch):
    prices = [100 + (i % 5) for i in range(40)]
    quote = {
        "info": {"companyName": "Reliance Industries"},
        "priceInfo": {
            "lastPrice": 102.3,
            "open": 101.0,
            "intraDayHighLow": {"high": 105.0, "low": 99.5},
            "previousClose": 100.5,
            "change": 1.8,
            "pChange": 1.79,
        },
    }
    history = _build_history(prices)
    dummy_client = DummyClient(quote, history)
    monkeypatch.setattr(backend_app, "_client", dummy_client)

    client = TestClient(backend_app.app)
    response = client.get("/api/stocks", params={"symbol": "reliance"})

    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "RELIANCE"
    assert data["companyName"] == "Reliance Industries"
    assert data["lastPrice"] == 102.3
    assert data["history"]  # trimmed series exists

    indicators = data["indicators"]
    assert indicators["sma20"] is not None
    assert indicators["ema20"] is not None
    assert indicators["rsi14"] is not None
    assert indicators["bollingerBands"]["middle"] is not None
    assert indicators["annualisedVolatility"] is not None

    assert dummy_client.called_with == ["reliance"]


def test_get_stock_bad_symbol(monkeypatch):
    class ErroringClient:
        def fetch_quote_and_history(self, symbol: str):
            raise ValueError("Symbol is required")

    monkeypatch.setattr(backend_app, "_client", ErroringClient())

    client = TestClient(backend_app.app)
    response = client.get("/api/stocks", params={"symbol": " "})

    assert response.status_code == 400
    assert response.json()["detail"] == "Symbol is required"
