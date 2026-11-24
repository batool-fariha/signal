/**
 * Product brief generation. Everything is assembled from the theme and its entries; no section
 * contains a number, quote or claim that is not in the data. Each section is tagged with its
 * provenance, and the whole brief is a draft for PM review.
 */
import type { BriefSection, ProcessedEntry, ProductBrief, Theme } from "../types";
import { FEEDBACK_TYPE_LABELS } from "../types";

const SOLUTIONS: Record<string, string[]> = {
  "dashboard-performance": ["Profile the slowest views for large workspaces and fix the largest contributors first.", "Load the visible part of a view first and the rest progressively.", "Add a visible performance budget and monitor it per workspace size."],
  "onboarding-confusion": ["Guide a new workspace to its first completed task with a short setup flow.", "Replace the empty first screen with starter content or a template.", "Explain core terms (project, workspace, portfolio) where they first appear."],
  "notification-gaps": ["Audit which events trigger notifications and where they are lost.", "Let people set notification rules per project and per channel.", "Show delivery status so a missing alert can be traced."],
  "reporting-limits": ["Offer saved report templates that can be shared and scheduled.", "Support cross-project reports and custom fields in filters.", "Provide a share link that does not require a login."],
  "mobile-experience": ["Close the gap on the few tasks customers need most on mobile.", "Support working offline and syncing afterwards.", "Fix the reliability issues that push people back to a laptop."],
  "permission-management": ["Provide clearer roles, including read-only and guest access.", "Give admins one view of who can access what.", "Let admins change access for many projects at once."],
  "pricing-concerns": ["Check how plan limits and seat counts line up with real usage by segment.", "Make it clear what counts as a seat and which features sit on which plan.", "Consider lower-cost access for people who only view updates."],
  "task-assignment": ["Support more than one person on a task, with distinct roles such as owner and reviewer.", "Add a workload view before work is assigned.", "Allow bulk reassignment."],
  "calendar-integration": ["Make calendar sync two-way for the providers customers use.", "Respect time zones in due dates and deadlines.", "Provide feed links so stakeholders can subscribe without an account."],
  "search-and-filters": ["Review search relevance against the lookups customers describe.", "Support saved filters for common views."],
  "reliability-bugs": ["Reproduce and triage the reports, starting with any involving lost or wrong data."],
  "support-and-docs": ["Match the most common support questions to documentation gaps.", "Fix the product friction behind repeated questions."],
};

const METRICS: Record<string, string[]> = {
  "dashboard-performance": ["Load time for key views by workspace size", "Share of sessions abandoned before the dashboard loads", "Return rate of customers who reported slowness"],
  "onboarding-confusion": ["Time from sign-up to first completed task", "Share of new workspaces that invite a teammate in week one", "Trial-to-paid conversion for new accounts"],
  "notification-gaps": ["Share of expected notifications actually delivered", "Time between an event and its notification", "Notification mute and disable rate"],
  "reporting-limits": ["Number of reports created and shared per workspace", "Exports per account (as a sign of work done outside the product)", "Time to produce a weekly status report"],
  "mobile-experience": ["Weekly active mobile users", "Mobile task completion rate", "Mobile crash-free sessions"],
  "permission-management": ["Time to configure access for a new client", "Security-review outcomes for enterprise deals", "Admin support tickets about access"],
  "pricing-concerns": ["Conversion at each plan boundary", "Downgrade and cancellation rate at renewal", "Seat utilisation by segment"],
  "task-assignment": ["Share of tasks with a clear owner", "Workarounds outside the product (such as spreadsheets) reported by customers", "Time to reassign work when someone leaves"],
  "calendar-integration": ["Share of accounts with a connected calendar", "Sync error and duplicate-event rate", "Support tickets about calendar sync"],
};

const pct = (n: number, total: number) => `${Math.round((n / Math.max(total, 1)) * 100)}%`;

