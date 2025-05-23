import AsyncStorage from '@react-native-async-storage/async-storage';

const PORTFOLIO_STORAGE_KEY = '@StockSimulatorApp:portfolio';
const INITIAL_CASH = 100000; // Initial cash balance

export interface PortfolioHolding {
  symbol: string;
  description: string;
  quantity: number;
  purchasePrice: number; // Average purchase price per share
}

export interface Portfolio {
  cash: number;
  holdings: PortfolioHolding[];
}

const defaultPortfolio: Portfolio = {
  cash: INITIAL_CASH,
  holdings: [],
};

/**
 * Fetches the portfolio from AsyncStorage.
 * @returns {Promise<Portfolio | null>} The portfolio object or null if not found.
 */
export const getPortfolio = async (): Promise<Portfolio | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (jsonValue !== null) {
      const portfolio = JSON.parse(jsonValue) as Portfolio;
      if (typeof portfolio.cash === 'undefined' || typeof portfolio.holdings === 'undefined') {
        console.warn('Portfolio data is malformed, returning default.');
        return { ...defaultPortfolio }; 
      }
      return portfolio;
    }
    return null; 
  } catch (e) {
    console.error('Failed to fetch portfolio from storage.', e);
    return null; 
  }
};

/**
 * Saves the portfolio to AsyncStorage.
 * @param {Portfolio} portfolio - The portfolio object to save.
 * @returns {Promise<void>}
 */
export const savePortfolio = async (portfolio: Portfolio): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(portfolio);
    await AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, jsonValue);
    console.log('Portfolio saved successfully.');
  } catch (e) {
    console.error('Failed to save portfolio to storage.', e);
  }
};

/**
 * Initializes the portfolio.
 * Fetches the portfolio from storage. If it doesn't exist,
 * it creates and saves a default portfolio.
 * @returns {Promise<Portfolio>} The loaded or newly created portfolio.
 */
export const initializePortfolio = async (): Promise<Portfolio> => {
  let portfolio = await getPortfolio();
  if (portfolio === null) {
    console.log('No existing portfolio found. Initializing with default portfolio.');
    portfolio = { ...defaultPortfolio }; 
    await savePortfolio(portfolio);
  } else {
    console.log('Existing portfolio loaded.');
  }
  return portfolio;
};

/**
 * Clears the portfolio from AsyncStorage.
 */
export const clearPortfolio = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PORTFOLIO_STORAGE_KEY);
    console.log('Portfolio cleared from storage.');
  } catch (e) {
    console.error('Failed to clear portfolio from storage.', e);
  }
};

/**
 * Buys stock and updates the portfolio.
 * @param symbol Stock symbol
 * @param description Stock description
 * @param quantity Number of shares to buy
 * @param price Price per share
 * @returns Promise<boolean> True if successful, false otherwise.
 */
export const buyStock = async (symbol: string, description: string, quantity: number, price: number): Promise<boolean> => {
  if (quantity <= 0 || price <= 0) {
    console.warn('Buy stock failed: Quantity and price must be positive.', { symbol, quantity, price });
    return false;
  }

  const portfolio = await initializePortfolio(); // Ensure portfolio is loaded/initialized
  const totalCost = quantity * price;

  if (portfolio.cash < totalCost) {
    console.warn('Buy stock failed: Insufficient cash.', { symbol, quantity, price, currentCash: portfolio.cash, totalCost });
    return false;
  }

  portfolio.cash -= totalCost;
  const existingHoldingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);

  if (existingHoldingIndex > -1) {
    // Stock already exists, update quantity and average purchase price
    const existingHolding = portfolio.holdings[existingHoldingIndex];
    const newTotalQuantity = existingHolding.quantity + quantity;
    const newTotalCost = (existingHolding.quantity * existingHolding.purchasePrice) + totalCost;
    existingHolding.purchasePrice = newTotalCost / newTotalQuantity;
    existingHolding.quantity = newTotalQuantity;
    console.log(`Updated holding for ${symbol}: Quantity ${newTotalQuantity}, Avg Price ${existingHolding.purchasePrice}`);
  } else {
    // New stock holding
    portfolio.holdings.push({
      symbol,
      description,
      quantity,
      purchasePrice: price,
    });
    console.log(`Added new holding: ${symbol}, Quantity: ${quantity}, Price: ${price}`);
  }

  await savePortfolio(portfolio);
  return true;
};

/**
 * Sells stock and updates the portfolio.
 * @param symbol Stock symbol
 * @param quantity Number of shares to sell
 * @param price Price per share
 * @returns Promise<boolean> True if successful, false otherwise.
 */
export const sellStock = async (symbol: string, quantity: number, price: number): Promise<boolean> => {
  if (quantity <= 0 || price <= 0) {
    console.warn('Sell stock failed: Quantity and price must be positive.', { symbol, quantity, price });
    return false;
  }

  const portfolio = await initializePortfolio();
  const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);

  if (holdingIndex === -1) {
    console.warn('Sell stock failed: Stock not found in portfolio.', { symbol });
    return false;
  }

  const holding = portfolio.holdings[holdingIndex];
  if (holding.quantity < quantity) {
    console.warn('Sell stock failed: Insufficient quantity to sell.', { symbol, currentQuantity: holding.quantity, sellQuantity: quantity });
    return false;
  }

  const totalSaleValue = quantity * price;
  portfolio.cash += totalSaleValue;

  if (holding.quantity === quantity) {
    // Selling all shares, remove the holding
    portfolio.holdings.splice(holdingIndex, 1);
    console.log(`Sold all shares of ${symbol}. Holding removed.`);
  } else {
    // Selling some shares, reduce quantity
    holding.quantity -= quantity;
    console.log(`Sold ${quantity} shares of ${symbol}. Remaining quantity: ${holding.quantity}`);
  }

  await savePortfolio(portfolio);
  return true;
};
