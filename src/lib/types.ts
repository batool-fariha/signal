/**
 * Core domain types for Signal.
 *
 * Provenance matters in this product: every generated statement is tagged as
 * `observed` (taken verbatim from customer feedback), `interpretation`
 * (derived by the analysis engine) or `suggestion` (a proposed product action).
 */

export type FeedbackType =
  | "bug_report"
  | "feature_request"
  | "usability_issue"
  | "performance_issue"
  | "pricing_concern"
  | "positive_feedback"
  | "general_suggestion"
  | "other";

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug_report: "Bug report",
  feature_request: "Feature request",
  usability_issue: "Usability issue",
  performance_issue: "Performance issue",
  pricing_concern: "Pricing concern",
  positive_feedback: "Positive feedback",
  general_suggestion: "General suggestion",
  other: "Other",
};

export type Sentiment = "positive" | "neutral" | "negative";
export type Urgency = "low" | "medium" | "high";
export type Provenance = "observed" | "interpretation" | "suggestion";

/** A raw feedback record as imported by the user. Only `text` is required. */
export interface FeedbackEntry {
  id: string;
  text: string;
  customer?: string;
  source?: string;
  /** ISO date (YYYY-MM-DD) when known. */
  date?: string;
  segment?: string;
  plan?: string;
  /** Normalised to a 1 to 5 scale. */
  rating?: number;
  productArea?: string;
}

/** Structured information extracted from one feedback entry. */
export interface Analysis {
  topicKey: string;
  topic: string;
  productArea: string;
  /** Verbatim excerpt of the sentence that states the problem, or null. */
  customerProblem: string | null;
  sentiment: Sentiment;
  /** -1 (very negative) to 1 (very positive). */
  sentimentScore: number;
  urgency: Urgency;
  feedbackType: FeedbackType;
  /** Verbatim excerpt of the request, when the entry asks for something. */
  featureRequest: string | null;
  entities: string[];
  /** Phrases in the entry that suggest retention, conversion or revenue impact. */
  businessSignals: string[];
  /** How sure the classifier is about the topic, 0 to 1. */
  confidence: number;
}

export interface ProcessedEntry extends FeedbackEntry {
  analysis: Analysis;
}

export type ThemeStatus = "new" | "investigating" | "planned" | "addressed" | "dismissed";
export const THEME_STATUSES: ThemeStatus[] = ["new", "investigating", "planned", "addressed", "dismissed"];
export const THEME_STATUS_LABELS: Record<ThemeStatus, string> = {
  new: "New",
  investigating: "Investigating",
  planned: "Planned",
  addressed: "Addressed",
  dismissed: "Dismissed",
};

export type Level = "low" | "medium" | "high";

export interface PriorityFactor {
  /** 0 to 1. */
  score: number;
  level: Level | "unknown";
  rationale: string;
}

export interface PriorityAssessment {
  frequency: PriorityFactor;
  severity: PriorityFactor;
  customerImpact: PriorityFactor;
  businessRelevance: PriorityFactor;
  confidence: PriorityFactor;
  /** Suggested overall priority. A suggestion, not a fact. */
  suggested: Level;
  /** Combined 0 to 1 score the suggestion is derived from. */
  score: number;
  explanation: string;
}

export type TrendLabel = "emerging" | "growing" | "steady" | "declining" | "potential_pattern";

export interface TrendAssessment {
  label: TrendLabel;
  /** Why this label was or was not given. */
  explanation: string;
  /** Entry counts per time bucket, oldest first. Empty when dates are insufficient. */
  buckets: { start: string; count: number }[];
}

export interface Quote {
  entryId: string;
  text: string;
}

export interface Theme {
  /** Stable key derived from the topic, so status survives re-imports. */
  id: string;
  title: string;
  productArea: string;
  /** Interpretation: a one-sentence statement of the customer problem. */
  problemStatement: string;
  /** Interpretation: a short description built from the counts below. */
  description: string;
  entryIds: string[];
  count: number;
  /** Verbatim customer quotes (observed). */
  quotes: Quote[];
  segments: { name: string; count: number }[];
  customersAffected: number;
  sentiment: { positive: number; neutral: number; negative: number };
  firstSeen?: string;
  lastSeen?: string;
  types: { type: FeedbackType; count: number }[];
  /** Suggestion: a potential product opportunity. */
  opportunity: string;
  /** Suggestion: the next question worth researching. */
  nextQuestion: string;
  trend: TrendAssessment;
  priority: PriorityAssessment;
  confidence: PriorityFactor;
  relatedThemeIds: string[];
  /** True when the theme describes something customers like. */
  isPositive: boolean;
  /** True when the theme has fewer entries than needed to call it a pattern. */
  weakEvidence: boolean;
}

export interface BriefSection {
  heading: string;
  provenance: Provenance;
  /** Paragraphs or bullet lines. Bullets start with "- ". */
  lines: string[];
}

export interface ProductBrief {
  themeId: string;
  title: string;
  generatedAt: string;
  sections: BriefSection[];
}

export type SignalKind =
  | "new_theme"
  | "growing_problem"
  | "negative_spike"
  | "new_feature_requests"
  | "sentiment_shift";

export interface SignalItem {
  id: string;
  kind: SignalKind;
  /** Date the signal refers to (ISO). */
  date: string;
  title: string;
  detail: string;
  /** "trend" only when there is enough time-based evidence. */
  evidenceLevel: "trend" | "potential_pattern";
  themeId?: string;
  entryIds: string[];
}

export interface WorkspaceState {
  version: 1;
  name: string;
  createdAt: string;
  entries: ProcessedEntry[];
  statuses: Record<string, ThemeStatus>;
  priorityOverrides: Record<string, Level>;
  briefs: Record<string, ProductBrief>;
  /** Themes the user has marked as seen in the signal feed. */
  seen: string[];
}
