/**
 * The AI processing layer.
 *
 * Business logic only ever talks to an `AnalysisProvider`. The default provider is a
 * deterministic, offline classifier, so the whole product works without an API key.
 * To add a language-model provider, implement `analyze` on the server (never in the browser,
 * so keys stay secret), ask the model for JSON matching `Analysis`, and pass its output
 * through `validateAnalysis` before trusting it: anything invalid falls back to the heuristic.
 */
import type { Analysis, FeedbackEntry, FeedbackType, ProcessedEntry, Sentiment, Urgency } from "../types";
import { FEEDBACK_TYPE_LABELS } from "../types";
import { classifyEntry } from "../engine/classify";

export interface AnalysisProvider {
  id: string;
  label: string;
  analyze(entries: FeedbackEntry[]): Promise<Analysis[]>;
}

export const heuristicProvider: AnalysisProvider = {
  id: "heuristic",
  label: "Built-in analysis (no API key needed)",
  async analyze(entries) {
    return entries.map(classifyEntry);
  },
};

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];
const URGENCIES: Urgency[] = ["low", "medium", "high"];
const TYPES = Object.keys(FEEDBACK_TYPE_LABELS) as FeedbackType[];

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 600;
const strOrNull = (v: unknown): string | null | undefined => (v === null ? null : isStr(v) ? v : undefined);

/**
 * Validates structured model output. Returns null when anything is wrong, and also when a
 * quoted excerpt does not appear in the original text: the model may not invent evidence.
 */
export function validateAnalysis(raw: unknown, sourceText: string): Analysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isStr(r.topicKey) || !isStr(r.topic) || !isStr(r.productArea)) return null;
  if (!SENTIMENTS.includes(r.sentiment as Sentiment) || !URGENCIES.includes(r.urgency as Urgency) || !TYPES.includes(r.feedbackType as FeedbackType)) return null;
  if (typeof r.sentimentScore !== "number" || r.sentimentScore < -1 || r.sentimentScore > 1) return null;
  if (typeof r.confidence !== "number" || r.confidence < 0 || r.confidence > 1) return null;
  const problem = strOrNull(r.customerProblem);
  const request = strOrNull(r.featureRequest);
  if (problem === undefined || request === undefined) return null;
  const lower = sourceText.toLowerCase();
  const stripped = (s: string) => s.replace(/…$/, "").trim().toLowerCase();
  if (problem && !lower.includes(stripped(problem))) return null;
  if (request && !lower.includes(stripped(request))) return null;
  if (!Array.isArray(r.entities) || !r.entities.every((e) => typeof e === "string")) return null;
  if (!Array.isArray(r.businessSignals) || !r.businessSignals.every((e) => typeof e === "string")) return null;
  return {
    topicKey: r.topicKey,
    topic: r.topic,
    productArea: r.productArea,
    customerProblem: problem,
    sentiment: r.sentiment as Sentiment,
    sentimentScore: r.sentimentScore,
    urgency: r.urgency as Urgency,
    feedbackType: r.feedbackType as FeedbackType,
    featureRequest: request,
    entities: (r.entities as string[]).slice(0, 8),
    businessSignals: (r.businessSignals as string[]).slice(0, 8),
    confidence: r.confidence,
  };
}

/** Runs a provider over entries, validating its output and falling back to the heuristic per entry. */
export async function processEntries(
  entries: FeedbackEntry[],
  provider: AnalysisProvider = heuristicProvider,
  onProgress?: (done: number, total: number) => void,
): Promise<ProcessedEntry[]> {
  const out: ProcessedEntry[] = [];
  const CHUNK = 100;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    let results: unknown[];
    try {
      results = await provider.analyze(chunk);
    } catch {
      results = [];
    }
    chunk.forEach((entry, j) => {
      const valid = provider.id === "heuristic" ? (results[j] as Analysis | undefined) : validateAnalysis(results[j], entry.text);
      out.push({ ...entry, analysis: valid ?? classifyEntry(entry) });
    });
    onProgress?.(Math.min(i + CHUNK, entries.length), entries.length);
    // Yield so the UI can paint progress on large imports.
    await new Promise((r) => setTimeout(r, 0));
  }
  return out;
}
