# Stock Price Tracker

A real-time stock price tracking application built with React that allows users to monitor stock prices at customizable intervals.

## Features

- Real-time stock price tracking
- Customizable tracking intervals (minutes and seconds)
- Manual data fetching
- Tabular display of stock data
- Company profile information
- Responsive design
- Docker support for easy deployment

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Finnhub API key
- Docker and Docker Compose (for containerized deployment)

## API Key Setup

1. Sign up for a free API key at [Finnhub](https://finnhub.io/)
2. Create a `.env` file in the root directory of the project
3. Add your API key to the `.env` file:
```
FINNHUB_API_KEY=your_api_key_here
```

Note: Never commit your `.env` file to version control. It's already added to `.gitignore`.

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <your-repository-url>
cd stock-price-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

### Docker Deployment

1. Make sure your `.env` file is set up with the API key

2. Build and run using Docker Compose:
```bash
docker-compose up --build
```

3. Or build and run using Docker directly:
```bash
# Build the image
docker build -t stock-price-tracker .

# Run the container
docker run -p 80:80 -e REACT_APP_FINNHUB_API_KEY=your_api_key_here stock-price-tracker
```

The application will be available at `http://localhost:80`

## Usage

1. Enter the stock symbol (e.g., AAPL, MSFT, GOOGL)
2. Set the tracking interval:
   - Enter minutes (optional)
   - Enter seconds (optional)
3. Click "Track" to start automatic tracking
4. Click "Fetch Data" to manually fetch current data

## Data Displayed

- Company Name
- Opening Price
- High Price
- Low Price
- Current Price
- Previous Close Price
- Timestamp

## API Integration

This application uses the Finnhub API for real-time stock data:
- Quote endpoint for price data
- Profile endpoint for company information

## Technologies Used

- React
- JavaScript (ES6+)
- Finnhub API
- CSS (Inline styles)
- Docker
- Nginx

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Finnhub for providing the stock market API
- React team for the amazing framework
