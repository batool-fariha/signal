/**
 * Suggested prioritisation. Five factors, each with a score and a plain-language rationale.
 * The result is a suggestion for a PM to review: frequency is shown separately from
 * impact, and negative sentiment alone never makes a theme high priority.
 */
import type { Level, PriorityAssessment, PriorityFactor, ProcessedEntry } from "../types";
import { round } from "./text";

export interface DatasetStats {
  totalEntries: number;
  totalCustomers: number;
  totalSegments: number;
}

const levelOf = (s: number): Level => (s >= 0.66 ? "high" : s >= 0.33 ? "medium" : "low");
const pct = (n: number) => `${Math.round(n * 100)}%`;
const unknown = (why: string): PriorityFactor => ({ score: 0, level: "unknown", rationale: why });

export function datasetStats(entries: ProcessedEntry[]): DatasetStats {
  const customers = new Set(entries.map((e) => e.customer).filter(Boolean));
  const segments = new Set(entries.map((e) => e.segment).filter(Boolean));
  return { totalEntries: entries.length, totalCustomers: customers.size, totalSegments: segments.size };
}

export function confidenceFactor(entries: ProcessedEntry[]): PriorityFactor {
  const n = entries.length;
  const countScore = n >= 10 ? 1 : n >= 6 ? 0.75 : n >= 3 ? 0.5 : 0.25;
  const sources = new Set(entries.map((e) => e.source).filter(Boolean)).size;
  const sourceScore = sources === 0 ? 0.8 : sources >= 3 ? 1 : sources === 2 ? 0.85 : 0.7;
  const cohesion = entries.reduce((a, e) => a + e.analysis.confidence, 0) / Math.max(n, 1);
  const score = round(countScore * sourceScore * (0.6 + 0.4 * cohesion));
  const level: Level = score >= 0.6 ? "high" : score >= 0.35 ? "medium" : "low";
  const parts = [
    `${n} supporting ${n === 1 ? "entry" : "entries"}`,
    sources > 0 ? `${sources} ${sources === 1 ? "source" : "sources"}` : "source unknown",
    `average topic match ${pct(cohesion)}`,
  ];
  const caution = n < 3 ? " Too few entries to call this a pattern." : level === "low" ? " Treat as a lead to investigate, not a conclusion." : "";
  return { score, level, rationale: parts.join(", ") + "." + caution };
}

export function assessPriority(entries: ProcessedEntry[], stats: DatasetStats, isPositive: boolean): PriorityAssessment {
  const n = entries.length;
  const confidence = confidenceFactor(entries);

  const share = n / Math.max(stats.totalEntries, 1);
  const frequency: PriorityFactor = {
    score: round(Math.min(1, share / 0.15)),
    level: levelOf(Math.min(1, share / 0.15)),
    rationale: `${n} of ${stats.totalEntries} entries (${pct(share)}). Frequency says how often it is mentioned, not how much it matters.`,
  };

  const urgencyScore = (u: string) => (u === "high" ? 1 : u === "medium" ? 0.5 : 0.15);
  const meanUrgency = entries.reduce((a, e) => a + urgencyScore(e.analysis.urgency), 0) / Math.max(n, 1);
  const meanNeg = entries.reduce((a, e) => a + Math.max(0, -e.analysis.sentimentScore), 0) / Math.max(n, 1);
  const highCount = entries.filter((e) => e.analysis.urgency === "high").length;
  const sevScore = round(meanUrgency * 0.65 + meanNeg * 0.35);
  const severity: PriorityFactor = {
    score: sevScore,
    level: levelOf(sevScore),
    rationale: `${highCount} of ${n} entries use blocking or urgent language; average negativity ${pct(meanNeg)}. Negative tone alone does not raise severity.`,
  };

  const customers = new Set(entries.map((e) => e.customer).filter(Boolean));
  const segs = new Set(entries.map((e) => e.segment).filter(Boolean));
  let customerImpact: PriorityFactor;
  if (stats.totalCustomers === 0 && stats.totalSegments === 0) {
    customerImpact = unknown("The imported data has no customer or segment columns, so impact cannot be judged. Map those columns to enable it.");
  } else {
    const custShare = stats.totalCustomers ? customers.size / stats.totalCustomers : 0;
    const segShare = stats.totalSegments ? segs.size / stats.totalSegments : 0;
    const score = round(Math.min(1, custShare / 0.3) * 0.7 + segShare * 0.3);
    customerImpact = {
      score,
      level: levelOf(score),
      rationale: `${customers.size} of ${stats.totalCustomers} customers${stats.totalSegments ? ` across ${segs.size} of ${stats.totalSegments} segments` : ""}. This counts who is affected, not how valuable they are.`,
    };
  }

  const withSignals = entries.filter((e) => e.analysis.businessSignals.length > 0);
  const bizShare = withSignals.length / Math.max(n, 1);
  const businessRelevance: PriorityFactor =
    withSignals.length === 0
      ? { score: 0, level: "low", rationale: "No retention, conversion, revenue or adoption language appears in this feedback. That is an absence of evidence, not evidence of no impact." }
      : {
          score: round(Math.min(1, bizShare / 0.3)),
          level: levelOf(Math.min(1, bizShare / 0.3)),
          rationale: `${withSignals.length} of ${n} entries mention things like ${[...new Set(withSignals.flatMap((e) => e.analysis.businessSignals))].slice(0, 4).join(", ")}.`,
        };

  const parts: [PriorityFactor, number][] = [
    [frequency, 0.25],
    [severity, 0.25],
    [customerImpact, 0.2],
    [businessRelevance, 0.2],
  ];
  const usable = parts.filter(([f]) => f.level !== "unknown");
  const weightSum = usable.reduce((a, [, w]) => a + w, 0);
  const base = usable.reduce((a, [f, w]) => a + f.score * w, 0) / weightSum;
  const score = round(base * (0.7 + 0.3 * confidence.score));

  let suggested: Level = score >= 0.5 ? "high" : score >= 0.3 ? "medium" : "low";
  if (isPositive) suggested = "low";
  // Many mentions of something mild should not read as urgent.
  if (suggested === "high" && severity.score < 0.3 && businessRelevance.score === 0) suggested = "medium";
  // Weak evidence caps the suggestion.
  if (n < 3 && suggested === "high") suggested = "medium";

  const ranked = [...usable].sort((a, b) => b[0].score * b[1] - a[0].score * a[1]);
  const labels = new Map<PriorityFactor, string>([
    [frequency, "frequency"],
    [severity, "severity"],
    [customerImpact, "customer impact"],
    [businessRelevance, "business relevance"],
  ]);
  const driver = ranked[0] ? labels.get(ranked[0][0]) : "frequency";
  const explanation = isPositive
    ? "This theme is praise, so there is nothing to prioritise. It shows what customers value."
    : `Suggested ${suggested} priority, driven mostly by ${driver}. ${unknownNote(customerImpact)}${confidence.level === "low" ? "Confidence is low, so check the evidence before acting. " : ""}This is a starting point for your judgement, not an objective ranking.`;

  return { frequency, severity, customerImpact, businessRelevance, confidence, suggested, score, explanation };
}

function unknownNote(f: PriorityFactor): string {
  return f.level === "unknown" ? "Customer impact could not be assessed without customer or segment data. " : "";
}
