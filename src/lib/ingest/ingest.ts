/**
 * Importing feedback: CSV / TXT / pasted text, column mapping and validation.
 * Nothing here trusts its input: sizes are capped, control characters are stripped,
 * and every rejected or adjusted row is reported back to the user.
 */
import Papa from "papaparse";
import type { FeedbackEntry } from "../types";
import { dedupeKey } from "../engine/text";

export const LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxRows: 5000,
  maxTextChars: 4000,
  minTextChars: 3,
};

export type Field = "text" | "customer" | "source" | "date" | "segment" | "plan" | "rating" | "productArea";
export const FIELD_LABELS: Record<Field, string> = {
  text: "Feedback text",
  customer: "Customer name or ID",
  source: "Source",
  date: "Date",
  segment: "Customer segment",
  plan: "Plan or tier",
  rating: "Rating",
  productArea: "Product area",
};
export const FIELDS = Object.keys(FIELD_LABELS) as Field[];
export type Mapping = Partial<Record<Field, number>>;

const SYNONYMS: Record<Field, string[]> = {
  text: ["feedback", "feedback text", "text", "comment", "comments", "message", "body", "review", "description", "response", "verbatim", "note", "notes", "content", "ticket"],
  customer: ["customer", "customer name", "customer id", "customer_id", "account", "company", "user", "user id", "user_id", "name", "client", "email", "organization", "org"],
  source: ["source", "channel", "origin", "medium", "platform", "type of feedback"],
  date: ["date", "created", "created at", "created_at", "submitted", "timestamp", "time", "received", "day", "datetime"],
  segment: ["segment", "customer segment", "tier segment", "size", "company size", "industry", "cohort", "persona", "customer type"],
  plan: ["plan", "tier", "subscription", "subscription tier", "pricing plan", "license", "package"],
  rating: ["rating", "score", "stars", "nps", "csat", "satisfaction", "star rating"],
  productArea: ["product area", "area", "feature", "module", "component", "category", "topic", "product"],
};

const norm = (s: string) => s.toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();

export interface Parsed {
  headers: string[];
  rows: string[][];
  warnings: string[];
}

export class ImportError extends Error {}

export function parseCsv(text: string, sizeBytes = text.length): Parsed {
  if (sizeBytes > LIMITS.maxBytes) throw new ImportError(`File is larger than ${LIMITS.maxBytes / 1024 / 1024} MB. Split it into smaller files.`);
  const clean = text.replace(/^﻿/, "");
  if (!clean.trim()) throw new ImportError("The file is empty.");
  const result = Papa.parse<string[]>(clean, { skipEmptyLines: "greedy" });
  const data = (result.data as string[][]).filter((r) => Array.isArray(r));
  if (data.length < 2) throw new ImportError("The file needs a header row and at least one data row.");
  const warnings: string[] = [];
  const fatal = result.errors.filter((e) => e.type === "Quotes");
  if (fatal.length > 0) warnings.push(`${fatal.length} row(s) have unbalanced quotes and may be merged with their neighbours.`);
  const headers = data[0].map((h, i) => (h ?? "").trim() || `Column ${i + 1}`);
  let rows = data.slice(1);
  if (rows.length > LIMITS.maxRows) {
    warnings.push(`Only the first ${LIMITS.maxRows} of ${rows.length} rows will be imported.`);
    rows = rows.slice(0, LIMITS.maxRows);
  }
  return { headers, rows, warnings };
}

/** Guesses which column holds which field, using header names and, for text, the column content. */
export function detectMapping(headers: string[], rows: string[][]): Mapping {
  const mapping: Mapping = {};
  const taken = new Set<number>();
  const hs = headers.map(norm);
  for (const field of FIELDS) {
    let idx = hs.findIndex((h, i) => !taken.has(i) && SYNONYMS[field].includes(h));
    if (idx < 0) idx = hs.findIndex((h, i) => !taken.has(i) && SYNONYMS[field].some((s) => s.length > 3 && h.includes(s)));
    if (idx >= 0) {
      mapping[field] = idx;
      taken.add(idx);
    }
  }
  if (mapping.text === undefined) {
    // Fall back to the column with the longest average text.
    let best = -1;
    let bestAvg = 0;
    headers.forEach((_, i) => {
      if (taken.has(i)) return;
      const avg = rows.slice(0, 50).reduce((a, r) => a + (r[i]?.length ?? 0), 0) / Math.max(Math.min(rows.length, 50), 1);
      if (avg > bestAvg) {
        bestAvg = avg;
        best = i;
      }
    });
    if (best >= 0 && bestAvg >= 20) mapping.text = best;
  }
  return mapping;
}

export function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    y = Number(match[3]);
    // Day first only when it cannot be a month; otherwise assume month first.
    [m, d] = a > 12 ? [b, a] : [a, b];
  } else {
    const t = Date.parse(s);
    if (Number.isNaN(t)) return null;
    // Text dates such as "Mar 7, 2026" are parsed as local midnight, so read them back in local time.
    const dt = new Date(t);
    [y, m, d] = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()];
  }
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const check = new Date(iso + "T00:00:00Z");
  if (check.getUTCMonth() + 1 !== m) return null;
  return iso;
}

