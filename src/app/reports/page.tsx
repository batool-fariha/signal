"use client";
import { Download, Printer } from "lucide-react";
import Link from "next/link";
import { ImportButton } from "@/components/ImportDialog";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { downloadText, fileSlug } from "@/lib/download";
import { briefToMarkdown } from "@/lib/engine/brief";
import { entriesToCsv, reportMarkdown, themesToCsv } from "@/lib/engine/report";
import { useWorkspace } from "@/lib/store";

export default function Reports() {
  const { workspace, themes } = useWorkspace();
  if (!workspace) return null;
  const slug = fileSlug(workspace.name);
  const briefs = Object.values(workspace.briefs);
  const md = reportMarkdown(workspace, themes);
  const themeOf = new Map(themes.flatMap((t) => t.entryIds.map((id) => [id, t.title] as const)));

  return (
    <>
      <PageHeader
        title="Reports"
        description="Export what you have found. Everything is generated in your browser and downloaded directly; nothing is uploaded."
        actions={workspace.entries.length > 0 ? <><Button onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Print or save as PDF</Button><Button variant="primary" onClick={() => downloadText(`${slug}-report.md`, md, "text/markdown")}><Download className="size-4" aria-hidden /> Download report</Button></> : <ImportButton variant="primary" />}
      />
      {workspace.entries.length === 0 ? (
        <Empty title="Nothing to report yet" action={<ImportButton variant="primary" />}>Import feedback first.</Empty>
      ) : (
        <>
          <div className="no-print grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Findings report", d: "Themes, priorities, evidence and caveats.", f: `${slug}-report.md`, c: md, m: "text/markdown" },
              { t: "Themes (CSV)", d: "One row per theme, with status and your priority.", f: `${slug}-themes.csv`, c: themesToCsv(themes, workspace), m: "text/csv" },
              { t: "Feedback (CSV)", d: "Every entry with its category, sentiment and theme.", f: `${slug}-feedback.csv`, c: entriesToCsv(workspace.entries, themeOf), m: "text/csv" },
              { t: "Workspace (JSON)", d: "Everything, so you can back it up or move it.", f: `${slug}-workspace.json`, c: JSON.stringify(workspace, null, 2), m: "application/json" },
            ].map((x) => (
              <Card key={x.f}>
                <h2 className="text-[13px] font-medium">{x.t}</h2>
                <p className="mt-1 text-xs text-muted">{x.d}</p>
                <Button size="sm" className="mt-3" onClick={() => downloadText(x.f, x.c, x.m)}><Download className="size-3.5" aria-hidden /> Download</Button>
              </Card>
            ))}
          </div>

          {briefs.length > 0 && (
            <Card title="Product briefs (drafts)" className="no-print mt-4" pad={false}>
              <ul className="divide-y divide-line">
                {briefs.map((b) => (
                  <li key={b.themeId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <Link href={`/themes/${b.themeId}#brief`} className="text-[13px] font-medium hover:underline">{b.title}</Link>
                    <Button size="sm" onClick={() => downloadText(`brief-${fileSlug(b.title)}.md`, briefToMarkdown(b), "text/markdown")}><Download className="size-3.5" aria-hidden /> Markdown</Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Report preview" className="mt-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink2">{md}</pre>
          </Card>
        </>
      )}
    </>
  );
}
