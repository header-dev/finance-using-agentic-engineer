import { Landmark, LineChart, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensePieChart } from "@/components/charts/expense-pie-chart";
import { PortfolioAllocationChart } from "@/components/charts/portfolio-allocation-chart";
import { prisma } from "@/lib/prisma";
import { getPortfolioWithPrices } from "@/lib/stock-api";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  highlight,
}: {
  title: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "sm:col-span-2 lg:col-span-1")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="grid gap-1">
        <div
          className={cn(
            "font-semibold tracking-tight tabular-nums",
            highlight ? "text-4xl" : "text-2xl",
          )}
        >
          {formatCurrency(value)}
        </div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [totalsByType, expensesByCategory, positions] = await Promise.all([
    prisma.transaction.groupBy({ by: ["type"], _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.stockPosition.findMany({ orderBy: { ticker: "asc" } }),
  ]);
  const portfolio = await getPortfolioWithPrices(positions);

  const sumFor = (type: string) =>
    totalsByType.find((t) => t.type === type)?._sum.amount ?? 0;
  const income = sumFor("INCOME");
  const expenses = sumFor("EXPENSE");
  const cash = income - expenses;
  const investments = portfolio.reduce((sum, p) => sum + p.totalValue, 0);
  const netWorth = cash + investments;
  const unpriced = portfolio.filter((p) => p.error).length;

  const holdingsDetail =
    `${portfolio.length} holding${portfolio.length === 1 ? "" : "s"} at live prices` +
    (unpriced ? ` · ${unpriced} unavailable, excluded` : "");

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Net Worth"
          value={netWorth}
          detail="Cash + investments"
          icon={Landmark}
          highlight
        />
        <SummaryCard
          title="Cash"
          value={cash}
          detail={`${formatCurrency(income)} income − ${formatCurrency(expenses)} expenses`}
          icon={Wallet}
        />
        <SummaryCard
          title="Investments"
          value={investments}
          detail={holdingsDetail}
          icon={LineChart}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensePieChart
              data={expensesByCategory.map((e) => ({
                name: e.category,
                value: e._sum.amount ?? 0,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Portfolio allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioAllocationChart positions={portfolio} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
