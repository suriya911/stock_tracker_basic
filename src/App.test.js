import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
  const mockApiResponse = {
    symbol: 'SBIN',
    companyName: 'State Bank of India',
    lastPrice: 602.35,
    open: 600,
    high: 610,
    low: 595,
    previousClose: 598,
    change: 4.35,
    changePercent: 0.72,
    lastUpdated: '2024-01-02T10:15:00.000Z',
    history: [],
    indicators: {
      sma20: 601.12,
      ema20: 600.54,
      rsi14: 58.23,
      bollingerBands: {
        upper: 615.4,
        lower: 585.6,
        middle: 600.5,
      },
      annualisedVolatility: 18.2,
    },
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete global.fetch;
  });

  it('renders initial instructions', () => {
    render(<App />);
    expect(
      screen.getByText('Enter a valid NSE equity symbol to begin tracking live prices and indicators.'),
    ).toBeInTheDocument();
  });

  it('shows an error when attempting to track without a symbol', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Start Tracking'));
    expect(await screen.findByText('Symbol is required to start tracking.')).toBeInTheDocument();
  });

  it('fetches stock data and renders the resulting table', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<App />);

    const symbolInput = screen.getByPlaceholderText('Symbol (e.g. SBIN)');
    fireEvent.change(symbolInput, { target: { value: 'sbin' } });

    fireEvent.click(screen.getByText('Fetch Once'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stocks?symbol=SBIN'),
      );
    });

    expect(await screen.findByText('State Bank of India')).toBeInTheDocument();
    expect(screen.getByText('602.35')).toBeInTheDocument();
    expect(screen.getByText('0.72%')).toBeInTheDocument();
  });

  it('shows the auto refresh message when an interval is configured', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Minutes'), { target: { value: '0' } });
    fireEvent.change(screen.getByPlaceholderText('Seconds'), { target: { value: '30' } });
    fireEvent.change(screen.getByPlaceholderText('Symbol (e.g. SBIN)'), { target: { value: 'SBIN' } });

    fireEvent.click(screen.getByText('Start Tracking'));

    expect(
      await screen.findByText('Auto-refreshing SBIN every 30 second(s).'),
    ).toBeInTheDocument();
  });
});
