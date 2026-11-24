/**
 * Heuristic classification of a single feedback entry.
 *
 * Every field is derived from the entry's own words. Excerpts (`customerProblem`,
 * `featureRequest`) are verbatim sentences from the entry, never paraphrases.
 */
import type { Analysis, FeedbackEntry, FeedbackType, Sentiment, Urgency } from "../types";
import {
  BUG_CUES,
  BUSINESS_SIGNALS,
  FALLBACK_TOPIC,
  FEATURE_ENTITIES,
  HIGH_URGENCY,
  LOW_URGENCY,
  NEGATIVE_WORDS,
  NEGATORS,
  PERFORMANCE_CUES,
  POSITIVE_WORDS,
  PRAISE_AREA_TITLES,
  PRICING_CUES,
  REQUEST_CUES,
  SUGGESTION_CUES,
  TOPICS,
  USABILITY_CUES,
  type TopicDef,
} from "./lexicon";
import { normalise, phraseRegex, round, slug, splitSentences } from "./text";

const cache = new Map<string, RegExp>();
function re(phrase: string): RegExp {
  let r = cache.get(phrase);
  if (!r) {
    r = phraseRegex(phrase);
    cache.set(phrase, r);
  }
  return r;
}

const anyMatch = (text: string, phrases: string[]) => phrases.some((p) => re(p).test(text));
const countMatches = (text: string, phrases: string[]) => phrases.reduce((n, p) => n + (re(p).test(text) ? 1 : 0), 0);
const matched = (text: string, phrases: string[]) => phrases.filter((p) => re(p).test(text));

/** Sentiment from word lists with simple negation, blended with the rating when present. */
export function scoreSentiment(text: string, rating?: number): { score: number; label: Sentiment } {
  const words = normalise(text).replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean);
  let pos = 0;
  let neg = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const negated = words.slice(Math.max(0, i - 3), i).some((p) => NEGATORS.includes(p));
    const isPos = POSITIVE_WORDS.some((p) => re(p).test(w));
    const isNeg = NEGATIVE_WORDS.some((p) => re(p).test(w));
    if (isPos && !isNeg) {
      if (negated) neg += 0.8;
      else pos += 1;
    } else if (isNeg && !isPos) {
      if (negated) pos += 0.4;
      else neg += 1;
    }
  }
  const total = pos + neg;
  let score = total === 0 ? 0 : (pos - neg) / (total + 1);
  if (rating !== undefined) {
    const fromRating = (rating - 3) / 2;
    score = total === 0 ? fromRating * 0.7 : score * 0.6 + fromRating * 0.4;
  }
  score = Math.max(-1, Math.min(1, score));
  const label: Sentiment = score > 0.15 ? "positive" : score < -0.15 ? "negative" : "neutral";
  return { score: round(score), label };
}

interface TopicMatch {
  topic: TopicDef | null;
  confidence: number;
  score: number;
}

export function matchTopic(text: string, productArea?: string): TopicMatch {
  const scored = TOPICS.map((t) => {
    let s = 2 * countMatches(text, t.strong) + countMatches(text, t.weak);
    // A product area supplied by the customer's own data is a strong hint.
    if (productArea && normalise(productArea).includes(normalise(t.area).split(" ")[0])) s += 2;
    return { t, s };
  }).sort((a, b) => b.s - a.s);
  const [best, second] = scored;
  if (!best || best.s < 2) return { topic: null, confidence: 0, score: best?.s ?? 0 };
  const confidence = round(best.s / (best.s + (second?.s ?? 0) + 1));
  return { topic: best.t, confidence, score: best.s };
}

function findEntities(text: string): string[] {
  const found = new Set<string>();
  for (const f of FEATURE_ENTITIES) if (new RegExp("\\b" + f.replace(/\s+/g, "\\s+") + "\\b", "i").test(text)) found.add(f);
  // Capitalised names that do not start a sentence: "Google Calendar", "Outlook", "Jira".
  const sentences = splitSentences(text);
  for (const s of sentences) {
    const words = s.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/[^A-Za-z0-9]/g, "");
      if (/^[A-Z][a-zA-Z0-9]{2,}$/.test(w) && !/^(I|The|We|It|Our|My|But|And)$/.test(w)) found.add(w);
    }
  }
  return [...found].slice(0, 6);
}

