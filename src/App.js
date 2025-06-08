import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [symbol, setSymbols] = useState("");
  const [stockRows, setStockRows] = useState([]);
  // const [submitted, setSubmited] = useState(false);
  const intervalRef = useRef(null);

  const API_KEY = process.env.FINNHUB_API_KEY;

  const fetchStockData = async () => {
    if (!symbol.trim()) return;

    try {
      // Fetch quote data
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
      const quoteResponse = await fetch(quoteUrl);
      const quoteData = await quoteResponse.json();

      // Fetch company profile
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY}`;
      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();

      console.log('Quote Data:', quoteData);
      console.log('Profile Data:', profileData);

      const now = new Date();
      const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.toLocaleTimeString()}`;

      const newRow = {
        companyName: profileData.name || symbol,
        open: quoteData.o,
        hight: quoteData.h,
        low: quoteData.l,
        currentPrice: quoteData.c,
        close: quoteData.pc,
        time: timestamp,
      }

      setStockRows((prevRows) => [...prevRows, newRow]);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSubmit = () => {
    clearInterval(intervalRef.current);
    fetchStockData();
    const intervalInMs = (parseInt(minutes || 0) * 60 + parseInt(seconds)) * 1000;
    if (intervalInMs > 0) {
      intervalRef.current = setInterval(fetchStockData, intervalInMs);
    }
  };

  return (
    <div style={{
      padding: "40px 20px",
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '80px'
    }}>
      <h2 style={{ marginBottom: '30px' }}>Stock Price Tracker</h2>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '800px',
        width: '100%'
      }}>
        <input
          type='number'
          placeholder='Min'
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <input
          type='number'
          placeholder='Sec'
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <input
          type='text'
          placeholder='Symbol'
          value={symbol}
          onChange={(e) => setSymbols(e.target.value.toUpperCase())}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: '10px 20px',
            borderRadius: '4px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
        >
          Track
        </button>
        <button
          onClick={fetchStockData}
          style={{
            padding: '10px 20px',
            borderRadius: '4px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
        >
          Fetch Data
        </button>
      </div>

      {stockRows.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Open</th>
              <th>High</th>
              <th>Low</th>
              <th>Current Price</th>
              <th>Close</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.map((row, index) => (
              <tr key={index}>
                <td>${row.companyName}</td>
                <td>${row.open}</td>
                <td>${row.hight}</td>
                <td>${row.low}</td>
                <td>${row.currentPrice}</td>
                <td>${row.close}</td>
                <td>${row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
