"""FastAPI backend that proxies NSE data and computes indicators."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .indicators import build_indicator_summary, trim_history
from .nse_client import NSEClient, NSEClientError

app = FastAPI(title="NSE Stock Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_client = NSEClient()
_BASE_DIR = Path(__file__).resolve().parent.parent
_BUILD_DIR = _BASE_DIR / "build"


def _to_number(value: Any) -> Any:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed == parsed else None


@app.get("/api/stocks")
def get_stock(symbol: str = Query(..., min_length=1, description="NSE symbol")) -> Dict[str, Any]:
    try:
        quote_data, chart_data = _client.fetch_quote_and_history(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except NSEClientError as exc:  # pragma: no cover - network errors
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    uppercase_symbol = symbol.strip().upper()
    price_info: Dict[str, Any] = quote_data.get("priceInfo", {}) if isinstance(quote_data, dict) else {}
    company_info: Dict[str, Any] = quote_data.get("info", {}) if isinstance(quote_data, dict) else {}
    history_raw = []
    if isinstance(chart_data, dict):
        history_raw = chart_data.get("grapthData") or chart_data.get("graphData") or []

    history = trim_history(history_raw)
    indicators = build_indicator_summary(history)

    response = {
        "symbol": uppercase_symbol,
        "companyName": company_info.get("companyName", uppercase_symbol),
        "lastPrice": _to_number(price_info.get("lastPrice")),
        "open": _to_number(price_info.get("open")),
        "high": _to_number((price_info.get("intraDayHighLow") or {}).get("high")),
        "low": _to_number((price_info.get("intraDayHighLow") or {}).get("low")),
        "previousClose": _to_number(price_info.get("previousClose")),
        "change": _to_number(price_info.get("change")),
        "changePercent": _to_number(price_info.get("pChange")),
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "indicators": indicators,
        "history": history,
    }

    return response


if _BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=_BUILD_DIR / "static"), name="static")


@app.get("/")
def serve_index() -> FileResponse:
    if not _BUILD_DIR.exists():
        raise HTTPException(status_code=404, detail="Build assets not found.")
    return FileResponse(_BUILD_DIR / "index.html")


@app.get("/{full_path:path}")
def serve_spa(full_path: str) -> FileResponse:
    if not _BUILD_DIR.exists():
        raise HTTPException(status_code=404, detail="Build assets not found.")
    candidate = (_BUILD_DIR / full_path).resolve()
    try:
        candidate.relative_to(_BUILD_DIR)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Resource not found.") from exc

    if candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(_BUILD_DIR / "index.html")
