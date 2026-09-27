"use client";

import { Cell, Pie, PieChart, Tooltip, type TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/utils";

export type DonutDatum = { name: string; value: number };

// Fixed categorical order (see --series-* in globals.css). Never cycled:
// anything past MAX_SLICES - 1 is folded into "Other".
const SERIES = [1, 2, 3, 4, 5, 6].map((n) => `var(--series-${n})`);
const MAX_SLICES = SERIES.length;
const OTHER_COLOR = "var(--muted-foreground)";

type Slice = DonutDatum & { color: string; share: number };

function toSlices(data: DonutDatum[]): Slice[] {
  const sorted = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, d) => sum + d.value, 0);
  const head = sorted.length > MAX_SLICES ? sorted.slice(0, MAX_SLICES - 1) : sorted;
  const rest = sorted.slice(head.length);

  const slices = head.map((d, i) => ({ ...d, color: SERIES[i], share: d.value / total }));
  if (rest.length) {
    const value = rest.reduce((sum, d) => sum + d.value, 0);
    slices.push({ name: "Other", value, color: OTHER_COLOR, share: value / total });
  }
  return slices;
}

const percent = (share: number) => `${(share * 100).toFixed(1)}%`;

function SliceTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as Slice | undefined;
  if (!active || !slice) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-2 font-medium text-popover-foreground">
        <span className="size-2.5 rounded-sm" style={{ background: slice.color }} />
        {slice.name}
      </div>
      <div className="mt-1 text-muted-foreground tabular-nums">
        {formatCurrency(slice.value)} · {percent(slice.share)}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  label,
  emptyMessage,
}: {
  data: DonutDatum[];
  /** Accessible name for the chart, e.g. "Portfolio allocation". */
  label: string;
  emptyMessage: string;
}) {
  const slices = toSlices(data);

  if (slices.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="@container">
      <div className="flex flex-col items-center gap-6 @md:flex-row">
        <div role="img" aria-label={label} className="shrink-0">
          <PieChart width={180} height={180}>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={86}
              startAngle={90}
              endAngle={-270}
              stroke="var(--card)"
              // 2px surface gap between slices; a lone slice needs no seam.
              strokeWidth={slices.length > 1 ? 2 : 0}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={SliceTooltip} />
          </PieChart>
        </div>

        {/* Legend doubles as the table view: every slice's value is always visible. */}
        <ul className="grid w-full gap-2 text-sm">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto tabular-nums">{formatCurrency(s.value)}</span>
              <span className="w-14 text-right text-muted-foreground tabular-nums">
                {percent(s.share)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
