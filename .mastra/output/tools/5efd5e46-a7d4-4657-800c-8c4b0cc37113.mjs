import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const stockPriceTool = createTool({
  id: "get-stock-price",
  description: "Get real-time stock price and key metrics for a given ticker symbol",
  inputSchema: z.object({
    symbol: z.string().describe("Stock ticker symbol, e.g. AAPL, TSLA, MSFT")
  }),
  outputSchema: z.object({
    symbol: z.string(),
    companyName: z.string(),
    price: z.number(),
    previousClose: z.number(),
    change: z.number(),
    changePercent: z.number(),
    dayHigh: z.number(),
    dayLow: z.number(),
    volume: z.number(),
    marketCap: z.number(),
    fiftyTwoWeekHigh: z.number(),
    fiftyTwoWeekLow: z.number(),
    currency: z.string()
  }),
  execute: async (inputData) => {
    return await getStockPrice(inputData.symbol.toUpperCase());
  }
});
const getStockPrice = async (symbol) => {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; StockBot/1.0)"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch stock data for ${symbol}: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.chart.error) {
    throw new Error(`Yahoo Finance error: ${data.chart.error.description}`);
  }
  const meta = data.chart.result?.[0]?.meta;
  if (!meta) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }
  const change = meta.regularMarketPrice - meta.previousClose;
  const changePercent = meta.regularMarketChangePercent ?? change / meta.previousClose * 100;
  return {
    symbol: meta.symbol,
    companyName: meta.shortName || symbol,
    price: meta.regularMarketPrice,
    previousClose: meta.previousClose,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    marketCap: meta.marketCap,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    currency: meta.currency
  };
};

export { stockPriceTool };
