/**
 * Groups processed entries into themes.
 *
 * 1. Entries are grouped by the topic the classifier found (stable keys, so a status set on a
 *    theme survives re-imports).
 * 2. Entries that matched no topic are clustered by TF-IDF similarity.
 * 3. Praise is grouped per product area; areas with very little praise are merged.
 *
 * Everything that appears as evidence (quotes, counts, dates) comes straight from the entries.
 * Problem statements, opportunities and questions are labelled as interpretation or suggestion
 * in the UI.
 */
import type { FeedbackType, ProcessedEntry, Quote, Theme } from "../types";
import { FALLBACK_TOPIC, PRAISE_AREA_TITLES, TOPICS } from "./lexicon";
import { assessPriority, confidenceFactor, datasetStats, type DatasetStats } from "./priority";
import { assessTrend, timeAxis, type TimeAxis } from "./trends";
import { centroid, cosine, slug, tfidf, tokenize, topTerms, type Vector } from "./text";

const MIN_PRAISE_GROUP = 3;
const LEFTOVER_SIMILARITY = 0.28;

interface Group {
  id: string;
  title: string;
  area: string;
  entries: ProcessedEntry[];
  isPositive: boolean;
  problem?: string;
  opportunity?: string;
  question?: string;
}

function groupEntries(entries: ProcessedEntry[]): Group[] {
  const byKey = new Map<string, ProcessedEntry[]>();
  for (const e of entries) {
    const list = byKey.get(e.analysis.topicKey) ?? [];
    list.push(e);
    byKey.set(e.analysis.topicKey, list);
  }

  const groups: Group[] = [];
  const praiseGeneral: ProcessedEntry[] = [];
  let leftovers: ProcessedEntry[] = [];

  for (const [key, list] of byKey) {
    if (key === FALLBACK_TOPIC.key) {
      leftovers = list;
      continue;
    }
    if (key.startsWith("praise-")) {
      if (key === "praise-general" || list.length < MIN_PRAISE_GROUP) praiseGeneral.push(...list);
      else
        groups.push({
          id: key,
          title: list[0].analysis.topic,
          area: list[0].analysis.productArea,
          entries: list,
          isPositive: true,
        });
      continue;
    }
    const def = TOPICS.find((t) => t.key === key);
    groups.push({
      id: key,
      title: def?.title ?? list[0].analysis.topic,
      area: list[0].analysis.productArea,
      entries: list,
      isPositive: false,
      problem: def?.problem,
      opportunity: def?.opportunity,
      question: def?.question,
    });
  }

  if (praiseGeneral.length > 0) {
    groups.push({
      id: "praise-general",
      title: PRAISE_AREA_TITLES.General,
      area: "General",
      entries: praiseGeneral,
      isPositive: true,
    });
  }

  groups.push(...clusterLeftovers(leftovers));
  return groups;
}

/** Leader clustering on TF-IDF vectors for entries no topic matched. */
function clusterLeftovers(entries: ProcessedEntry[]): Group[] {
  if (entries.length === 0) return [];
  const vecs = tfidf(entries.map((e) => tokenize(e.text)));
  const clusters: { idx: number[]; centre: Vector }[] = [];
  entries.forEach((_, i) => {
    let best = -1;
    let bestSim = 0;
    clusters.forEach((c, ci) => {
      const s = cosine(vecs[i], c.centre);
      if (s > bestSim) {
        bestSim = s;
        best = ci;
      }
    });
    if (best >= 0 && bestSim >= LEFTOVER_SIMILARITY) {
      clusters[best].idx.push(i);
      clusters[best].centre = centroid(clusters[best].idx.map((j) => vecs[j]));
    } else clusters.push({ idx: [i], centre: vecs[i] });
  });

  const groups: Group[] = [];
  const singles: ProcessedEntry[] = [];
  const used = new Set<string>();
  for (const c of clusters) {
    if (c.idx.length < 2) {
      singles.push(entries[c.idx[0]]);
      continue;
    }
    const terms = topTerms(c.centre, 3);
    let id = `other-${slug(terms.join("-")) || "cluster"}`;
    while (used.has(id)) id += "-b";
    used.add(id);
    const members = c.idx.map((i) => entries[i]);
    groups.push({
      id,
      title: `Other feedback: ${terms.join(", ")}`,
      area: members[0].analysis.productArea,
      entries: members,
      isPositive: members.every((m) => m.analysis.sentiment === "positive"),
      problem: `These entries share the terms "${terms.join('", "')}" but do not match a known topic. Read them to decide what, if anything, they have in common.`,
      opportunity: "No opportunity is suggested because the engine could not tell what these entries have in common. Review the evidence first.",
      question: "What do these entries have in common, and is it worth a theme of its own?",
    });
  }
  if (singles.length > 0) {
    groups.push({
      id: FALLBACK_TOPIC.key,
      title: "Uncategorised feedback",
      area: "General",
      entries: singles,
      isPositive: false,
      problem: "Single entries that matched no topic and no other entry. Not enough to call a pattern.",
      opportunity: "None suggested. Individual comments are not themes.",
      question: "Does any of this belong with an existing theme once you read it?",
    });
  }
  return groups;
}

