/**
 * Time-based assessment. A theme is only called "emerging", "growing" or "declining" when
 * there is enough dated evidence; otherwise it is labelled a "potential pattern".
 */
import type { ProcessedEntry, SignalItem, Theme, TrendAssessment } from "../types";
import { round } from "./text";

const DAY = 86400000;
const toMs = (iso: string) => Date.parse(iso + "T00:00:00Z");
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export interface TimeAxis {
  startMs: number;
  endMs: number;
  weeks: number;
}

export function timeAxis(entries: { date?: string }[]): TimeAxis | null {
  const ms = entries.filter((e) => e.date).map((e) => toMs(e.date as string)).filter((n) => !Number.isNaN(n));
  if (ms.length === 0) return null;
  const startMs = Math.min(...ms);
  const endMs = Math.max(...ms);
  return { startMs, endMs, weeks: Math.floor((endMs - startMs) / (7 * DAY)) + 1 };
}

export function weeklyCounts(entries: { date?: string }[], axis: TimeAxis): { start: string; count: number }[] {
  const buckets = Array.from({ length: axis.weeks }, (_, i) => ({ start: toIso(axis.startMs + i * 7 * DAY), count: 0 }));
  for (const e of entries) {
    if (!e.date) continue;
    const ms = toMs(e.date);
    const i = Math.min(axis.weeks - 1, Math.max(0, Math.floor((ms - axis.startMs) / (7 * DAY))));
    buckets[i].count++;
  }
  return buckets;
}

const MIN_WEEKS = 6;
const MIN_ENTRIES = 6;
const MIN_DATED_SHARE = 0.7;

export function assessTrend(entries: { date?: string }[], axis: TimeAxis | null): TrendAssessment {
  const n = entries.length;
  const dated = entries.filter((e) => e.date).length;
  if (!axis) return { label: "potential_pattern", explanation: "The imported data has no usable dates, so no trend can be judged.", buckets: [] };
  const buckets = weeklyCounts(entries, axis);
  const why = (reason: string): TrendAssessment => ({ label: "potential_pattern", explanation: reason, buckets });
  if (n < MIN_ENTRIES) return why(`Only ${n} ${n === 1 ? "entry" : "entries"}; at least ${MIN_ENTRIES} are needed before a trend means anything. Labelled a potential pattern.`);
  if (dated / n < MIN_DATED_SHARE) return why(`Only ${dated} of ${n} entries have dates. Labelled a potential pattern.`);
  if (axis.weeks < MIN_WEEKS) return why(`The feedback spans ${axis.weeks} ${axis.weeks === 1 ? "week" : "weeks"}; at least ${MIN_WEEKS} are needed to compare periods. Labelled a potential pattern.`);

  const third = Math.max(1, Math.floor(buckets.length / 3));
  const early = buckets.slice(0, third).reduce((a, b) => a + b.count, 0);
  const late = buckets.slice(-third).reduce((a, b) => a + b.count, 0);
  const span = `${late} in the last ${third} weeks versus ${early} in the first ${third}`;
  // Thresholds are deliberately strict: with a handful of entries, week-to-week noise is large.
  if (early === 0 && late >= 4) return { label: "emerging", explanation: `Not seen early in the window, ${late} entries in the last ${third} weeks.`, buckets };
  if (n >= 8 && late - early >= 4 && late >= 2 * Math.max(early, 1)) return { label: "growing", explanation: `Mentions are rising: ${span}.`, buckets };
  if (n >= 8 && early - late >= 4 && early >= 2 * Math.max(late, 1)) return { label: "declining", explanation: `Mentions are falling: ${span}.`, buckets };
  return { label: "steady", explanation: `Roughly constant: ${span}.`, buckets };
}

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
}

