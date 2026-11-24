/** Report and data exports. */
import type { Level, ProcessedEntry, Theme, ThemeStatus, WorkspaceState } from "../types";
import { FEEDBACK_TYPE_LABELS, THEME_STATUS_LABELS } from "../types";

export function effectivePriority(theme: Theme, overrides: Record<string, Level>): { level: Level; overridden: boolean } {
  const o = overrides[theme.id];
  return o ? { level: o, overridden: true } : { level: theme.priority.suggested, overridden: false };
}

/** Prevents spreadsheet formula injection when a cell starts with =, +, - or @. */
export function csvCell(v: unknown): string {
  let s = v === undefined || v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function entriesToCsv(entries: ProcessedEntry[], themeOf: Map<string, string>): string {
  const head = ["id", "date", "customer", "source", "segment", "plan", "rating", "text", "theme", "topic", "product_area", "feedback_type", "sentiment", "urgency", "feature_request"];
  const rows = entries.map((e) => [e.id, e.date, e.customer, e.source, e.segment, e.plan, e.rating, e.text, themeOf.get(e.id), e.analysis.topic, e.analysis.productArea, FEEDBACK_TYPE_LABELS[e.analysis.feedbackType], e.analysis.sentiment, e.analysis.urgency, e.analysis.featureRequest]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function themesToCsv(themes: Theme[], state: Pick<WorkspaceState, "statuses" | "priorityOverrides">): string {
  const head = ["theme", "product_area", "entries", "customers", "status", "suggested_priority", "pm_priority", "trend", "confidence", "first_seen", "last_seen"];
  const rows = themes.map((t) => [t.title, t.productArea, t.count, t.customersAffected || "", THEME_STATUS_LABELS[state.statuses[t.id] ?? "new"], t.priority.suggested, state.priorityOverrides[t.id] ?? "", t.trend.label, t.confidence.level, t.firstSeen, t.lastSeen]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function reportMarkdown(workspace: WorkspaceState, themes: Theme[]): string {
  const total = workspace.entries.length;
  const problems = themes.filter((t) => !t.isPositive);
  const lines: string[] = [
    `# ${workspace.name}: customer feedback report`,
    `Generated ${new Date().toISOString().slice(0, 10)} by Signal from ${total} feedback entries.`,
    "",
    "> **How to read this.** Quotes and counts are taken directly from the imported feedback. Problem statements, priorities and trends are automated interpretations. Opportunities are suggestions. Priority is a starting point for your judgement, not an objective ranking, and frequency is not the same as impact.",
    "",
    "## Summary",
    `- ${total} feedback entries grouped into ${themes.length} themes (${problems.length} about problems or requests).`,
    `- ${problems.filter((t) => effectivePriority(t, workspace.priorityOverrides).level === "high").length} themes are high priority (after your adjustments).`,
    "",
    "## Themes by priority",
  ];
  for (const t of problems) {
    const p = effectivePriority(t, workspace.priorityOverrides);
    const status: ThemeStatus = workspace.statuses[t.id] ?? "new";
    lines.push(
      "",
      `### ${t.title}`,
      `**Priority:** ${p.level}${p.overridden ? ` (adjusted by you; suggested ${t.priority.suggested})` : " (suggested)"} · **Status:** ${THEME_STATUS_LABELS[status]} · **Entries:** ${t.count} · **Trend:** ${t.trend.label.replace("_", " ")} · **Confidence:** ${t.confidence.level}`,
      "",
      `**Problem (interpretation):** ${t.problemStatement}`,
      "",
      `**Evidence (observed):**`,
      ...t.quotes.map((q) => `- "${q.text}" (${q.entryId})`),
      "",
      `**Why this priority (interpretation):** ${t.priority.explanation}`,
      "",
      `**Opportunity (suggestion):** ${t.opportunity}`,
      `**Next research question (suggestion):** ${t.nextQuestion}`,
    );
    if (t.weakEvidence) lines.push("", "_Evidence is thin; treat as a lead._");
  }
  const positives = themes.filter((t) => t.isPositive);
  if (positives.length) {
    lines.push("", "## What customers value", ...positives.map((t) => `- ${t.title}: ${t.count} entries`));
  }
  return lines.join("\n");
}
