import { DonutChart } from "@/components/charts/donut-chart";
import type { PricedPosition } from "@/lib/stock-api";

export function PortfolioAllocationChart({ positions }: { positions: PricedPosition[] }) {
  return (
    <DonutChart
      label="Portfolio allocation by ticker"
      emptyMessage="Add a stock to see your allocation."
      data={positions.map((p) => ({ name: p.ticker, value: p.totalValue }))}
    />
  );
}
