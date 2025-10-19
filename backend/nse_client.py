"""Thin wrapper around NSE endpoints using the ``nsepython`` helper."""
from __future__ import annotations

from typing import Any, Dict, Tuple
from urllib.parse import quote as urlquote

from nsepython import nsefetch

__all__ = ["NSEClient", "NSEClientError"]


class NSEClientError(RuntimeError):
    """Raised when the NSE endpoints cannot be reached."""


class NSEClient:
    """HTTP client that fetches NSE data via :func:`nsepython.nsefetch`."""

    _QUOTE_ENDPOINT = "https://www.nseindia.com/api/quote-equity?symbol={symbol}"
    _HISTORY_ENDPOINT = "https://www.nseindia.com/api/chart-databyindex?index={symbol}"

    def fetch_quote_and_history(self, symbol: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        uppercase = symbol.strip().upper()
        if not uppercase:
            raise ValueError("Symbol is required")

        encoded_symbol = urlquote(uppercase)
        quote_url = self._QUOTE_ENDPOINT.format(symbol=encoded_symbol)
        history_url = self._HISTORY_ENDPOINT.format(symbol=encoded_symbol)

        try:
            quote_data = nsefetch(quote_url)
            history_data = nsefetch(history_url)
        except Exception as exc:  # pragma: no cover - network issues
            raise NSEClientError(f"Failed to fetch data for {uppercase}: {exc}") from exc

        if not isinstance(quote_data, dict) or not isinstance(history_data, dict):
            raise NSEClientError(
                f"Unexpected response format received for {uppercase}"
            )

        return quote_data, history_data