function pickQuotes(group: Group, vecs: Map<string, Vector>, max = 4): Quote[] {
  const centre = centroid(group.entries.map((e) => vecs.get(e.id) as Vector));
  return [...group.entries]
    .map((e) => ({ e, s: cosine(vecs.get(e.id) as Vector, centre) + Math.min(e.text.length, 240) / 4000 }))
    .sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id))
    .slice(0, max)
    .map(({ e }) => ({ entryId: e.id, text: e.text }));
}

function counts<T extends string>(items: T[]): { name: T; count: number }[] {
  const m = new Map<T, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function describe(g: Group, total: number, customers: number, sources: number, negShare: number): string {
  const n = g.entries.length;
  const parts = [`${n} ${n === 1 ? "entry" : "entries"} (${Math.round((n / Math.max(total, 1)) * 100)}% of feedback)`];
  if (customers > 0) parts.push(`from ${customers} ${customers === 1 ? "customer" : "customers"}`);
  if (sources > 0) parts.push(`across ${sources} ${sources === 1 ? "source" : "sources"}`);
  return `${parts.join(" ")}. ${Math.round(negShare * 100)}% of them are negative.`;
}

export function buildThemes(entries: ProcessedEntry[]): Theme[] {
  if (entries.length === 0) return [];
  const groups = groupEntries(entries);
  const stats: DatasetStats = datasetStats(entries);
  const axis: TimeAxis | null = timeAxis(entries);

  const allVecs = tfidf(entries.map((e) => tokenize(e.text)));
  const vecs = new Map(entries.map((e, i) => [e.id, allVecs[i]]));
  const centres = new Map(groups.map((g) => [g.id, centroid(g.entries.map((e) => vecs.get(e.id) as Vector))]));

  const themes: Theme[] = groups.map((g) => {
    const n = g.entries.length;
    const dates = g.entries.map((e) => e.date).filter((d): d is string => Boolean(d)).sort();
    const customers = new Set(g.entries.map((e) => e.customer).filter(Boolean));
    const sources = new Set(g.entries.map((e) => e.source).filter(Boolean));
    const sentiment = {
      positive: g.entries.filter((e) => e.analysis.sentiment === "positive").length,
      neutral: g.entries.filter((e) => e.analysis.sentiment === "neutral").length,
      negative: g.entries.filter((e) => e.analysis.sentiment === "negative").length,
    };
    const types = counts<FeedbackType>(g.entries.map((e) => e.analysis.feedbackType)).map((c) => ({ type: c.name, count: c.count }));
    const priority = assessPriority(g.entries, stats, g.isPositive);

    return {
      id: g.id,
      title: g.title,
      productArea: g.area,
      problemStatement: g.isPositive
        ? "No problem is reported here. Customers describe something that works well for them."
        : g.problem ?? "Customers report an issue in this area.",
      description: describe(g, stats.totalEntries, customers.size, sources.size, sentiment.negative / n),
      entryIds: g.entries.map((e) => e.id),
      count: n,
      quotes: pickQuotes(g, vecs),
      segments: counts(g.entries.map((e) => e.segment).filter((s): s is string => Boolean(s))).map((c) => ({ name: c.name, count: c.count })),
      customersAffected: customers.size,
      sentiment,
      firstSeen: dates[0],
      lastSeen: dates[dates.length - 1],
      types,
      opportunity: g.isPositive ? "Protect what customers value here, and check it is not lost in future changes." : g.opportunity ?? "No opportunity suggested.",
      nextQuestion: g.isPositive ? "Which part of this do customers value most, and does it influence who stays and who expands?" : g.question ?? "What would you need to see to act on this?",
      trend: assessTrend(g.entries, axis),
      priority,
      confidence: confidenceFactor(g.entries),
      relatedThemeIds: [],
      isPositive: g.isPositive,
      weakEvidence: n < 3,
    };
  });

  // Related themes: nearest by TF-IDF centroid similarity.
  for (const t of themes) {
    const me = centres.get(t.id) as Vector;
    t.relatedThemeIds = themes
      // Praise is related to praise, and problems to problems.
      .filter((o) => o.id !== t.id && o.isPositive === t.isPositive)
      .map((o) => ({ id: o.id, s: cosine(me, centres.get(o.id) as Vector) + (o.productArea === t.productArea ? 0.05 : 0) }))
      .filter((x) => x.s >= 0.06)
      .sort((a, b) => b.s - a.s || a.id.localeCompare(b.id))
      .slice(0, 3)
      .map((x) => x.id);
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  return themes.sort(
    (a, b) =>
      Number(a.isPositive) - Number(b.isPositive) ||
      order[a.priority.suggested] - order[b.priority.suggested] ||
      b.priority.score - a.priority.score ||
      b.count - a.count ||
      a.id.localeCompare(b.id),
  );
}
