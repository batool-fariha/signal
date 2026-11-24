"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ImportButton } from "@/components/ImportDialog";
import { Badge, Card, Empty, PageHeader, Select } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { ProcessedEntry } from "@/lib/types";
import { FEEDBACK_TYPE_LABELS, type FeedbackType, type Sentiment } from "@/lib/types";

const PAGE = 25;
const sentimentTone = (s: Sentiment) => (s === "positive" ? "pos" : s === "negative" ? "neg" : "neutral");

const EMPTY: ProcessedEntry[] = [];

export default function FeedbackPage() {
  const { workspace, themes } = useWorkspace();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [source, setSource] = useState("");
  const [theme, setTheme] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const entries = workspace?.entries ?? EMPTY;
  const themeOf = useMemo(() => new Map(themes.flatMap((t) => t.entryIds.map((id) => [id, t] as const))), [themes]);
  const sources = useMemo(() => [...new Set(entries.map((e) => e.source).filter(Boolean))].sort() as string[], [entries]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries
      .filter((e) => (!needle || e.text.toLowerCase().includes(needle) || (e.customer ?? "").toLowerCase().includes(needle)) && (!type || e.analysis.feedbackType === type) && (!sentiment || e.analysis.sentiment === sentiment) && (!source || e.source === source) && (!theme || themeOf.get(e.id)?.id === theme))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.id.localeCompare(b.id));
  }, [entries, q, type, sentiment, source, theme, themeOf]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PAGE, cur * PAGE + PAGE);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  if (!workspace) return null;
  return (
    <>
      <PageHeader title="Feedback" description="Every entry with the structure extracted from it. Open a row to see what was identified." actions={<ImportButton />} />
      {entries.length === 0 ? (
        <Empty title="No feedback imported yet" action={<ImportButton variant="primary" />}>Upload a CSV or text file, paste feedback, or add the sample dataset.</Empty>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <input aria-label="Search feedback" value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder="Search text or customer" className="h-9 min-w-[180px] flex-1 rounded-md border border-linestrong bg-surface px-3 text-[13px]" />
            <Select aria-label="Filter by type" value={type} onChange={(e) => reset(setType)(e.target.value)}>
              <option value="">All types</option>
              {(Object.keys(FEEDBACK_TYPE_LABELS) as FeedbackType[]).map((t) => <option key={t} value={t}>{FEEDBACK_TYPE_LABELS[t]}</option>)}
            </Select>
            <Select aria-label="Filter by sentiment" value={sentiment} onChange={(e) => reset(setSentiment)(e.target.value)}>
              <option value="">Any sentiment</option>
              <option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option>
            </Select>
            {sources.length > 0 && (
              <Select aria-label="Filter by source" value={source} onChange={(e) => reset(setSource)(e.target.value)}>
                <option value="">All sources</option>
                {sources.map((s) => <option key={s}>{s}</option>)}
              </Select>
            )}
            <Select aria-label="Filter by theme" value={theme} onChange={(e) => reset(setTheme)(e.target.value)} className="max-w-[220px]">
              <option value="">All themes</option>
              {themes.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </Select>
          </div>

          <Card pad={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <caption className="sr-only">Feedback entries with category, sentiment and theme</caption>
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    <th scope="col" className="w-8 px-3 py-2"><span className="sr-only">Details</span></th>
                    <th scope="col" className="px-2 py-2 font-medium">Feedback</th>
                    <th scope="col" className="px-2 py-2 font-medium">Type</th>
                    <th scope="col" className="px-2 py-2 font-medium">Sentiment</th>
                    <th scope="col" className="px-2 py-2 font-medium">Theme</th>
                    <th scope="col" className="px-2 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => {
                    const isOpen = open === e.id;
                    const t = themeOf.get(e.id);
                    const a = e.analysis;
                    return (
                      <Fragment key={e.id}>
                        <tr className="border-b border-line align-top hover:bg-surface2/60">
                          <td className="px-3 py-2.5">
                            <button aria-expanded={isOpen} aria-label={isOpen ? "Hide analysis" : "Show analysis"} onClick={() => setOpen(isOpen ? null : e.id)} className="rounded p-0.5 text-muted hover:bg-surface2">
                              {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </button>
                          </td>
                          <td className="max-w-[420px] px-2 py-2.5">
                            <p className={isOpen ? "" : "line-clamp-2"}>{e.text}</p>
                            <p className="mt-1 text-xs text-muted">{[e.customer, e.source, e.segment].filter(Boolean).join(" · ") || e.id}</p>
                          </td>
                          <td className="px-2 py-2.5"><Badge>{FEEDBACK_TYPE_LABELS[a.feedbackType]}</Badge></td>
                          <td className="px-2 py-2.5"><Badge tone={sentimentTone(a.sentiment)}>{a.sentiment}</Badge></td>
                          <td className="max-w-[180px] px-2 py-2.5">{t ? <Link href={`/themes/${t.id}`} className="text-accent hover:underline">{t.title}</Link> : "–"}</td>
                          <td className="tabnum px-2 py-2.5 text-xs text-muted">{e.date ?? "–"}</td>
                        </tr>
                        {isOpen && (
                          <tr className="border-b border-line bg-surface2/50">
                            <td />
                            <td colSpan={5} className="px-2 py-3">
                              <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                                <Row k="Primary topic" v={a.topic} />
                                <Row k="Product area" v={a.productArea} />
                                <Row k="Urgency" v={a.urgency} />
                                <Row k="Topic match" v={`${Math.round(a.confidence * 100)}%`} />
                                <Row k="Customer problem (excerpt)" v={a.customerProblem ?? "None: positive feedback"} />
                                <Row k="Feature request (excerpt)" v={a.featureRequest ?? "None"} />
                                <Row k="Features mentioned" v={a.entities.length ? a.entities.join(", ") : "None found"} />
                                <Row k="Business-impact language" v={a.businessSignals.length ? a.businessSignals.join(", ") : "None"} />
                                <Row k="Rating / plan" v={[e.rating ? `${e.rating}/5` : null, e.plan].filter(Boolean).join(" · ") || "Not provided"} />
                              </dl>
                              <p className="mt-2 text-[11px] text-muted">Excerpts are copied from the entry. Everything else is an automated estimate.</p>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <p className="p-6 text-center text-sm text-muted">No entries match these filters.</p>}
          </Card>

          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>{rows.length} {rows.length === 1 ? "entry" : "entries"}{rows.length !== entries.length ? ` of ${entries.length}` : ""}</span>
            <div className="flex items-center gap-2">
              <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="rounded border border-linestrong px-2 py-1 disabled:opacity-40">Previous</button>
              <span className="tabnum">Page {cur + 1} of {pages}</span>
              <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="rounded border border-linestrong px-2 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="text-ink2">{v}</dd>
    </div>
  );
}
