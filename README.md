# Stock Price Tracker

An NSE-focused stock tracking application that fetches live market data directly from the National Stock Exchange of India (via the same endpoints surfaced by the `nsepython` project) and derives key technical indicators.

## Features

- Live NSE equity pricing with automatic refresh scheduling
- Manual one-click refresh for on-demand updates
- Basic technical indicators (SMA-20, EMA-20, RSI-14, Bollinger Bands, annualised volatility)
- Compact historical price series for additional analysis
- Responsive tabular layout with trend-aware styling
- Dockerised deployment using a FastAPI backend that also serves the compiled React SPA

## Prerequisites

- Node.js (v18 or higher)
- npm (v8+) or yarn
- Python 3.11+
- Docker and Docker Compose (optional, for containerised deployment)

## Data Source

Market data is downloaded directly from the National Stock Exchange of India's public endpoints (the same sources used by the `nsepython` package). No external API key is required.

## Installation

### Local Development

1. Clone the repository and install dependencies:
   ```bash
   git clone <your-repository-url>
   cd stock_tracker_basic
   npm install
   ```

2. Build the React application (required for the local API server to serve the SPA):
   ```bash
   npm run build
   ```

3. (Optional, recommended for development) Start the React development server in a new terminal session so you get hot reloading while editing the UI:
   ```bash
   REACT_APP_API_BASE_URL=http://localhost:8080 npm start
   ```

4. Create and activate a Python virtual environment, then install the FastAPI backend dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

5. Launch the backend, which brokers NSE requests and computes indicators:
   ```bash
   uvicorn backend.app:app --host 0.0.0.0 --port 8080 --reload
   ```

   The React development server will proxy API calls to the FastAPI backend started in this step.

### Docker Deployment

Build and run the production container (which bundles the compiled frontend with the FastAPI service):

```bash
docker-compose up --build
```

The application will be available at [http://localhost:8080](http://localhost:8080).

## Usage

1. Enter a valid NSE equity symbol (for example: `SBIN`, `TCS`, `INFY`).
2. (Optional) Specify the refresh cadence using minutes and/or seconds.
3. Click **Start Tracking** to trigger an immediate fetch and schedule periodic refreshes.
4. Use **Fetch Once** for manual refreshes or **Stop** to halt automatic updates.

## Data Displayed

- Company name & symbol
- Latest, open, high, low, and previous close prices
- Absolute & percentage price change
- SMA-20, EMA-20, RSI-14
- Bollinger Band upper/lower bounds
- Annualised historical volatility (log returns)
- Timestamp of the latest refresh

## Testing

End-to-end validation of the project covers both the React interface and the FastAPI backend.

```bash
# Frontend tests (Jest + React Testing Library)
npm test -- --watchAll=false

# Production bundle build (ensures the SPA compiles for deployment)
npm run build

# Backend tests (Pytest + FastAPI TestClient)
pytest backend/tests

# Docker image build (matches the CI release step)
docker build -t stock-tracker .
```

All of the above checks are executed automatically for every pull request and push via the
`CI/CD` workflow defined in [`.github/workflows/test.yml`](.github/workflows/test.yml), which
also verifies that the Docker image can be produced successfully.

## API Integration

All pricing data and historical candles are sourced from NSE public APIs, aligning with the data exposed by the `nsepython` library.

## Technologies Used

- React 19
- JavaScript (ES2023)
- FastAPI & Uvicorn backend for NSE data retrieval
- Inline CSS for rapid styling
- Docker & Docker Compose

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The NSE India team for maintaining the public market data endpoints
- The maintainers of `nsepython` for documenting accessible NSE datasets
- React team for the amazing framework

## Publishing Changes to GitHub

Follow these steps to publish your local work to GitHub once you are happy with the changes:

1. **Log in to GitHub and generate a Personal Access Token (PAT)** if you have not already done so. Go to <https://github.com/settings/tokens>, create a classic token with the `repo` scope, and copy it somewhere safe. The PAT is used as your password when pushing over HTTPS.
2. **Add your GitHub repository as a remote** (run this only the first time in a fresh clone):
   ```bash
   git remote add origin https://github.com/<your-user-or-org>/<your-repo>.git
   ```
3. **Confirm you are on the branch you wish to publish** and review the history:
   ```bash
   git status -sb
   git log --oneline --decorate --graph -5
   ```
4. **Push the branch to GitHub**, authenticating with your PAT when prompted for a password:
   ```bash
   git push -u origin $(git rev-parse --abbrev-ref HEAD)
   ```
5. **Open a pull request or merge the branch** in the GitHub web UI as required by your workflow. For direct pushes to the default branch, make sure the CI workflow in [`.github/workflows/test.yml`](.github/workflows/test.yml) passes locally (`npm test`, `pytest backend/tests`, `npm run build`, and `docker build`) before you push.

If you prefer SSH over HTTPS, configure an SSH key with GitHub and replace the remote URL with the SSH variant (for example `git@github.com:<user>/<repo>.git`).