/** Builds the chronological signal feed. Each item links back to the entries behind it. */
export function buildSignals(entries: ProcessedEntry[], themes: Theme[]): SignalItem[] {
  const axis = timeAxis(entries);
  if (!axis) return [];
  const out: SignalItem[] = [];
  const endIso = toIso(axis.endMs);
  const recentFrom = axis.endMs - 28 * DAY;

  for (const t of themes) {
    if (t.isPositive || !t.firstSeen || !t.lastSeen) continue;
    const trendOk = t.trend.label === "emerging" || t.trend.label === "growing";
    if (toMs(t.firstSeen) >= recentFrom && t.count >= 3) {
      out.push({
        id: `new-${t.id}`,
        kind: "new_theme",
        date: t.firstSeen,
        title: `New theme: ${t.title}`,
        detail: `First seen ${t.firstSeen}, ${t.count} entries since. ${t.trend.explanation}`,
        evidenceLevel: trendOk ? "trend" : "potential_pattern",
        themeId: t.id,
        entryIds: t.entryIds,
      });
    } else if (trendOk) {
      out.push({
        id: `grow-${t.id}`,
        kind: "growing_problem",
        date: t.lastSeen,
        title: `${t.trend.label === "emerging" ? "Emerging" : "Growing"}: ${t.title}`,
        detail: t.trend.explanation,
        evidenceLevel: "trend",
        themeId: t.id,
        entryIds: t.entryIds,
      });
    }
    const recentReqs = entries.filter((e) => e.analysis.topicKey === t.id && e.analysis.feedbackType === "feature_request" && e.date && toMs(e.date) >= axis.endMs - 21 * DAY);
    if (recentReqs.length >= 2) {
      out.push({
        id: `req-${t.id}`,
        kind: "new_feature_requests",
        date: recentReqs.map((e) => e.date as string).sort().at(-1) as string,
        title: `New feature requests: ${t.title}`,
        detail: `${recentReqs.length} requests in the last three weeks. Too few to call a trend; worth watching.`,
        evidenceLevel: "potential_pattern",
        themeId: t.id,
        entryIds: recentReqs.map((e) => e.id),
      });
    }
  }

  // Negative spike: latest week against the rest of the history.
  if (axis.weeks >= MIN_WEEKS) {
    const neg = entries.filter((e) => e.analysis.sentiment === "negative");
    const weekly = weeklyCounts(neg, axis);
    const last = weekly[weekly.length - 1];
    const hist = weekly.slice(0, -1).map((b) => b.count);
    const m = mean(hist);
    const sd = Math.sqrt(mean(hist.map((x) => (x - m) ** 2)));
    if (last.count >= 5 && last.count > m + 1.5 * Math.max(sd, 1)) {
      const ids = neg.filter((e) => e.date && e.date >= last.start).map((e) => e.id);
      out.push({
        id: `spike-${last.start}`,
        kind: "negative_spike",
        date: endIso,
        title: "Negative feedback spike",
        detail: `${last.count} negative entries in the latest week, against an average of ${round(m, 1)} in earlier weeks.`,
        evidenceLevel: hist.length >= MIN_WEEKS ? "trend" : "potential_pattern",
        entryIds: ids,
      });
    }
  }

  // Sentiment shift: last 28 days against the 28 days before.
  const recent = entries.filter((e) => e.date && toMs(e.date) > axis.endMs - 28 * DAY);
  const prior = entries.filter((e) => e.date && toMs(e.date) <= axis.endMs - 28 * DAY && toMs(e.date) > axis.endMs - 56 * DAY);
  if (recent.length >= 8 && prior.length >= 8) {
    const a = mean(recent.map((e) => e.analysis.sentimentScore));
    const b = mean(prior.map((e) => e.analysis.sentimentScore));
    if (Math.abs(a - b) >= 0.2) {
      out.push({
        id: `sent-${endIso}`,
        kind: "sentiment_shift",
        date: endIso,
        title: a < b ? "Customer sentiment is getting more negative" : "Customer sentiment is improving",
        detail: `Average sentiment moved from ${round(b)} to ${round(a)} (scale -1 to 1) across ${prior.length} and ${recent.length} entries.`,
        evidenceLevel: recent.length >= 12 && prior.length >= 12 ? "trend" : "potential_pattern",
        entryIds: recent.map((e) => e.id),
      });
    }
  }

  return out.sort((x, y) => y.date.localeCompare(x.date) || x.id.localeCompare(y.id));
}
