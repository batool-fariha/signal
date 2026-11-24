import { describe, expect, it } from "vitest";
import { applyMapping, detectMapping, ImportError, LIMITS, parseCsv, parseDate, parseFreeText, parseRating, sanitize } from "../src/lib/ingest/ingest";

const csv = (s: string) => parseCsv(s.trim());

describe("parseCsv", () => {
  it("parses headers, quoted commas and newlines", () => {
    const p = csv('Feedback,Customer\n"Slow, very slow\nreally",Acme\nFine,Beta');
    expect(p.headers).toEqual(["Feedback", "Customer"]);
    expect(p.rows).toHaveLength(2);
    expect(p.rows[0][0]).toBe("Slow, very slow\nreally");
  });
  it("strips a byte-order mark", () => {
    expect(csv("﻿feedback\nhello there").headers).toEqual(["feedback"]);
  });
  it("rejects empty files and files without data rows", () => {
    expect(() => parseCsv("   ")).toThrow(ImportError);
    expect(() => parseCsv("feedback")).toThrow(/header row and at least one data row/);
  });
  it("rejects oversized input", () => {
    expect(() => parseCsv("a\nb", LIMITS.maxBytes + 1)).toThrow(/larger than/);
  });
  it("caps the number of rows and says so", () => {
    const body = Array.from({ length: LIMITS.maxRows + 5 }, (_, i) => `entry ${i}`).join("\n");
    const p = parseCsv("feedback\n" + body);
    expect(p.rows).toHaveLength(LIMITS.maxRows);
    expect(p.warnings.join(" ")).toMatch(/first 5000/);
  });
  it("names blank headers", () => {
    expect(csv("a,,c\n1,2,3").headers[1]).toBe("Column 2");
  });
});

describe("detectMapping", () => {
  it("recognises common column names in any order and case", () => {
    const headers = ["Created At", "Customer ID", "Feedback Text", "Channel", "Customer Segment", "Subscription Tier", "Stars", "Product Area"];
    const m = detectMapping(headers, [["2026-01-01", "c1", "x".repeat(40), "Email", "SMB", "Team", "4", "Billing"]]);
    expect(m).toEqual({ date: 0, customer: 1, text: 2, source: 3, segment: 4, plan: 5, rating: 6, productArea: 7 });
  });
  it("falls back to the longest text column when no header matches", () => {
    const rows = [["a", "this is a long enough customer comment about the product", "1"], ["b", "another reasonably long comment about something else here", "2"]];
    expect(detectMapping(["x", "y", "z"], rows).text).toBe(1);
  });
  it("does not require every field", () => {
    expect(detectMapping(["comment"], [["hello world"]])).toEqual({ text: 0 });
  });
});

describe("applyMapping validation", () => {
  const base = { headers: ["text", "customer", "date", "rating"] };
  it("requires a text column", () => {
    expect(() => applyMapping({ ...base, rows: [["a", "b", "c", "d"]] }, {})).toThrow(/feedback text/);
  });
  it("skips empty and too-short text and reports the row", () => {
    const r = applyMapping({ ...base, rows: [["", "c1", "", ""], ["ok", "c2", "", ""], ["A proper comment here", "c3", "", ""]] }, { text: 0, customer: 1 });
    expect(r.counts.imported).toBe(1);
    expect(r.counts.empty).toBe(2);
    expect(r.issues.map((i) => i.row)).toEqual([2, 3]);
  });
  it("detects duplicates within the file and against existing entries", () => {
    const rows = [["Same text here", "c1", "2026-01-01", ""], ["same   TEXT here!", "c1", "2026-01-01", ""], ["Same text here", "c2", "2026-01-01", ""], ["Other text here", "c1", "", ""]];
    const r = applyMapping({ ...base, rows }, { text: 0, customer: 1, date: 2 }, [{ text: "Other text here", customer: "c1", date: undefined }]);
    expect(r.counts.duplicates).toBe(2);
    expect(r.entries.map((e) => e.customer)).toEqual(["c1", "c2"]);
  });
  it("imports a row with a bad date or rating but drops the bad value and says so", () => {
    const r = applyMapping({ ...base, rows: [["A proper comment here", "c1", "not a date", "banana"]] }, { text: 0, customer: 1, date: 2, rating: 3 });
    expect(r.entries[0].date).toBeUndefined();
    expect(r.entries[0].rating).toBeUndefined();
    expect(r.counts.badDates).toBe(1);
    expect(r.counts.badRatings).toBe(1);
  });
  it("shortens very long text and removes control characters", () => {
    const r = applyMapping({ headers: ["t"], rows: [["x".repeat(LIMITS.maxTextChars + 50)], ["bad\u0000char\u0007 text here"]] }, { text: 0 });
    expect(r.entries[0].text).toHaveLength(LIMITS.maxTextChars);
    expect(r.counts.truncated).toBe(1);
    expect(r.entries[1].text).toBe("badchar text here");
  });
  it("gives every entry a unique id and keeps markup as plain text", () => {
    const r = applyMapping({ headers: ["t"], rows: [["<script>alert(1)</script> is in my feedback"], ["Another one here please"]] }, { text: 0 }, [], "x");
    expect(new Set(r.entries.map((e) => e.id)).size).toBe(2);
    expect(r.entries[0].text).toContain("<script>");
  });
});

describe("parseDate / parseRating / sanitize", () => {
  it("reads common date formats", () => {
    expect(parseDate("2026-03-07")).toBe("2026-03-07");
    expect(parseDate("2026-03-07T10:00:00Z")).toBe("2026-03-07");
    expect(parseDate("03/07/2026")).toBe("2026-03-07");
    expect(parseDate("25/03/2026")).toBe("2026-03-25");
    expect(parseDate("Mar 7, 2026")).toBe("2026-03-07");
  });
  it("rejects impossible or out-of-range dates", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("1850-01-01")).toBeNull();
    expect(parseDate("soon")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
  it("normalises ratings to 1-5", () => {
    expect(parseRating("4")).toBe(4);
    expect(parseRating("8")).toBe(4);
    expect(parseRating("3/5")).toBe(3);
    expect(parseRating("9/10")).toBe(4.5);
    expect(parseRating("11")).toBeNull();
    expect(parseRating("0")).toBeNull();
    expect(parseRating("great")).toBeNull();
  });
  it("sanitize collapses whitespace", () => {
    expect(sanitize("  a \n\t b  ")).toBe("a b");
  });
});

describe("parseFreeText", () => {
  it("splits blank-line separated paragraphs", () => {
    expect(parseFreeText("First comment\nstill first\n\nSecond comment").rows).toEqual([["First comment still first"], ["Second comment"]]);
  });
  it("uses one entry per line otherwise and strips bullets", () => {
    expect(parseFreeText("- one thing\n* two thing\n3. three thing").rows).toEqual([["one thing"], ["two thing"], ["three thing"]]);
  });
  it("rejects empty text", () => {
    expect(() => parseFreeText("  \n ")).toThrow(ImportError);
  });
});