/** Normalises a rating to 1 to 5. Accepts 1-5, 1-10 (halved) and "4/5" style values. */
export function parseRating(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?$/);
  if (!m) return null;
  let v = Number(m[1]);
  const max = m[2] ? Number(m[2]) : v > 5 && v <= 10 ? 10 : 5;
  if (!max || v < 0 || v > max) return null;
  if (max !== 5) v = (v / max) * 5;
  if (v < 1) return null;
  return Math.round(Math.min(5, v) * 10) / 10;
}

export function sanitize(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
}

export interface ImportIssue {
  row: number;
  kind: "empty" | "too_short" | "duplicate" | "bad_date" | "bad_rating" | "truncated";
  message: string;
}

export interface ImportPreview {
  entries: FeedbackEntry[];
  issues: ImportIssue[];
  counts: { rows: number; imported: number; empty: number; duplicates: number; badDates: number; badRatings: number; truncated: number };
}

export function applyMapping(
  parsed: Pick<Parsed, "headers" | "rows">,
  mapping: Mapping,
  existing: Pick<FeedbackEntry, "text" | "customer" | "date">[] = [],
  idPrefix = "imp",
): ImportPreview {
  if (mapping.text === undefined) throw new ImportError("Choose which column holds the feedback text.");
  const seen = new Set(existing.map((e) => `${dedupeKey(e.text)}|${e.customer ?? ""}|${e.date ?? ""}`));
  const issues: ImportIssue[] = [];
  const entries: FeedbackEntry[] = [];
  const counts = { rows: parsed.rows.length, imported: 0, empty: 0, duplicates: 0, badDates: 0, badRatings: 0, truncated: 0 };
  const cell = (r: string[], f: Field) => (mapping[f] === undefined ? undefined : sanitize(r[mapping[f] as number] ?? "")) || undefined;

  parsed.rows.forEach((r, i) => {
    const rowNo = i + 2; // header is row 1
    let text = cell(r, "text") ?? "";
    if (!text) {
      counts.empty++;
      issues.push({ row: rowNo, kind: "empty", message: "No feedback text. Skipped." });
      return;
    }
    if (text.length < LIMITS.minTextChars) {
      counts.empty++;
      issues.push({ row: rowNo, kind: "too_short", message: `Text is shorter than ${LIMITS.minTextChars} characters. Skipped.` });
      return;
    }
    if (text.length > LIMITS.maxTextChars) {
      text = text.slice(0, LIMITS.maxTextChars);
      counts.truncated++;
      issues.push({ row: rowNo, kind: "truncated", message: `Text longer than ${LIMITS.maxTextChars} characters was shortened.` });
    }
    const rawDate = cell(r, "date");
    const date = parseDate(rawDate) ?? undefined;
    if (rawDate && !date) {
      counts.badDates++;
      issues.push({ row: rowNo, kind: "bad_date", message: `Could not read the date "${rawDate.slice(0, 30)}". Imported without a date.` });
    }
    const rawRating = cell(r, "rating");
    const rating = parseRating(rawRating) ?? undefined;
    if (rawRating && rating === undefined) {
      counts.badRatings++;
      issues.push({ row: rowNo, kind: "bad_rating", message: `Could not read the rating "${rawRating.slice(0, 20)}". Imported without a rating.` });
    }
    const customer = cell(r, "customer");
    const key = `${dedupeKey(text)}|${customer ?? ""}|${date ?? ""}`;
    if (seen.has(key)) {
      counts.duplicates++;
      issues.push({ row: rowNo, kind: "duplicate", message: "Same text, customer and date as another entry. Skipped." });
      return;
    }
    seen.add(key);
    entries.push({
      id: `${idPrefix}-${String(entries.length + 1).padStart(4, "0")}`,
      text,
      customer,
      source: cell(r, "source"),
      date,
      segment: cell(r, "segment"),
      plan: cell(r, "plan"),
      rating,
      productArea: cell(r, "productArea"),
    });
  });
  counts.imported = entries.length;
  return { entries, issues, counts };
}

/** TXT and pasted text: blank-line separated paragraphs, or one entry per line. */
export function parseFreeText(text: string): Parsed {
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!clean.trim()) throw new ImportError("There is no text to import.");
  if (clean.length > LIMITS.maxBytes) throw new ImportError(`Text is larger than ${LIMITS.maxBytes / 1024 / 1024} MB.`);
  const blocks = /\n\s*\n/.test(clean) ? clean.split(/\n\s*\n/) : clean.split("\n");
  let rows = blocks
    .map((b) => b.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((t) => [t]);
  const warnings: string[] = [];
  if (rows.length > LIMITS.maxRows) {
    warnings.push(`Only the first ${LIMITS.maxRows} of ${rows.length} entries will be imported.`);
    rows = rows.slice(0, LIMITS.maxRows);
  }
  return { headers: ["Feedback text"], rows, warnings };
}

export function looksLikeCsv(name: string, text: string): boolean {
  if (/\.csv$/i.test(name)) return true;
  const first = text.split("\n", 1)[0] ?? "";
  return (first.match(/,/g)?.length ?? 0) >= 1 && /\n/.test(text) && !/\.txt$/i.test(name);
}
