import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStockForm } from "@/components/forms/add-stock-form";
import { PortfolioAllocationChart } from "@/components/charts/portfolio-allocation-chart";
import { PortfolioTable } from "@/components/tables/portfolio-table";
import { prisma } from "@/lib/prisma";
import { getPortfolioWithPrices } from "@/lib/stock-api";

export const metadata: Metadata = { title: "Portfolio · WealthSync" };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const positions = await prisma.stockPosition.findMany({ orderBy: { ticker: "asc" } });
  const priced = await getPortfolioWithPrices(positions);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add stock</CardTitle>
            </CardHeader>
            <CardContent>
              <AddStockForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioAllocationChart positions={priced} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioTable positions={priced} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
