import YahooFinance from "yahoo-finance2";
import type { Quote } from "yahoo-finance2/modules/quote";
import type { StockPosition } from "@prisma/client";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/** How long a fetched price is reused before asking Yahoo again. */
const PRICE_TTL_MS = 60_000;

// Only successful lookups are cached, so a failed ticker is retried on the next request.
const priceCache = new Map<string, { price: number; expiresAt: number }>();

export type PricedPosition = StockPosition & {
  currentPrice: number | null;
  totalValue: number;
  error?: boolean;
};

function priceOf(quote: Quote | undefined): number | null {
  return quote?.regularMarketPrice ?? quote?.regularMarketPreviousClose ?? null;
}

async function fetchOne(ticker: string): Promise<number | null> {
  try {
    return priceOf(await yahooFinance.quote(ticker));
  } catch (err) {
    console.error(`Failed to fetch quote for ${ticker}:`, err);
    return null;
  }
}

/** Fetches all tickers in one request; falls back to one request per ticker if the batch fails. */
async function fetchMany(tickers: string[]): Promise<Map<string, number | null>> {
  try {
    const quotes = await yahooFinance.quote(tickers, { return: "map" });
    return new Map(tickers.map((t) => [t, priceOf(quotes.get(t))]));
  } catch (err) {
    // One bad symbol (e.g. a schema validation error) fails the whole batch.
    console.error(`Batch quote failed for ${tickers.join(",")}, retrying individually:`, err);
    const prices = await Promise.all(tickers.map(fetchOne));
    return new Map(tickers.map((t, i) => [t, prices[i]]));
  }
}

/** Latest prices for tickers, or null for each one Yahoo doesn't know / fails on. Never throws. */
export async function getQuotePrices(tickers: string[]): Promise<Map<string, number | null>> {
  const now = Date.now();
  const result = new Map<string, number | null>();
  const missing: string[] = [];

  for (const ticker of new Set(tickers)) {
    const cached = priceCache.get(ticker);
    if (cached && cached.expiresAt > now) result.set(ticker, cached.price);
    else missing.push(ticker);
  }

  if (missing.length > 0) {
    const fetched = missing.length === 1
      ? new Map([[missing[0], await fetchOne(missing[0])]])
      : await fetchMany(missing);
    for (const [ticker, price] of fetched) {
      result.set(ticker, price);
      if (price != null) priceCache.set(ticker, { price, expiresAt: now + PRICE_TTL_MS });
    }
  }

  return result;
}

/** Latest price for a ticker, or null if Yahoo doesn't know it / the request fails. */
export async function getQuotePrice(ticker: string): Promise<number | null> {
  return (await getQuotePrices([ticker])).get(ticker) ?? null;
}

export async function getPortfolioWithPrices(
  positions: StockPosition[],
): Promise<PricedPosition[]> {
  const prices = await getQuotePrices(positions.map((p) => p.ticker));
  return positions.map((position) => {
    const currentPrice = prices.get(position.ticker) ?? null;
    if (currentPrice == null) {
      return { ...position, currentPrice: null, totalValue: 0, error: true };
    }
    return { ...position, currentPrice, totalValue: currentPrice * position.shares };
  });
}
