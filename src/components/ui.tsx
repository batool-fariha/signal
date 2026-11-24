"use client";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { Level, Provenance, TrendLabel } from "@/lib/types";

export function Card({ title, aside, children, className, pad = true }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={clsx("rounded-lg border border-line bg-surface shadow-[var(--shadow)]", className)}>
      {(title || aside) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-[13px] font-medium text-ink">{title}</h2>
          {aside}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  neutral: "bg-surface2 text-ink2 border-line",
  accent: "bg-accentsoft text-accent border-transparent",
  pos: "bg-possoft text-pos border-transparent",
  neg: "bg-negsoft text-neg border-transparent",
  warn: "bg-warnsoft text-warn border-transparent",
};
export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium leading-4", TONES[tone])}>
      {children}
    </span>
  );
}

export const levelTone = (l: Level | "unknown"): Tone => (l === "high" ? "neg" : l === "medium" ? "warn" : l === "low" ? "neutral" : "neutral");
export const LevelBadge = ({ level, prefix }: { level: Level | "unknown"; prefix?: string }) => (
  <Badge tone={levelTone(level)}>
    {prefix}
    {level === "unknown" ? "unknown" : level}
  </Badge>
);

const TREND_TEXT: Record<TrendLabel, { label: string; tone: Tone }> = {
  emerging: { label: "Emerging", tone: "accent" },
  growing: { label: "Growing", tone: "accent" },
  steady: { label: "Steady", tone: "neutral" },
  declining: { label: "Declining", tone: "pos" },
  potential_pattern: { label: "Potential pattern", tone: "warn" },
};
export const TrendBadge = ({ trend, explain }: { trend: TrendLabel; explain?: string }) => (
  <Badge tone={TREND_TEXT[trend].tone} title={explain}>
    {TREND_TEXT[trend].label}
  </Badge>
);

const PROV: Record<Provenance, { label: string; tone: Tone; help: string }> = {
  observed: { label: "Observed", tone: "pos", help: "Taken directly from customer feedback" },
  interpretation: { label: "AI interpretation", tone: "warn", help: "Derived by the analysis engine; check it against the evidence" },
  suggestion: { label: "Suggested action", tone: "accent", help: "A proposal for a product manager to evaluate" },
};
export const ProvenanceTag = ({ kind }: { kind: Provenance }) => (
  <Badge tone={PROV[kind].tone} title={PROV[kind].help}>
    {PROV[kind].label}
  </Badge>
);

export function Button({ variant = "secondary", size = "md", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3 text-[13px]",
        variant === "primary" && "border-ink bg-ink text-bg hover:opacity-90",
        variant === "secondary" && "border-line-strong border-linestrong bg-surface text-ink hover:bg-surface2",
        variant === "ghost" && "border-transparent text-ink2 hover:bg-surface2",
        variant === "danger" && "border-neg/40 bg-surface text-neg hover:bg-negsoft",
        className,
      )}
    />
  );
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={clsx("h-9 rounded-md border border-linestrong bg-surface px-2 text-[13px] text-ink", className)} />;
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T | null; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-md border border-linestrong bg-surface">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={clsx("h-8 px-3 text-xs font-medium transition-colors", value === o.value ? "bg-ink text-bg" : "text-ink2 hover:bg-surface2")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className="text-xs text-muted">{label}</div>
      <div className="tabnum mt-1 text-3xl font-semibold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-linestrong px-6 py-12 text-center">
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
      {label}
    </div>
  );
}

export function Notice({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <div role={tone === "neg" ? "alert" : "status"} className={clsx("rounded-md border px-3 py-2 text-[13px]", TONES[tone])}>{children}</div>;
}

export function Meter({ value, tone = "accent", label }: { value: number; tone?: "accent" | "neg"; label: string }) {
  const w = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="img" aria-label={`${label}: ${w}%`} className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
      <div className={clsx("h-full rounded-full", tone === "neg" ? "bg-neg" : "bg-accent")} style={{ width: `${w}%` }} />
    </div>
  );
}
