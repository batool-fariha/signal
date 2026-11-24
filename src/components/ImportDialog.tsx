"use client";
import clsx from "clsx";
import { FileUp, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SAMPLE_DESCRIPTION, SAMPLE_PRODUCT } from "@/lib/sample/flowdesk";
import { applyMapping, detectMapping, FIELD_LABELS, FIELDS, ImportError, LIMITS, parseCsv, parseFreeText, type Field, type Mapping, type Parsed } from "@/lib/ingest/ingest";
import { useWorkspace } from "@/lib/store";
import { Badge, Button, Meter, Notice, Select } from "./ui";

type Step = "choose" | "map" | "working" | "done";
type Tab = "upload" | "paste" | "sample";

export function ImportButton({ variant = "secondary" }: { variant?: "primary" | "secondary" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Import feedback
      </Button>
      {open && <ImportDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function ImportDialog({ onClose }: { onClose: () => void }) {
  const { workspace, importEntries, loadSample } = useWorkspace();
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [tab, setTab] = useState<Tab>("upload");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [source, setSource] = useState("");
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [added, setAdded] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const preview = useMemo(() => {
    if (!parsed || mapping.text === undefined) return null;
    try {
      return applyMapping(parsed, mapping, workspace?.entries ?? [], `imp${Date.now().toString(36)}`);
    } catch {
      return null;
    }
  }, [parsed, mapping, workspace?.entries]);

  async function readFile(file: File) {
    setError(null);
    if (!/\.(csv|txt)$/i.test(file.name)) return setError(`"${file.name}" is not supported. Upload a .csv or .txt file, or paste the text instead.`);
    if (file.size > LIMITS.maxBytes) return setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${LIMITS.maxBytes / 1024 / 1024} MB; split it into smaller files.`);
    try {
      const text = await file.text();
      const p = /\.csv$/i.test(file.name) ? parseCsv(text, file.size) : parseFreeText(text);
      begin(p, file.name);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "That file could not be read.");
    }
  }

  function begin(p: Parsed, name: string) {
    const m: Mapping = p.headers.length === 1 ? { text: 0 } : detectMapping(p.headers, p.rows);
    setParsed(p);
    setMapping(m);
    setSource(name);
    setStep("map");
  }

  function usePaste() {
    setError(null);
    try {
      begin(parseFreeText(paste), "Pasted text");
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "That text could not be read.");
    }
  }

  async function run(fn: () => Promise<number>) {
    setStep("working");
    setProgress({ done: 0, total: 0 });
    try {
      setAdded(await fn());
      setStep("done");
    } catch {
      setError("Something went wrong while processing. Nothing was imported.");
      setStep("choose");
    }
  }

  const doImport = () =>
    run(async () => {
      let entries = preview?.entries ?? [];
      const label = /\.csv$|\.txt$/i.test(source) || source === "Pasted text" ? source.replace(/\.(csv|txt)$/i, "") : "";
      if (mapping.source === undefined && label) entries = entries.map((e) => ({ ...e, source: label }));
      return importEntries(entries, (done, total) => setProgress({ done, total }));
    });

  const multiColumn = (parsed?.headers.length ?? 0) > 1;

  return (
    <dialog ref={ref} onClose={onClose} onCancel={(e) => step === "working" && e.preventDefault()} aria-labelledby="import-title" className="m-auto w-[min(720px,calc(100vw-24px))] rounded-xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 id="import-title" className="text-[15px] font-semibold">Import feedback</h2>
        <button aria-label="Close" onClick={() => ref.current?.close()} className="rounded p-1 text-muted hover:bg-surface2"><X className="size-4" /></button>
      </div>

      <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
        {error && <div className="mb-3"><Notice tone="neg">{error}</Notice></div>}

        {step === "choose" && (
          <>
            <div role="tablist" aria-label="Import method" className="mb-4 flex gap-1 border-b border-line">
              {([["upload", "Upload file"], ["paste", "Paste text"], ["sample", "Sample dataset"]] as [Tab, string][]).map(([t, label]) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setError(null); }} className={clsx("-mb-px border-b-2 px-3 py-2 text-[13px]", tab === t ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "upload" && (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) void readFile(f); }}
                className={clsx("flex cursor-pointer flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center", dragging ? "border-accent bg-accentsoft" : "border-linestrong hover:bg-surface2")}
              >
                <FileUp className="size-6 text-muted" aria-hidden />
                <span className="mt-2 text-sm font-medium">Drop a CSV or TXT file here, or choose one</span>
                <span className="mt-1 text-xs text-muted">CSV needs a header row. You will map the columns next. Up to {LIMITS.maxBytes / 1024 / 1024} MB and {LIMITS.maxRows.toLocaleString()} rows.</span>
                <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.target.value = ""; }} />
              </label>
            )}

            {tab === "paste" && (
              <div>
                <label htmlFor="paste" className="text-[13px] font-medium">Paste feedback</label>
                <p className="mt-0.5 text-xs text-muted">Separate entries with a blank line, or put one entry per line.</p>
                <textarea id="paste" value={paste} onChange={(e) => setPaste(e.target.value)} rows={9} className="mt-2 w-full rounded-md border border-linestrong bg-bg p-3 text-sm" placeholder={"The dashboard takes forever to load.\n\nWe never got a Slack notification for the reassignment."} />
                <div className="mt-3 flex justify-end"><Button variant="primary" disabled={!paste.trim()} onClick={usePaste}>Continue</Button></div>
              </div>
            )}

            {tab === "sample" && (
              <div className="rounded-lg border border-line bg-surface2 p-4">
                <h3 className="text-sm font-medium">{SAMPLE_PRODUCT} sample dataset</h3>
                <p className="mt-1 text-[13px] text-ink2">{SAMPLE_DESCRIPTION}</p>
                <p className="mt-2 text-xs text-muted">Fictional data written for this demo. Entries already in your workspace are not duplicated.</p>
                <div className="mt-3"><Button variant="primary" onClick={() => run(() => loadSample((done, total) => setProgress({ done, total })))}>Add the sample dataset</Button></div>
              </div>
            )}
          </>
        )}

        {step === "map" && parsed && (
          <>
            <p className="text-sm text-ink2"><span className="font-medium text-ink">{source}</span>: {parsed.rows.length.toLocaleString()} {parsed.rows.length === 1 ? "row" : "rows"} found.</p>
            {parsed.warnings.map((w) => <div key={w} className="mt-2"><Notice tone="warn">{w}</Notice></div>)}

            {multiColumn && (
              <fieldset className="mt-4">
                <legend className="text-[13px] font-medium">Match your columns <span className="font-normal text-muted">(only feedback text is required)</span></legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {FIELDS.map((f: Field) => (
                    <div key={f} className="flex items-center justify-between gap-2">
                      <label htmlFor={`map-${f}`} className="text-[13px] text-ink2">{FIELD_LABELS[f]}{f === "text" && <span className="text-neg"> *</span>}</label>
                      <Select id={`map-${f}`} value={mapping[f] ?? ""} className="w-44" onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value === "" ? undefined : Number(e.target.value) }))}>
                        <option value="">{f === "text" ? "Choose a column" : "Not in my data"}</option>
                        {parsed.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                      </Select>
                    </div>
                  ))}
                </div>
              </fieldset>
            )}

            {mapping.text === undefined ? (
              <div className="mt-4"><Notice tone="warn">Choose the column that contains the feedback text to continue.</Notice></div>
            ) : preview ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge tone="pos">{preview.counts.imported} will be imported</Badge>
                  {preview.counts.empty > 0 && <Badge tone="warn">{preview.counts.empty} empty or too short</Badge>}
                  {preview.counts.duplicates > 0 && <Badge tone="warn">{preview.counts.duplicates} duplicates</Badge>}
                  {preview.counts.badDates > 0 && <Badge tone="warn">{preview.counts.badDates} unreadable dates</Badge>}
                  {preview.counts.badRatings > 0 && <Badge tone="warn">{preview.counts.badRatings} unreadable ratings</Badge>}
                  {preview.counts.truncated > 0 && <Badge tone="warn">{preview.counts.truncated} shortened</Badge>}
                </div>
                <div className="mt-3 overflow-x-auto rounded-md border border-line">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">Preview of the first imported entries</caption>
                    <thead className="bg-surface2 text-muted"><tr>{["Text", "Customer", "Source", "Date", "Segment", "Rating"].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
                    <tbody>
                      {preview.entries.slice(0, 5).map((e) => (
                        <tr key={e.id} className="border-t border-line">
                          <td className="max-w-[280px] truncate px-3 py-2" title={e.text}>{e.text}</td>
                          <td className="px-3 py-2">{e.customer ?? "–"}</td>
                          <td className="px-3 py-2">{e.source ?? "–"}</td>
                          <td className="tabnum px-3 py-2">{e.date ?? "–"}</td>
                          <td className="px-3 py-2">{e.segment ?? "–"}</td>
                          <td className="px-3 py-2">{e.rating ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.issues.length > 0 && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-ink2">See {preview.issues.length} {preview.issues.length === 1 ? "issue" : "issues"}</summary>
                    <ul className="mt-2 space-y-1 text-muted">
                      {preview.issues.slice(0, 12).map((i, k) => <li key={k}>Row {i.row}: {i.message}</li>)}
                      {preview.issues.length > 12 && <li>…and {preview.issues.length - 12} more.</li>}
                    </ul>
                  </details>
                )}
                {preview.counts.imported === 0 && <div className="mt-3"><Notice tone="warn">Nothing valid to import with this mapping.</Notice></div>}
              </>
            ) : null}

            <div className="mt-5 flex justify-between gap-2">
              <Button variant="ghost" onClick={() => { setStep("choose"); setParsed(null); }}>Back</Button>
              <Button variant="primary" disabled={!preview || preview.counts.imported === 0} onClick={doImport}>Import {preview?.counts.imported ?? 0} {preview?.counts.imported === 1 ? "entry" : "entries"}</Button>
            </div>
          </>
        )}

        {step === "working" && (
          <div role="status" aria-live="polite" className="py-8 text-center">
            <p className="text-sm font-medium">Analysing feedback…</p>
            <p className="mt-1 text-xs text-muted">Categorising, scoring sentiment and grouping into themes.</p>
            <div className="mx-auto mt-4 max-w-xs"><Meter value={progress.total ? progress.done / progress.total : 0.05} label="Progress" /></div>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center">
            <p className="text-[15px] font-medium">Imported {added} {added === 1 ? "entry" : "entries"}.</p>
            <p className="mt-1 text-sm text-muted">They are categorised and grouped into themes.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/themes" onClick={() => ref.current?.close()} className="inline-flex h-9 items-center rounded-md border border-ink bg-ink px-3 text-[13px] font-medium text-bg">Explore themes</Link>
              <Link href="/feedback" onClick={() => ref.current?.close()} className="inline-flex h-9 items-center rounded-md border border-linestrong px-3 text-[13px] font-medium">View feedback</Link>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
