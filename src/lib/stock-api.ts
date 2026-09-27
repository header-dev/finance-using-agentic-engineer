import YahooFinance from "yahoo-finance2";
import type { StockPosition } from "@prisma/client";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export type PricedPosition = StockPosition & {
  currentPrice: number | null;
  totalValue: number;
  error?: boolean;
};

/** Latest price for a ticker, or null if Yahoo doesn't know it / the request fails. */
export async function getQuotePrice(ticker: string): Promise<number | null> {
  try {
    const quote = await yahooFinance.quote(ticker);
    return quote?.regularMarketPrice ?? quote?.regularMarketPreviousClose ?? null;
  } catch (err) {
    console.error(`Failed to fetch quote for ${ticker}:`, err);
    return null;
  }
}

export async function getPortfolioWithPrices(
  positions: StockPosition[],
): Promise<PricedPosition[]> {
  return Promise.all(
    positions.map(async (position) => {
      const currentPrice = await getQuotePrice(position.ticker);
      if (currentPrice == null) {
        return { ...position, currentPrice: null, totalValue: 0, error: true };
      }
      return { ...position, currentPrice, totalValue: currentPrice * position.shares };
    }),
  );
}
