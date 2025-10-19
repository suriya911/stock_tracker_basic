"""Thin wrapper around the NSE endpoints used by nsepython."""
from __future__ import annotations

import threading
import time
from typing import Any, Dict, Tuple

import requests

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
    """HTTP client that mirrors the behaviour of ``nsepython`` for selected calls."""

    _BASE_URL = "https://www.nseindia.com"
    _USER_AGENT = (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
    )

    def __init__(self) -> None:
        self._session = requests.Session()
        self._lock = threading.Lock()
        self._last_refresh = 0.0

    def _homepage_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self._USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
        }

    def _api_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self._USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Referer": f"{self._BASE_URL}/",
        }

    def _ensure_session(self, force: bool = False) -> None:
        with self._lock:
            if not force and self._session.cookies and (time.time() - self._last_refresh) < 600:
                return
            response = self._session.get(
                self._BASE_URL,
                headers=self._homepage_headers(),
                timeout=10,
            )
            if response.status_code != 200:
                raise NSEClientError(
                    f"Failed to initialise NSE session (status {response.status_code})."
                )
            self._last_refresh = time.time()

    def _fetch_json(self, path: str) -> Dict[str, Any]:
        for attempt in range(2):
            self._ensure_session(force=attempt == 1)
            response = self._session.get(
                f"{self._BASE_URL}{path}",
                headers=self._api_headers(),
                timeout=10,
            )
            if response.status_code == 200:
                return response.json()
            if response.status_code in {401, 403} and attempt == 0:
                # refresh cookies and retry once
                continue
            raise NSEClientError(
                f"NSE endpoint {path} returned status {response.status_code}."
            )
        raise NSEClientError(f"Unable to fetch data from {path}")

    def fetch_quote_and_history(self, symbol: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        uppercase = symbol.strip().upper()
        if not uppercase:
            raise ValueError("Symbol is required")
        quote = self._fetch_json(f"/api/quote-equity?symbol={requests.utils.quote(uppercase)}")
        history = self._fetch_json(f"/api/chart-databyindex?index={requests.utils.quote(uppercase)}")
        return quote, history
