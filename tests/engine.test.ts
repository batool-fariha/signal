import { beforeAll, describe, expect, it } from "vitest";
import { buildFlowdeskSample } from "../src/lib/sample/flowdesk";
import { processEntries, validateAnalysis } from "../src/lib/ai/provider";
import { buildThemes } from "../src/lib/engine/themes";
import { buildSignals, assessTrend, timeAxis } from "../src/lib/engine/trends";
import { generateBrief } from "../src/lib/engine/brief";
import { csvCell, reportMarkdown } from "../src/lib/engine/report";
import { classifyEntry, scoreSentiment } from "../src/lib/engine/classify";
import type { ProcessedEntry, Theme } from "../src/lib/types";

let entries: ProcessedEntry[];
let themes: Theme[];
beforeAll(async () => {
  entries = await processEntries(buildFlowdeskSample());
  themes = buildThemes(entries);
});

describe("sample dataset", () => {
  it("has at least 100 entries with a spread of sources, segments, dates and ratings", () => {
    expect(entries.length).toBeGreaterThanOrEqual(100);
    expect(new Set(entries.map((e) => e.source)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(entries.map((e) => e.segment)).size).toBe(4);
    expect(entries.every((e) => e.date && e.rating)).toBe(true);
  });
  it("is deterministic", async () => {
    const again = await processEntries(buildFlowdeskSample());
    expect(again.map((e) => e.id + e.date)).toEqual(entries.map((e) => e.id + e.date));
  });
  it("is not all negative", () => {
    const pos = entries.filter((e) => e.analysis.sentiment === "positive").length;
    expect(pos).toBeGreaterThanOrEqual(12);
    expect(pos).toBeLessThan(entries.length * 0.4);
  });
});

describe("themes", () => {
  it("recovers the recurring problems seeded in the sample", () => {
    const ids = new Set(themes.map((t) => t.id));
    for (const id of ["dashboard-performance", "onboarding-confusion", "notification-gaps", "reporting-limits", "mobile-experience", "permission-management", "pricing-concerns", "task-assignment", "calendar-integration"]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
  it("assigns every entry to exactly one theme and gives themes unique ids", () => {
    expect(new Set(themes.map((t) => t.id)).size).toBe(themes.length);
    const all = themes.flatMap((t) => t.entryIds);
    expect(all.length).toBe(entries.length);
    expect(new Set(all).size).toBe(entries.length);
  });
  it("never invents quotes: every quote is the exact text of a linked entry", () => {
    const byId = new Map(entries.map((e) => [e.id, e]));
    for (const t of themes) {
      expect(t.quotes.length).toBeGreaterThan(0);
      for (const q of t.quotes) {
        expect(t.entryIds).toContain(q.entryId);
        expect(byId.get(q.entryId)?.text).toBe(q.text);
      }
    }
  });
  it("keeps counts honest", () => {
    for (const t of themes) {
      expect(t.count).toBe(t.entryIds.length);
      expect(t.sentiment.positive + t.sentiment.neutral + t.sentiment.negative).toBe(t.count);
    }
  });
  it("keeps praise out of problem themes", () => {
    for (const t of themes.filter((x) => !x.isPositive && !x.id.startsWith("other") && x.id !== "other-feedback")) {
      const share = t.sentiment.positive / t.count;
      expect(share, t.id).toBeLessThan(0.35);
    }
  });
});

describe("analysis fields", () => {
  it("extracts excerpts verbatim from the entry", () => {
    for (const e of entries) {
      for (const ex of [e.analysis.customerProblem, e.analysis.featureRequest]) {
        if (ex) expect(e.text.includes(ex.replace(/…$/, ""))).toBe(true);
      }
    }
  });
  it("classifies obvious cases", () => {
    const a = classifyEntry({ id: "x", text: "Please add multiple assignees to a task. We would love to be able to share ownership." });
    expect(a.feedbackType).toBe("feature_request");
    expect(a.featureRequest).toContain("Please add multiple assignees");
    const b = classifyEntry({ id: "y", text: "The dashboard takes forever to load. It is blocking our standups." });
    expect(b.feedbackType).toBe("performance_issue");
    expect(b.urgency).toBe("high");
    const c = classifyEntry({ id: "z", text: "Love the timeline view, it is great and easy to use." });
    expect(c.feedbackType).toBe("positive_feedback");
    expect(c.sentiment).toBe("positive");
  });
  it("handles negation in sentiment", () => {
    expect(scoreSentiment("This is not great at all").label).not.toBe("positive");
    expect(scoreSentiment("Not slow anymore, works well").score).toBeGreaterThan(0);
  });
  it("does not treat negative tone as urgency by itself", () => {
    const a = classifyEntry({ id: "n", text: "The colour of the sidebar is a bit annoying, minor thing though." });
    expect(a.urgency).not.toBe("high");
  });
});

describe("regressions found by reading the evidence", () => {
  it("does not put a permissions complaint in the performance theme because it says 'takes ages'", () => {
    const e = classifyEntry({ id: "r1", text: "Changing permissions for a team means clicking through every project one at a time. It takes ages." });
    expect(e.topicKey).toBe("permission-management");
  });
  it("still recognises genuine slow-loading phrasing", () => {
    for (const text of ["The dashboard takes forever to load now.", "Pages time out when I open the portfolio view, it is much slower.", "Opening a project is slow."]) {
      expect(classifyEntry({ id: "r2", text }).topicKey, text).toBe("dashboard-performance");
    }
  });
  it("reads 'slower' as negative", () => {
    expect(scoreSentiment("It has gotten noticeably slower over the past month.").label).toBe("negative");
  });
  it("never relates a problem theme to a praise theme", () => {
    for (const t of themes) for (const id of t.relatedThemeIds) expect(themes.find((x) => x.id === id)?.isPositive).toBe(t.isPositive);
  });
});

describe("priority", () => {
  it("shows five separate factors with rationales and does not rank by frequency alone", () => {
    for (const t of themes.filter((x) => !x.isPositive)) {
      for (const f of [t.priority.frequency, t.priority.severity, t.priority.customerImpact, t.priority.businessRelevance, t.priority.confidence]) {
        expect(f.rationale.length).toBeGreaterThan(10);
      }
      expect(t.priority.explanation).toMatch(/not an objective ranking|nothing to prioritise/);
    }
  });
  it("marks praise as low priority", () => {
    for (const t of themes.filter((x) => x.isPositive)) expect(t.priority.suggested).toBe("low");
  });
  it("reports unknown customer impact when there is no customer or segment data", async () => {
    const bare = await processEntries(Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, text: `The dashboard is slow and takes forever to load, case ${i}.` })));
    const [t] = buildThemes(bare);
    expect(t.priority.customerImpact.level).toBe("unknown");
    expect(t.trend.label).toBe("potential_pattern");
  });
});

describe("trends", () => {
  const mk = (dates: string[]) => dates.map((date) => ({ date }));
  it("labels as potential pattern when evidence is thin", () => {
    const axis = timeAxis(mk(["2026-01-01", "2026-03-01"]));
    expect(assessTrend(mk(["2026-01-01", "2026-03-01"]), axis).label).toBe("potential_pattern");
  });
  it("labels as potential pattern when dates are missing", () => {
    const all = mk(["2026-01-01", "2026-03-30"]);
    const axis = timeAxis(all);
    const undated = Array.from({ length: 10 }, () => ({ date: undefined as string | undefined }));
    expect(assessTrend(undated, axis).label).toBe("potential_pattern");
  });
  it("calls a clear rise growing or emerging", () => {
    const early = mk(["2026-01-01"]);
    const late = mk(Array.from({ length: 9 }, (_, i) => `2026-03-${String(10 + i).padStart(2, "0")}`));
    const axis = timeAxis([...early, ...late]);
    expect(["growing", "emerging"]).toContain(assessTrend([...early, ...late], axis).label);
  });
  it("finds the dashboard problem rising and does not flag flat themes as trends", () => {
    const dash = themes.find((t) => t.id === "dashboard-performance");
    expect(["growing", "emerging"]).toContain(dash?.trend.label);
    const onboarding = themes.find((t) => t.id === "onboarding-confusion");
    expect(onboarding?.trend.label).toBe("steady");
  });
  it("links every signal to entries and marks trends only with evidence", () => {
    const signals = buildSignals(entries, themes);
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      expect(s.entryIds.length).toBeGreaterThan(0);
      if (s.evidenceLevel === "trend" && s.themeId) {
        const t = themes.find((x) => x.id === s.themeId);
        expect(t && ["growing", "emerging"].includes(t.trend.label) || s.kind === "negative_spike" || s.kind === "sentiment_shift").toBe(true);
      }
    }
  });
});

