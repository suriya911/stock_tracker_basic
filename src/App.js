import React, { useState, useEffect, useRef } from 'react';

const getDefaultApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.port === '3000') {
    return 'http://localhost:8080';
  }
  return '';
};

const API_BASE_URL = getDefaultApiBaseUrl();

const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(digits);
};

const changeColor = (value) => {
  if (value > 0) return '#2e7d32';
  if (value < 0) return '#c62828';
  return '#555';
};

function App() {
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [symbol, setSymbol] = useState('');
  const [stockRows, setStockRows] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshMessage, setAutoRefreshMessage] = useState('');
  const intervalRef = useRef(null);
  const activeSymbolRef = useRef('');

  const fetchStockData = async (inputSymbol) => {
    const trimmedSymbol = (inputSymbol || symbol || '').trim().toUpperCase();
    if (!trimmedSymbol) {
      setError('Please enter a valid NSE symbol before fetching data.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/stocks?symbol=${encodeURIComponent(trimmedSymbol)}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      const indicators = data.indicators || {};
      const bollinger = indicators.bollingerBands || {};

      const newRow = {
        symbol: data.symbol,
        companyName: data.companyName,
        lastPrice: data.lastPrice,
        open: data.open,
        high: data.high,
        low: data.low,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changePercent,
        sma20: indicators.sma20,
        ema20: indicators.ema20,
        rsi14: indicators.rsi14,
        bollingerUpper: bollinger.upper,
        bollingerLower: bollinger.lower,
        bollingerMiddle: bollinger.middle,
        annualisedVolatility: indicators.annualisedVolatility,
        lastUpdated: data.lastUpdated,
        history: data.history,
      };

      setStockRows((previousRows) => {
        const filtered = previousRows.filter((row) => row.symbol !== newRow.symbol);
        return [newRow, ...filtered];
      });
    } catch (fetchError) {
      console.error('Error fetching stock data:', fetchError);
      setError('Unable to retrieve data from NSE. Please verify the symbol and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleStartTracking = () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) {
      setError('Symbol is required to start tracking.');
      return;
    }

    activeSymbolRef.current = trimmedSymbol;
    setSymbol(trimmedSymbol);
    clearInterval(intervalRef.current);

    const minutesValue = Math.max(0, Number(minutes) || 0);
    const secondsValue = Math.max(0, Number(seconds) || 0);
    const totalSeconds = minutesValue * 60 + secondsValue;

    fetchStockData(trimmedSymbol);

    if (totalSeconds > 0) {
      const intervalMs = totalSeconds * 1000;
      intervalRef.current = setInterval(() => {
        fetchStockData(activeSymbolRef.current);
      }, intervalMs);
      setAutoRefreshMessage(`Auto-refreshing ${trimmedSymbol} every ${minutesValue ? `${minutesValue} minute(s)` : ''}${minutesValue && secondsValue ? ' and ' : ''}${secondsValue ? `${secondsValue} second(s)` : ''}.`);
    } else {
      setAutoRefreshMessage('');
    }
  };

  const handleManualRefresh = () => {
    fetchStockData(symbol);
  };

  const handleStopTracking = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setAutoRefreshMessage('');
  };

  return (
    <div
      style={{
        padding: '40px 20px',
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#f4f6f8',
      }}
    >
      <h1 style={{ marginBottom: '24px', color: '#1a237e' }}>NSE Stock Tracker</h1>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
        }}
      >
        <input
          type="number"
          min="0"
          placeholder="Minutes"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #cfd8dc',
            fontSize: '16px',
            width: '110px',
          }}
        />
        <input
          type="number"
          min="0"
          placeholder="Seconds"
          value={seconds}
          onChange={(event) => setSeconds(event.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #cfd8dc',
            fontSize: '16px',
            width: '110px',
          }}
        />
        <input
          type="text"
          placeholder="Symbol (e.g. SBIN)"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #cfd8dc',
            fontSize: '16px',
            minWidth: '160px',
            textTransform: 'uppercase',
          }}
        />
        <button
          onClick={handleStartTracking}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            backgroundColor: '#1b5e20',
            color: '#ffffff',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            minWidth: '120px',
          }}
        >
          Start Tracking
        </button>
        <button
          onClick={handleManualRefresh}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            backgroundColor: '#0277bd',
            color: '#ffffff',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            minWidth: '120px',
          }}
        >
          Fetch Once
        </button>
        <button
          onClick={handleStopTracking}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            backgroundColor: '#c62828',
            color: '#ffffff',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            minWidth: '120px',
          }}
        >
          Stop
        </button>
      </div>

      {autoRefreshMessage && (
        <p style={{ color: '#2e7d32', marginBottom: '12px' }}>{autoRefreshMessage}</p>
      )}

      {isLoading && (
        <p style={{ color: '#1565c0', marginBottom: '12px' }}>Fetching data…</p>
      )}

      {error && (
        <p style={{ color: '#c62828', marginBottom: '12px' }}>{error}</p>
      )}

      {stockRows.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            overflowX: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e3f2fd', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Company</th>
                <th style={{ padding: '12px' }}>Last Price</th>
                <th style={{ padding: '12px' }}>Change</th>
                <th style={{ padding: '12px' }}>Change %</th>
                <th style={{ padding: '12px' }}>Open</th>
                <th style={{ padding: '12px' }}>High</th>
                <th style={{ padding: '12px' }}>Low</th>
                <th style={{ padding: '12px' }}>Prev Close</th>
                <th style={{ padding: '12px' }}>SMA (20)</th>
                <th style={{ padding: '12px' }}>EMA (20)</th>
                <th style={{ padding: '12px' }}>RSI (14)</th>
                <th style={{ padding: '12px' }}>Bollinger Upper</th>
                <th style={{ padding: '12px' }}>Bollinger Lower</th>
                <th style={{ padding: '12px' }}>Volatility %</th>
                <th style={{ padding: '12px' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((row) => (
                <tr key={row.symbol} style={{ borderTop: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>
                    {row.companyName}
                    <div style={{ fontSize: '12px', color: '#546e7a', marginTop: '4px' }}>{row.symbol}</div>
                  </td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.lastPrice)}</td>
                  <td style={{ padding: '12px', color: changeColor(row.change) }}>{formatNumber(row.change)}</td>
                  <td style={{ padding: '12px', color: changeColor(row.changePercent) }}>
                    {formatNumber(row.changePercent)}%
                  </td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.open)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.high)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.low)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.previousClose)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.sma20)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.ema20)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.rsi14)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.bollingerUpper)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.bollingerLower)}</td>
                  <td style={{ padding: '12px' }}>{formatNumber(row.annualisedVolatility)}</td>
                  <td style={{ padding: '12px' }}>
                    {row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!stockRows.length && !isLoading && !error && (
        <p style={{ color: '#607d8b', marginTop: '20px' }}>
          Enter a valid NSE equity symbol to begin tracking live prices and indicators.
        </p>
      )}
    </div>
  );
}

export default App;
