/** Small, dependency-free text helpers used by the analysis engine. */

const STOPWORDS = new Set(
  (
    "a about above after again all also am an and any are as at be because been before being below between both but by can cannot could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not of off on once only or other our out over own same she should so some such than that the their theirs them then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours get got really still one two"
  ).split(" "),
);

export function normalise(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
}

/** Very light stemming: enough to match "loading" with "loads" and "reports" with "report". */
export function stem(word: string): string {
  let w = word;
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith("es")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return normalise(text)
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/'/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map(stem);
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Collapses text to a key used to find duplicate entries. */
export function dedupeKey(text: string): string {
  return normalise(text).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

export type Vector = Map<string, number>;

/** Builds L2-normalised TF-IDF vectors for a list of documents. */
export function tfidf(docs: string[][]): Vector[] {
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const n = Math.max(docs.length, 1);
  return docs.map((d) => {
    const tf = new Map<string, number>();
    for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
    const v: Vector = new Map();
    let norm = 0;
    for (const [t, c] of tf) {
      const w = (1 + Math.log(c)) * Math.log(1 + n / (df.get(t) ?? 1));
      v.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [t, w] of v) v.set(t, w / norm);
    return v;
  });
}

export function cosine(a: Vector, b: Vector): number {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, w] of small) {
    const o = large.get(t);
    if (o) dot += w * o;
  }
  return dot;
}

export function centroid(vectors: Vector[]): Vector {
  const c: Vector = new Map();
  for (const v of vectors) for (const [t, w] of v) c.set(t, (c.get(t) ?? 0) + w);
  let norm = 0;
  for (const w of c.values()) norm += w * w;
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of c) c.set(t, w / norm);
  return c;
}

export function topTerms(v: Vector, n: number): string[] {
  return [...v.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);
}

/** Compiles a lexicon entry. A trailing "*" matches any word ending. */
export function phraseRegex(phrase: string): RegExp {
  const esc = phrase.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const body = esc.endsWith("*") ? esc.slice(0, -1) + "\\w*" : esc;
  return new RegExp("\\b" + body + "\\b", "i");
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