describe("product brief", () => {
  it("is labelled a draft, tags provenance, and links evidence", () => {
    const t = themes.find((x) => x.id === "pricing-concerns") as Theme;
    const b = generateBrief(t, entries, "2026-11-25T00:00:00.000Z");
    expect(b.sections[0].lines[0]).toMatch(/Draft for product manager review/);
    expect(new Set(b.sections.map((s) => s.provenance))).toEqual(new Set(["observed", "interpretation", "suggestion"]));
    const evidence = b.sections.find((s) => s.heading === "Supporting customer evidence")!;
    for (const q of t.quotes) expect(evidence.lines.join("\n")).toContain(`"${q.text}"`);
    for (const h of ["Problem statement", "Target customer segment", "User needs", "Opportunity hypothesis", "Potential solution directions", "Success metrics to investigate", "Open questions", "Risks and assumptions"]) {
      expect(b.sections.some((s) => s.heading === h), h).toBe(true);
    }
  });
  it("says so when there are no segments", async () => {
    const bare = await processEntries(Array.from({ length: 4 }, (_, i) => ({ id: `b${i}`, text: `Per-seat pricing is too expensive for us, number ${i}.` })));
    const [t] = buildThemes(bare);
    const b = generateBrief(t, bare);
    expect(b.sections.find((s) => s.heading === "Target customer segment")!.lines[0]).toMatch(/no segment information/);
  });
});