function pickSentence(text: string, cues: string[]): string | null {
  const sentences = splitSentences(text);
  let best: { s: string; n: number } | null = null;
  for (const s of sentences) {
    const n = countMatches(s, cues);
    if (n > 0 && (!best || n > best.n)) best = { s, n };
  }
  const out = best?.s ?? null;
  return out && out.length > 220 ? out.slice(0, 217).trimEnd() + "…" : out;
}

export function classifyEntry(entry: FeedbackEntry): Analysis {
  const text = entry.text;
  const { score, label } = scoreSentiment(text, entry.rating);

  const hasRequest = anyMatch(text, REQUEST_CUES);
  const problemy = label !== "positive" || anyMatch(text, [...BUG_CUES, ...PERFORMANCE_CUES]);

  const match = matchTopic(text, entry.productArea);
  const topicDef = match.topic;

  let feedbackType: FeedbackType = "other";
  if (hasRequest) feedbackType = "feature_request";
  else if (problemy && anyMatch(text, PERFORMANCE_CUES)) feedbackType = "performance_issue";
  else if (problemy && anyMatch(text, BUG_CUES)) feedbackType = "bug_report";
  else if (problemy && anyMatch(text, PRICING_CUES) && label !== "positive") feedbackType = "pricing_concern";
  else if (problemy && anyMatch(text, USABILITY_CUES) && label !== "positive") feedbackType = "usability_issue";
  else if (label === "positive") feedbackType = "positive_feedback";
  else if (anyMatch(text, SUGGESTION_CUES)) feedbackType = "general_suggestion";
  else if (topicDef?.key === "pricing-concerns" && label === "negative") feedbackType = "pricing_concern";
  else if (label === "negative") feedbackType = "usability_issue";

  // Praise gets its own topic per product area so it does not dilute problem themes.
  let topicKey: string;
  let topic: string;
  let productArea: string;
  if (feedbackType === "positive_feedback") {
    productArea = entry.productArea?.trim() || topicDef?.area || FALLBACK_TOPIC.area;
    topicKey = `praise-${slug(productArea)}`;
    topic = PRAISE_AREA_TITLES[productArea] ?? `Customers value ${productArea.toLowerCase()}`;
  } else if (topicDef) {
    topicKey = topicDef.key;
    topic = topicDef.title;
    productArea = entry.productArea?.trim() || topicDef.area;
  } else {
    topicKey = FALLBACK_TOPIC.key;
    topic = FALLBACK_TOPIC.title;
    productArea = entry.productArea?.trim() || FALLBACK_TOPIC.area;
  }

  const high = countMatches(text, HIGH_URGENCY);
  const low = countMatches(text, LOW_URGENCY);
  let urgency: Urgency = "medium";
  if (label === "positive") urgency = "low";
  else if (high >= 1 && low === 0) urgency = "high";
  else if (low >= 1 && high === 0) urgency = "low";
  else if (label === "neutral" && feedbackType === "feature_request") urgency = "low";

  const customerProblem =
    feedbackType === "positive_feedback"
      ? null
      : pickSentence(text, [...NEGATIVE_WORDS, ...BUG_CUES, ...PERFORMANCE_CUES, ...USABILITY_CUES, ...PRICING_CUES, ...REQUEST_CUES]) ?? splitSentences(text)[0] ?? null;

  return {
    topicKey,
    topic,
    productArea,
    customerProblem,
    sentiment: label,
    sentimentScore: score,
    urgency,
    feedbackType,
    featureRequest: hasRequest ? pickSentence(text, REQUEST_CUES) : null,
    entities: findEntities(text),
    businessSignals: matched(text, BUSINESS_SIGNALS).map((p) => p.replace("*", "")),
    confidence: feedbackType === "positive_feedback" ? Math.max(match.confidence, 0.5) : match.confidence,
  };
}
