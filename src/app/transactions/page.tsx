import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransactionTable } from "@/components/tables/transaction-table";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Transactions · WealthSync" };
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTable transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