describe("exports", () => {
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("plain")).toBe("plain");
  });
  it("writes a report that includes the caveat and quotes", () => {
    const md = reportMarkdown({ version: 1, name: "Test", createdAt: "", entries, statuses: {}, priorityOverrides: {}, briefs: {}, seen: [] }, themes);
    expect(md).toContain("frequency is not the same as impact");
    expect(md).toContain(themes.find((t) => !t.isPositive)!.quotes[0].text);
  });
});

describe("model output validation", () => {
  const good = { topicKey: "x", topic: "X", productArea: "Y", customerProblem: "It is slow.", sentiment: "negative", sentimentScore: -0.5, urgency: "high", feedbackType: "performance_issue", featureRequest: null, entities: [], businessSignals: [], confidence: 0.8 };
  it("accepts well-formed output whose excerpts are in the source", () => {
    expect(validateAnalysis(good, "The app is slow. It is slow.")).not.toBeNull();
  });
  it("rejects invented excerpts and malformed fields", () => {
    expect(validateAnalysis({ ...good, customerProblem: "Something the customer never said." }, "The app is fine.")).toBeNull();
    expect(validateAnalysis({ ...good, sentiment: "angry" }, "It is slow.")).toBeNull();
    expect(validateAnalysis({ ...good, confidence: 7 }, "It is slow.")).toBeNull();
    expect(validateAnalysis("nope", "x")).toBeNull();
  });
});
