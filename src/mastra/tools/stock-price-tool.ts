import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface YahooChartResponse {
  chart: {
    result: {
      meta: {
        currency: string;
        symbol: string;
        shortName: string;
        regularMarketPrice: number;
        previousClose: number | null;
        chartPreviousClose: number | null;
        regularMarketVolume: number;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
        marketCap: number | null;
        regularMarketChangePercent: number | null;
      };
    }[];
    error: null | { code: string; description: string };
  };
}

export const stockPriceTool = createTool({
  id: 'get-stock-price',
  description: 'Get real-time stock price and key metrics for a given ticker symbol',
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol, e.g. AAPL, TSLA, MSFT'),
  }),
  outputSchema: z.object({
    symbol: z.string(),
    companyName: z.string(),
    price: z.number(),
    previousClose: z.number().nullable(),
    change: z.number().nullable(),
    changePercent: z.number().nullable(),
    dayHigh: z.number(),
    dayLow: z.number(),
    volume: z.number(),
    marketCap: z.number().nullable(),
    fiftyTwoWeekHigh: z.number(),
    fiftyTwoWeekLow: z.number(),
    currency: z.string(),
  }),
  execute: async (inputData) => {
    return await getStockPrice(inputData.symbol.toUpperCase());
  },
});

const getStockPrice = async (symbol: string) => {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; StockBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stock data for ${symbol}: ${response.statusText}`);
  }

  const data = (await response.json()) as YahooChartResponse;

  if (data.chart.error) {
    throw new Error(`Yahoo Finance error: ${data.chart.error.description}`);
  }

  const meta = data.chart.result?.[0]?.meta;
  if (!meta) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }

  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? null;
  const change = prevClose != null ? Math.round((meta.regularMarketPrice - prevClose) * 100) / 100 : null;
  const changePercent = meta.regularMarketChangePercent != null
    ? Math.round(meta.regularMarketChangePercent * 100) / 100
    : (change != null && prevClose != null)
      ? Math.round((change / prevClose) * 10000) / 100
      : null;

  return {
    symbol: meta.symbol,
    companyName: meta.shortName || symbol,
    price: meta.regularMarketPrice,
    previousClose: prevClose,
    change,
    changePercent,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    marketCap: meta.marketCap ?? null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    currency: meta.currency,
  };
};
