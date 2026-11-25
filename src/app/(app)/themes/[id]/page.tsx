"use client";
import { ArrowLeft, Copy, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { SentimentBar } from "@/components/charts";
import { Badge, Button, Card, LevelBadge, Meter, Notice, PageHeader, ProvenanceTag, Segmented, Select, TrendBadge } from "@/components/ui";
import { downloadText, fileSlug } from "@/lib/download";
import { briefToMarkdown } from "@/lib/engine/brief";
import { effectivePriority } from "@/lib/engine/report";
import { useWorkspace } from "@/lib/store";
import { FEEDBACK_TYPE_LABELS, THEME_STATUSES, THEME_STATUS_LABELS, type Level, type PriorityFactor, type ThemeStatus } from "@/lib/types";

function Factor({ name, f }: { name: string; f: PriorityFactor }) {
  return (
    <div className="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[150px_1fr]">
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink">{name} <span className="text-xs font-normal capitalize text-muted">{f.level}</span></div>
      <div>
        {f.level !== "unknown" && <Meter value={f.score} label={name} />}
        <p className="mt-1.5 text-xs text-muted">{f.rationale}</p>
      </div>
    </div>
  );
}

export default function ThemeDetail() {
  const { id } = useParams<{ id: string }>();
  const { workspace, themes, setStatus, setPriority, makeBrief } = useWorkspace();
  const [copied, setCopied] = useState(false);
  if (!workspace) return null;

  const theme = themes.find((t) => t.id === decodeURIComponent(id));
  if (!theme) {
    return (
      <>
        <Link href="/themes" className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-3.5" /> Themes</Link>
        <Notice tone="warn">This theme no longer exists. Themes are rebuilt from your feedback, so one can disappear when entries change.</Notice>
      </>
    );
  }

  const entries = new Map(workspace.entries.map((e) => [e.id, e]));
  const linked = theme.entryIds.map((i) => entries.get(i)).filter((e): e is NonNullable<typeof e> => Boolean(e)).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const status: ThemeStatus = workspace.statuses[theme.id] ?? "new";
  const pr = effectivePriority(theme, workspace.priorityOverrides);
  const brief = workspace.briefs[theme.id];
  const segTotal = theme.segments.reduce((a, s) => a + s.count, 0);
  const maxBucket = Math.max(1, ...theme.trend.buckets.map((b) => b.count));
  const related = theme.relatedThemeIds.map((rid) => themes.find((t) => t.id === rid)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <>
      <Link href="/themes" className="no-print mb-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-3.5" aria-hidden /> Themes</Link>
      <PageHeader
        title={theme.title}
        description={theme.description}
        actions={
          <>
            <label htmlFor="status" className="sr-only">Status</label>
            <Select id="status" value={status} onChange={(e) => setStatus(theme.id, e.target.value as ThemeStatus)}>
              {THEME_STATUSES.map((s) => <option key={s} value={s}>{THEME_STATUS_LABELS[s]}</option>)}
            </Select>
            <Button variant="primary" onClick={() => makeBrief(theme.id)}><FileText className="size-4" aria-hidden /> {brief ? "Regenerate brief" : "Generate product brief"}</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TrendBadge trend={theme.trend.label} explain={theme.trend.explanation} />
        {!theme.isPositive && <LevelBadge level={pr.level} prefix={pr.overridden ? "Your priority: " : "Suggested priority: "} />}
        <Badge tone={theme.confidence.level === "high" ? "pos" : theme.confidence.level === "medium" ? "warn" : "neg"}>Confidence: {theme.confidence.level}</Badge>
        <Badge>{theme.productArea}</Badge>
        {theme.weakEvidence && <Badge tone="warn">Thin evidence: fewer than 3 entries</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Problem statement" aside={<ProvenanceTag kind="interpretation" />}>
            <p className="text-[14px] leading-relaxed text-ink">{theme.problemStatement}</p>
          </Card>

          <Card title="Representative customer quotes" aside={<ProvenanceTag kind="observed" />}>
            <ul className="space-y-3">
              {theme.quotes.map((q) => {
                const e = entries.get(q.entryId);
                return (
                  <li key={q.entryId}>
                    <blockquote className="border-l-2 border-linestrong pl-3 text-[13px] leading-relaxed text-ink">&ldquo;{q.text}&rdquo;</blockquote>
                    <p className="mt-1 pl-3 text-xs text-muted">{[e?.customer, e?.segment, e?.source, e?.date].filter(Boolean).join(" · ") || "No details provided"} · {q.entryId}</p>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Frequency and trend" aside={<ProvenanceTag kind="observed" />}>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <span><span className="tabnum text-2xl font-semibold">{theme.count}</span> <span className="text-muted">{theme.count === 1 ? "entry" : "entries"}</span></span>
              {theme.firstSeen && <span className="text-muted">First seen <span className="tabnum text-ink2">{theme.firstSeen}</span></span>}
              {theme.lastSeen && <span className="text-muted">Latest <span className="tabnum text-ink2">{theme.lastSeen}</span></span>}
              {theme.customersAffected > 0 && <span className="text-muted"><span className="tabnum text-ink2">{theme.customersAffected}</span> customers</span>}
            </div>
            {theme.trend.buckets.length > 1 && (
              <div className="mt-4 flex h-14 items-end gap-0.5" role="img" aria-label={`Weekly mentions: ${theme.trend.buckets.map((b) => b.count).join(", ")}`}>
                {theme.trend.buckets.map((b) => (
                  <div key={b.start} title={`Week of ${b.start}: ${b.count}`} className="flex-1 rounded-sm bg-accent" style={{ height: `${Math.max(4, (b.count / maxBucket) * 100)}%`, opacity: b.count ? 1 : 0.15 }} />
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted"><span className="font-medium text-ink2">{theme.trend.label === "potential_pattern" ? "Potential pattern." : "Trend."}</span> {theme.trend.explanation}</p>
          </Card>

          <Card title="Priority assessment" aside={<ProvenanceTag kind="interpretation" />}>
            <p className="mb-1 text-[13px] text-ink2">{theme.priority.explanation}</p>
            <div className="divide-y divide-line">
              <Factor name="Frequency" f={theme.priority.frequency} />
              <Factor name="Severity" f={theme.priority.severity} />
              <Factor name="Customer impact" f={theme.priority.customerImpact} />
              <Factor name="Business relevance" f={theme.priority.businessRelevance} />
              <Factor name="Confidence" f={theme.priority.confidence} />
            </div>
            {!theme.isPositive && (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <span className="text-[13px] font-medium text-ink">Your priority</span>
                <Segmented<Level> label="Set priority" value={workspace.priorityOverrides[theme.id] ?? null} onChange={(l) => setPriority(theme.id, l)} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
                {pr.overridden && <button onClick={() => setPriority(theme.id, null)} className="text-xs text-accent hover:underline">Reset to suggestion ({theme.priority.suggested})</button>}
              </div>
            )}
          </Card>

          <Card title={`All linked feedback (${linked.length})`} pad={false} aside={<ProvenanceTag kind="observed" />}>
            <ul className="divide-y divide-line">
              {linked.map((e) => (
                <li key={e.id} className="px-4 py-3">
                  <p className="text-[13px] text-ink">{e.text}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span>{[e.customer, e.segment, e.source, e.date].filter(Boolean).join(" · ") || e.id}</span>
                    <Badge>{FEEDBACK_TYPE_LABELS[e.analysis.feedbackType]}</Badge>
                    <Badge tone={e.analysis.sentiment === "positive" ? "pos" : e.analysis.sentiment === "negative" ? "neg" : "neutral"}>{e.analysis.sentiment}</Badge>
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Sentiment"><SentimentBar {...theme.sentiment} /></Card>
          <Card title="Affected customer segments" aside={<ProvenanceTag kind="observed" />}>
            {theme.segments.length === 0 ? <p className="text-[13px] text-muted">No segment data was imported, so this cannot be shown.</p> : (
              <ul className="space-y-2.5">
                {theme.segments.map((s) => (
                  <li key={s.name}>
                    <div className="flex justify-between text-[13px]"><span>{s.name}</span><span className="tabnum text-muted">{s.count} ({Math.round((s.count / segTotal) * 100)}%)</span></div>
                    <Meter value={s.count / segTotal} label={s.name} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Suggested product opportunity" aside={<ProvenanceTag kind="suggestion" />}>
            <p className="text-[13px] leading-relaxed text-ink">{theme.opportunity}</p>
          </Card>
          <Card title="Recommended next research question" aside={<ProvenanceTag kind="suggestion" />}>
            <p className="text-[13px] leading-relaxed text-ink">{theme.nextQuestion}</p>
          </Card>
          {related.length > 0 && (
            <Card title="Related themes">
              <ul className="space-y-1.5 text-[13px]">
                {related.map((r) => <li key={r.id}><Link href={`/themes/${r.id}`} className="text-accent hover:underline">{r.title}</Link> <span className="text-xs text-muted">({r.count})</span></li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {brief && (
        <section id="brief" aria-labelledby="brief-title" className="mt-6 rounded-lg border border-linestrong bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <h2 id="brief-title" className="text-[15px] font-semibold">{brief.title}</h2>
              <p className="text-xs text-muted">Draft for PM review, not an approved product requirement. Generated {brief.generatedAt.slice(0, 10)}.</p>
            </div>
            <div className="no-print flex gap-2">
              <Button size="sm" onClick={async () => { await navigator.clipboard.writeText(briefToMarkdown(brief)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy className="size-3.5" aria-hidden /> {copied ? "Copied" : "Copy"}</Button>
              <Button size="sm" onClick={() => downloadText(`brief-${fileSlug(theme.title)}.md`, briefToMarkdown(brief), "text/markdown")}><Download className="size-3.5" aria-hidden /> Markdown</Button>
              <Button size="sm" onClick={() => window.print()}>Print</Button>
            </div>
          </header>
          <div className="space-y-5 p-4">
            {brief.sections.map((s) => (
              <div key={s.heading}>
                <div className="flex items-center gap-2"><h3 className="text-[13px] font-semibold">{s.heading}</h3><ProvenanceTag kind={s.provenance} /></div>
                <div className="mt-1.5 space-y-1 text-[13px] leading-relaxed text-ink2">
                  {s.lines.map((l, i) => l.startsWith("- ") ? <p key={i} className="pl-3 -indent-3">&bull; {l.slice(2)}</p> : <p key={i}>{l}</p>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
