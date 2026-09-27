import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { deleteStock } from "@/lib/actions";
import type { PricedPosition } from "@/lib/stock-api";
import { formatCurrency } from "@/lib/utils";

const sharesFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });

export function PortfolioTable({ positions }: { positions: PricedPosition[] }) {
  if (positions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No holdings yet. Add a stock to start tracking your portfolio.
      </p>
    );
  }

  const total = positions.reduce((sum, p) => sum + p.totalValue, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Allocation</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.ticker}</TableCell>
            <TableCell className="text-right tabular-nums">
              {sharesFormatter.format(p.shares)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {p.currentPrice == null ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-amber-600" />
                  Unavailable
                </span>
              ) : (
                formatCurrency(p.currentPrice)
              )}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {p.currentPrice == null ? "—" : formatCurrency(p.totalValue)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {total > 0 ? `${((p.totalValue / total) * 100).toFixed(1)}%` : "—"}
            </TableCell>
            <TableCell>
              <DeleteButton action={deleteStock.bind(null, p.id)} label={p.ticker} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right tabular-nums">{formatCurrency(total)}</TableCell>
          <TableCell colSpan={2} />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