export function generateBrief(theme: Theme, entries: ProcessedEntry[], now = new Date().toISOString()): ProductBrief {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const members = theme.entryIds.map((id) => byId.get(id)).filter((e): e is ProcessedEntry => Boolean(e));
  const sections: BriefSection[] = [];

  sections.push({
    heading: "Status of this document",
    provenance: "interpretation",
    lines: ["Draft for product manager review. This is not an approved product requirement. It was assembled from the feedback listed under Supporting customer evidence; check that evidence before relying on any statement here."],
  });

  sections.push({
    heading: "Problem statement",
    provenance: "interpretation",
    lines: [theme.problemStatement, `Based on ${theme.count} feedback ${theme.count === 1 ? "entry" : "entries"}${theme.firstSeen ? ` between ${theme.firstSeen} and ${theme.lastSeen}` : ""}.`, ...(theme.weakEvidence ? ["Evidence is thin (fewer than 3 entries). Treat this as a lead, not a finding."] : [])],
  });

  sections.push({
    heading: "Supporting customer evidence",
    provenance: "observed",
    lines: [
      ...theme.quotes.map((q) => {
        const e = byId.get(q.entryId);
        const who = [e?.customer, e?.segment, e?.date].filter(Boolean).join(", ");
        return `- "${q.text}" (${q.entryId}${who ? `; ${who}` : ""})`;
      }),
      `- ${theme.count} entries in total are linked to this theme; ${theme.sentiment.negative} negative, ${theme.sentiment.neutral} neutral, ${theme.sentiment.positive} positive.`,
    ],
  });

  const segTotal = theme.segments.reduce((a, s) => a + s.count, 0);
  sections.push({
    heading: "Target customer segment",
    provenance: "observed",
    lines:
      theme.segments.length === 0
        ? ["The imported feedback has no segment information, so the affected segment cannot be stated. Add a segment column to find out."]
        : theme.segments.map((s) => `- ${s.name}: ${s.count} of ${segTotal} entries with a segment (${pct(s.count, segTotal)})`),
  });

  const requests = members.filter((e) => e.analysis.featureRequest).slice(0, 4);
  sections.push({
    heading: "User needs",
    provenance: "interpretation",
    lines: [
      ...requests.map((e) => `- Asked for directly: "${e.analysis.featureRequest}" (${e.id})`),
      ...(requests.length === 0 ? ["- No entry in this theme makes an explicit request. The need is inferred from the problems described, which is weaker evidence than a stated request."] : []),
      `- Most common feedback type: ${theme.types[0] ? FEEDBACK_TYPE_LABELS[theme.types[0].type] : "unknown"}.`,
    ],
  });

  sections.push({
    heading: "Opportunity hypothesis",
    provenance: "suggestion",
    lines: [`If ${theme.title.charAt(0).toLowerCase() + theme.title.slice(1)} were addressed, customers who report it may have a better experience. ${theme.opportunity}`, "This is a hypothesis to test, not a result."],
  });

  sections.push({
    heading: "Potential solution directions",
    provenance: "suggestion",
    lines: (SOLUTIONS[theme.id] ?? ["The engine has no solution ideas for this theme. Start from the evidence above."]).map((s) => `- ${s}`),
  });

  const businessCount = members.filter((e) => e.analysis.businessSignals.length > 0).length;
  sections.push({
    heading: "Success metrics to investigate",
    provenance: "suggestion",
    lines: [
      ...(METRICS[theme.id] ?? ["Define a measure of the problem described above before choosing a solution."]).map((m) => `- ${m}`),
      ...(businessCount > 0 ? [`- ${businessCount} of ${theme.count} entries mention retention, conversion or revenue language, so consider a business metric alongside the product one.`] : []),
    ],
  });

  sections.push({
    heading: "Open questions",
    provenance: "suggestion",
    lines: [
      `- ${theme.nextQuestion}`,
      ...(theme.confidence.level === "low" ? ["- Confidence in this theme is low. How many more customers would need to report it before it is worth acting on?"] : []),
      ...(theme.trend.label === "potential_pattern" ? ["- There is not enough dated evidence to call this a trend. Is it growing, steady or fading?"] : []),
      ...(theme.segments.length === 0 ? ["- Which customer segments are affected?"] : []),
    ],
  });

  sections.push({
    heading: "Risks and assumptions",
    provenance: "interpretation",
    lines: [
      "- Frequency is not impact: how often something is mentioned does not show how much it matters to retention or revenue.",
      "- Feedback comes from people who chose to write in. Silent customers are not represented.",
      "- The theme grouping and sentiment were produced by automated analysis and may be wrong for individual entries. Read the linked entries.",
      ...(theme.priority.customerImpact.level === "unknown" ? ["- Customer impact could not be assessed because the data has no customer or segment columns."] : []),
    ],
  });

  return { themeId: theme.id, title: `Product brief (draft): ${theme.title}`, generatedAt: now, sections };
}

export function briefToMarkdown(b: ProductBrief): string {
  const tag: Record<string, string> = { observed: "Observed in customer feedback", interpretation: "AI-generated interpretation", suggestion: "Suggested action" };
  return [`# ${b.title}`, `Generated ${b.generatedAt.slice(0, 10)}. Draft for PM review.`, "", ...b.sections.flatMap((s) => [`## ${s.heading}`, `_${tag[s.provenance]}_`, "", ...s.lines, ""])].join("\n");
}
