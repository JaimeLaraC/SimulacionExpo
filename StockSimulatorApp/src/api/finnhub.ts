import axios from 'axios';

const API_KEY = 'YOUR_FINNHUB_API_KEY'; // Replace with your actual Finnhub API key
const BASE_URL = 'https://finnhub.io/api/v1';

// Interface for stock quote data
export interface StockQuote {
  c: number;  // Current price
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp (Unix seconds)
}

// Interface for stock symbols (used in popular stocks)
export interface StockSymbol {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
  mic?: string; 
  figi?: string; 
  shareClassFIGI?: string;
  currency?: string;
  isin?: string | null;
  lei?: string | null;
  primaryTick?: string; 
}

/**
 * Fetches a list of popular stock symbols.
 */
export const getPopularStocks = async (): Promise<StockSymbol[]> => {
  console.log('Fetching popular stocks...');
  const popularSymbols: StockSymbol[] = [
    { description: 'APPLE INC', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock', currency: 'USD' },
    { description: 'MICROSOFT CORP', displaySymbol: 'MSFT', symbol: 'MSFT', type: 'Common Stock', currency: 'USD' },
    { description: 'ALPHABET INC-CL C', displaySymbol: 'GOOGL', symbol: 'GOOGL', type: 'Common Stock', currency: 'USD' },
    { description: 'AMAZON.COM INC', displaySymbol: 'AMZN', symbol: 'AMZN', type: 'Common Stock', currency: 'USD' },
    { description: 'TESLA INC', displaySymbol: 'TSLA', symbol: 'TSLA', type: 'Common Stock', currency: 'USD' },
    { description: 'META PLATFORMS INC', displaySymbol: 'META', symbol: 'META', type: 'Common Stock', currency: 'USD' },
    { description: 'NVIDIA CORP', displaySymbol: 'NVDA', symbol: 'NVDA', type: 'Common Stock', currency: 'USD' },
    { description: 'JPMORGAN CHASE & CO', displaySymbol: 'JPM', symbol: 'JPM', type: 'Common Stock', currency: 'USD' },
    { description: 'JOHNSON & JOHNSON', displaySymbol: 'JNJ', symbol: 'JNJ', type: 'Common Stock', currency: 'USD' },
    { description: 'VISA INC-CLASS A', displaySymbol: 'V', symbol: 'V', type: 'Common Stock', currency: 'USD' },
    { description: 'PAYPAL HOLDINGS INC', displaySymbol: 'PYPL', symbol: 'PYPL', type: 'Common Stock', currency: 'USD' },
    { description: 'WALT DISNEY CO', displaySymbol: 'DIS', symbol: 'DIS', type: 'Common Stock', currency: 'USD' },
    { description: 'NETFLIX INC', displaySymbol: 'NFLX', symbol: 'NFLX', type: 'Common Stock', currency: 'USD' },
    { description: 'ALIBABA GROUP HOLDING LTD-SP ADR', displaySymbol: 'BABA', symbol: 'BABA', type: 'ADR', currency: 'USD' },
  ];
  console.log('Popular stocks data structure (example):', popularSymbols[0]);
  return Promise.resolve(popularSymbols);
};

/**
 * Fetches the current quote for a given stock symbol.
 * If API_KEY is 'YOUR_FINNHUB_API_KEY', returns hardcoded mock data for specific symbols.
 * @param symbol The stock symbol (e.g., "AAPL")
 */
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  if (API_KEY === 'YOUR_FINNHUB_API_KEY') {
    console.warn(`API key for Finnhub is not configured. Returning mock data for symbol: ${symbol}`);
    const now = Date.now() / 1000; // Current time in Unix seconds
    const mockQuotes: { [key: string]: StockQuote } = {
      'AAPL': { c: 170.00, dp: 1.5, h: 172.00, l: 168.50, o: 169.00, pc: 168.00, t: now },
      'MSFT': { c: 280.00, dp: -0.5, h: 282.00, l: 278.00, o: 281.00, pc: 281.50, t: now },
      'GOOGL': { c: 2700.00, dp: 0.8, h: 2710.00, l: 2690.00, o: 2705.00, pc: 2695.00, t: now },
      'AMZN': { c: 135.50, dp: 2.1, h: 136.00, l: 133.00, o: 133.50, pc: 132.70, t: now },
      'TSLA': { c: 255.75, dp: -1.2, h: 260.00, l: 250.50, o: 258.00, pc: 258.80, t: now },
      'META': { c: 305.00, dp: 0.5, h: 308.00, l: 303.00, o: 304.00, pc: 303.50, t: now },
      'NVDA': { c: 450.25, dp: 3.0, h: 455.00, l: 448.00, o: 450.00, pc: 437.14, t: now },
    };
    if (mockQuotes[symbol]) {
      return Promise.resolve(mockQuotes[symbol]);
    }
    // Return default/empty quote for other symbols if API key is the placeholder
    return Promise.resolve({ c: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: now });
  }

  console.log(`Fetching real stock quote for ${symbol}...`);
  const url = `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`;
  console.log(`API Call: ${url}`);

  try {
    const response = await axios.get<StockQuote>(url);
    console.log(`Stock quote data structure for ${symbol}:`, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching stock quote for ${symbol}:`, error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.error("Unauthorized: Check your Finnhub API key.");
      } else if (error.response?.status === 429) {
        console.error("API limit possibly reached for Finnhub.");
      }
    } else {
      console.error(`An unexpected error occurred while fetching stock quote for ${symbol}:`, error);
    }
    return null;
  }
};

// Example usage (conceptual)
/*
(async () => {
  const popular = await getPopularStocks();
  if (popular.length > 0) {
    console.log('First popular stock symbol:', popular[0].symbol);
    const quote = await getStockQuote(popular[0].symbol);
    if (quote) {
      console.log(`Quote for ${popular[0].symbol}: Current Price: ${quote.c}`);
    }
  }

  // Test specific mock data
  const aaplQuote = await getStockQuote('AAPL');
  console.log('Mock AAPL Quote:', aaplQuote);
  const jpmQuote = await getStockQuote('JPM'); // JPM doesn't have specific mock, should get default
  console.log('Mock JPM Quote (should be default/zero):', jpmQuote);
})();
*/
