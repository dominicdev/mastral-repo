import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const COIN_IDS: Record<string, string> = {
  btc: 'bitcoin', bitcoin: 'bitcoin',
  eth: 'ethereum', ethereum: 'ethereum',
  sol: 'solana', solana: 'solana',
  bnb: 'binancecoin', binance: 'binancecoin',
  xrp: 'ripple', ripple: 'ripple',
  ada: 'cardano', cardano: 'cardano',
  doge: 'dogecoin', dogecoin: 'dogecoin',
  avax: 'avalanche-2', avalanche: 'avalanche-2',
  dot: 'polkadot', polkadot: 'polkadot',
  link: 'chainlink', chainlink: 'chainlink',
  matic: 'matic-network', polygon: 'matic-network',
  ltc: 'litecoin', litecoin: 'litecoin',
  shib: 'shiba-inu', shiba: 'shiba-inu',
  uni: 'uniswap', uniswap: 'uniswap',
  atom: 'cosmos', cosmos: 'cosmos',
  near: 'near',
  trx: 'tron', tron: 'tron',
  ton: 'the-open-network',
  pepe: 'pepe',
};

function resolveCoinId(input: string): string {
  return COIN_IDS[input.toLowerCase().trim()] ?? input.toLowerCase().trim();
}

function fmt(n: number, decimals = 2): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

// ─── Tool 1: Current price + market data ──────────────────────────────────────

export const getCryptoDataTool = createTool({
  id: 'get-crypto-data',
  description: 'Fetches real-time price, market cap, volume, 24h and 7d change for a cryptocurrency.',
  inputSchema: z.object({
    coin: z.string().describe('Coin name or symbol, e.g. bitcoin, BTC, ethereum, ETH'),
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    price: z.number(),
    marketCap: z.number(),
    volume24h: z.number(),
    change24h: z.number(),
    changePct24h: z.number(),
    changePct7d: z.number(),
    high24h: z.number(),
    low24h: z.number(),
    ath: z.number(),
    athChangePct: z.number(),
    circulatingSupply: z.number(),
  }),
  execute: async (inputData) => {
    const id = resolveCoinId(inputData.coin);
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}&price_change_percentage=7d`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'CryptoBot/1.0' },
    });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.statusText}`);

    const data = await res.json();
    if (!data.length) throw new Error(`Coin not found: ${inputData.coin}`);

    const c = data[0];
    return {
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      change24h: fmt(c.price_change_24h ?? 0),
      changePct24h: fmt(c.price_change_percentage_24h ?? 0),
      changePct7d: fmt(c.price_change_percentage_7d_in_currency ?? 0),
      high24h: c.high_24h,
      low24h: c.low_24h,
      ath: c.ath,
      athChangePct: fmt(c.ath_change_percentage ?? 0),
      circulatingSupply: c.circulating_supply,
    };
  },
});

// ─── Tool 2: Price history for trend analysis ─────────────────────────────────

export const getCryptoPriceHistoryTool = createTool({
  id: 'get-crypto-price-history',
  description:
    'Fetches the last 7 days of daily closing prices for a coin. Used to identify momentum, support/resistance, and trend direction for 24h outlook.',
  inputSchema: z.object({
    coin: z.string().describe('Coin name or symbol'),
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    prices: z.array(
      z.object({
        date: z.string(),
        price: z.number(),
        changePct: z.number(),
      })
    ),
    trendSummary: z.string(),
    avgVolume7d: z.number(),
    volatility7d: z.number(),
  }),
  execute: async (inputData) => {
    const id = resolveCoinId(inputData.coin);
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`;

    const res = await fetch(url, { headers: { 'User-Agent': 'CryptoBot/1.0' } });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.statusText}`);

    const data = await res.json();
    const rawPrices: [number, number][] = data.prices ?? [];
    const rawVolumes: [number, number][] = data.total_volumes ?? [];

    const prices = rawPrices.map(([ts, price], i) => {
      const prev = i > 0 ? rawPrices[i - 1][1] : price;
      return {
        date: new Date(ts).toISOString().split('T')[0],
        price: fmt(price),
        changePct: fmt(((price - prev) / prev) * 100),
      };
    });

    const avgVolume7d = rawVolumes.length
      ? Math.round(rawVolumes.reduce((s, [, v]) => s + v, 0) / rawVolumes.length)
      : 0;

    // Simple volatility: std dev of daily % changes
    const changes = prices.slice(1).map(p => p.changePct);
    const mean = changes.reduce((s, c) => s + c, 0) / (changes.length || 1);
    const variance = changes.reduce((s, c) => s + (c - mean) ** 2, 0) / (changes.length || 1);
    const volatility7d = fmt(Math.sqrt(variance));

    // Trend: up if last price > first price
    const first = prices[0]?.price ?? 0;
    const last = prices[prices.length - 1]?.price ?? 0;
    const overallChange = first ? fmt(((last - first) / first) * 100) : 0;
    const trendSummary =
      overallChange > 5
        ? `Strong uptrend (+${overallChange}% over 7d)`
        : overallChange > 1
          ? `Mild uptrend (+${overallChange}% over 7d)`
          : overallChange < -5
            ? `Strong downtrend (${overallChange}% over 7d)`
            : overallChange < -1
              ? `Mild downtrend (${overallChange}% over 7d)`
              : `Sideways / consolidating (${overallChange}% over 7d)`;

    // Resolve name from id
    const nameMap: Record<string, string> = {
      bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana',
      binancecoin: 'BNB', ripple: 'XRP', cardano: 'Cardano',
      dogecoin: 'Dogecoin',
    };

    return {
      id,
      name: nameMap[id] ?? id,
      prices,
      trendSummary,
      avgVolume7d,
      volatility7d,
    };
  },
});
