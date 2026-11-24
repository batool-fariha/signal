"use client";
import { useSyncExternalStore } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// False on the server and during hydration, true afterwards: charts need real element sizes.
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const axis = { fontSize: 11, fill: "var(--muted)" } as const;
const tip = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, fontSize: 12, color: "var(--ink)", boxShadow: "none" },
  labelStyle: { color: "var(--muted)" },
  cursor: { fill: "var(--surface-2)" },
};

export function VolumeChart({ data }: { data: { start: string; total: number; negative: number }[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-56" />;
  if (data.length < 2) return <p className="grid h-56 place-items-center text-sm text-muted">Not enough dated feedback to chart volume over time.</p>;
  return (
    <div className="h-56" role="img" aria-label={`Weekly feedback volume across ${data.length} weeks, with negative entries shown separately`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="start" tick={axis} tickLine={false} axisLine={false} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tip} labelFormatter={(d) => `Week of ${d}`} />
          <Area type="linear" dataKey="total" name="All feedback" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={1.75} />
          <Area type="linear" dataKey="negative" name="Negative" stroke="var(--neg)" fill="var(--neg)" fillOpacity={0.06} strokeWidth={1.25} strokeDasharray="4 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars as plain HTML: labels never truncate and the values are readable as a list. */
export function HBar({ data, label, color = "var(--chart-1)" }: { data: { name: string; value: number }[]; label: string; color?: string }) {
  if (data.length === 0) return <p className="text-sm text-muted">No data.</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul aria-label={label} className="space-y-2.5">
      {data.map((d) => (
        <li key={d.name} className="grid grid-cols-[minmax(0,44%)_1fr_auto] items-center gap-3 text-[13px]">
          <span className="leading-snug text-ink2">{d.name}</span>
          <span aria-hidden className="h-2 rounded-sm bg-surface2">
            <span className="block h-full rounded-sm" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </span>
          <span className="tabnum w-6 text-right text-muted">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = Math.max(positive + neutral + negative, 1);
  const parts = [
    { k: "Positive", v: positive, c: "var(--pos)" },
    { k: "Neutral", v: neutral, c: "var(--chart-3)" },
    { k: "Negative", v: negative, c: "var(--neg)" },
  ];
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface2" role="img" aria-label={parts.map((p) => `${p.k} ${p.v}`).join(", ")}>
        {parts.map((p) => (
          <div key={p.k} style={{ width: `${(p.v / total) * 100}%`, background: p.c }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink2">
        {parts.map((p) => (
          <li key={p.k} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full" style={{ background: p.c }} />
            {p.k} <span className="tabnum text-muted">{p.v} ({Math.round((p.v / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
