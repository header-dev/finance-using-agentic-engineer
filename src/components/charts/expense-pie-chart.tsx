import { DonutChart, type DonutDatum } from "@/components/charts/donut-chart";

export function ExpensePieChart({ data }: { data: DonutDatum[] }) {
  return (
    <DonutChart
      label="Expenses by category"
      emptyMessage="No expenses yet. Add some on the Transactions page."
      data={data}
    />
  );
}
