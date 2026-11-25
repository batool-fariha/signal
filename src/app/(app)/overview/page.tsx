"use client";
import Link from "next/link";
import { useMemo } from "react";
import { HBar, SentimentBar, VolumeChart } from "@/components/charts";
import { ImportButton } from "@/components/ImportDialog";
import { Badge, Card, Empty, PageHeader, Stat, TrendBadge } from "@/components/ui";
import { effectivePriority } from "@/lib/engine/report";
import { timeAxis, weeklyCounts } from "@/lib/engine/trends";
import { useWorkspace } from "@/lib/store";
import type { ProcessedEntry } from "@/lib/types";
import { FEEDBACK_TYPE_LABELS, type SignalKind } from "@/lib/types";

const KIND_LABEL: Record<SignalKind, string> = {
  new_theme: "New theme",
  growing_problem: "Growing problem",
  negative_spike: "Negative spike",
  new_feature_requests: "Feature requests",
  sentiment_shift: "Sentiment",
};

function tally<T>(items: T[], key: (t: T) => string | undefined, limit = 8) {
  const m = new Map<string, number>();
  for (const i of items) {
    const k = key(i);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, limit);
}

const EMPTY: ProcessedEntry[] = [];

export default function Overview() {
  const { workspace, themes, signals } = useWorkspace();
  const entries = workspace?.entries ?? EMPTY;

  const data = useMemo(() => {
    const axis = timeAxis(entries);
    const all = axis ? weeklyCounts(entries, axis) : [];
    const neg = axis ? weeklyCounts(entries.filter((e) => e.analysis.sentiment === "negative"), axis) : [];
    return {
      volume: all.map((b, i) => ({ start: b.start, total: b.count, negative: neg[i].count })),
      types: tally(entries, (e) => FEEDBACK_TYPE_LABELS[e.analysis.feedbackType]),
      sources: tally(entries, (e) => e.source),
      segments: tally(entries, (e) => e.segment),
      sentiment: {
        positive: entries.filter((e) => e.analysis.sentiment === "positive").length,
        neutral: entries.filter((e) => e.analysis.sentiment === "neutral").length,
        negative: entries.filter((e) => e.analysis.sentiment === "negative").length,
      },
    };
  }, [entries]);

  if (!workspace) return null;
  if (entries.length === 0) {
    return (
      <>
        <PageHeader title="Overview" />
        <Empty title="No feedback yet" action={<ImportButton variant="primary" />}>
          Import a CSV, upload a text file, paste feedback, or load the sample dataset to see themes, trends and evidence here.
        </Empty>
      </>
    );
  }

  const problems = themes.filter((t) => !t.isPositive);
  const open = problems.filter((t) => !["addressed", "dismissed"].includes(workspace.statuses[t.id] ?? "new"));
  const high = open.filter((t) => effectivePriority(t, workspace.priorityOverrides).level === "high");
  const topThemes = problems.slice().sort((a, b) => b.count - a.count).slice(0, 7).map((t) => ({ name: t.title, value: t.count }));
  const unseen = signals.filter((s) => !workspace.seen.includes(s.id)).length;

  return (
    <>
      <PageHeader title="Overview" description={`What ${workspace.name} customers are telling you, grouped by evidence rather than volume alone.`} actions={<ImportButton />} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Feedback entries" value={entries.length} hint={`${new Set(entries.map((e) => e.source).filter(Boolean)).size} sources`} />
        <Stat label="Unique themes" value={themes.length} hint={`${problems.length} about problems or requests`} />
        <Stat label="Unresolved product signals" value={open.length} hint="Problem themes not yet addressed or dismissed" />
        <Stat label="High-priority themes" value={high.length} hint="Suggested or set by you, still open" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Feedback volume over time" className="lg:col-span-2">
          <VolumeChart data={data.volume} />
        </Card>
        <Card title="Sentiment">
          <SentimentBar {...data.sentiment} />
          <p className="mt-4 text-xs text-muted">Sentiment is estimated from wording and ratings. Negative tone does not by itself mean a problem matters most.</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Top recurring themes" aside={<Link href="/themes" className="text-xs text-accent hover:underline">All themes</Link>}>
          <HBar data={topThemes} label="Entries per theme" />
        </Card>
        <Card title="Feedback by category">
          <HBar data={data.types} label="Entries by feedback type" color="var(--chart-2)" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Feedback by source">
          <HBar data={data.sources} label="Entries by source" color="var(--chart-2)" />
        </Card>
        <Card title="Customer segments">
          {data.segments.length === 0 ? <p className="text-sm text-muted">The imported data has no segment column. Map one to see this breakdown.</p> : <HBar data={data.segments} label="Entries by customer segment" color="var(--chart-2)" />}
        </Card>
      </div>

      <Card title="Signal feed" className="mt-4" aside={unseen > 0 ? <Badge tone="accent">{unseen} new</Badge> : undefined} pad={false}>
        {signals.length === 0 ? (
          <p className="p-4 text-sm text-muted">No signals yet. Signals need dated feedback over several weeks; until then Signal will not call anything a trend.</p>
        ) : (
          <ul className="divide-y divide-line">
            {signals.slice(0, 10).map((s) => (
              <li key={s.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3">
                <time dateTime={s.date} className="tabnum w-20 shrink-0 pt-0.5 text-xs text-muted">{s.date}</time>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.themeId ? <Link href={`/themes/${s.themeId}`} className="text-[13px] font-medium text-ink hover:underline">{s.title}</Link> : <span className="text-[13px] font-medium text-ink">{s.title}</span>}
                    <Badge>{KIND_LABEL[s.kind]}</Badge>
                    <Badge tone={s.evidenceLevel === "trend" ? "accent" : "warn"} title={s.evidenceLevel === "trend" ? "Enough dated evidence to call this a trend" : "Not enough time-based evidence to call this a trend"}>
                      {s.evidenceLevel === "trend" ? "Trend" : "Potential pattern"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{s.detail} <span className="text-ink2">Based on {s.entryIds.length} {s.entryIds.length === 1 ? "entry" : "entries"}.</span></p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {high.length > 0 && (
        <Card title="High-priority themes to review" className="mt-4" pad={false}>
          <ul className="divide-y divide-line">
            {high.slice(0, 5).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={`/themes/${t.id}`} className="text-[13px] font-medium text-ink hover:underline">{t.title}</Link>
                <span className="flex items-center gap-2 text-xs text-muted">{t.count} entries <TrendBadge trend={t.trend.label} explain={t.trend.explanation} /></span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
