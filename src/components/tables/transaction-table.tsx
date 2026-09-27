import { format } from "date-fns";
import type { Transaction } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { deleteTransaction } from "@/lib/actions";
import { cn, formatCurrency } from "@/lib/utils";

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No transactions yet. Add your first one to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => {
          const isIncome = t.type === "INCOME";
          return (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap">
                {format(t.date, "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <Badge variant={isIncome ? "default" : "secondary"}>
                  {isIncome ? "Income" : "Expense"}
                </Badge>
              </TableCell>
              <TableCell>{t.category}</TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">
                {t.description ?? "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                )}
              >
                {isIncome ? "+" : "−"}
                {formatCurrency(t.amount)}
              </TableCell>
              <TableCell>
                <DeleteButton
                  action={deleteTransaction.bind(null, t.id)}
                  label={`${t.category} ${isIncome ? "income" : "expense"}`}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
