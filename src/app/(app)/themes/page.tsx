"use client";
import Link from "next/link";
import { useState } from "react";
import { ImportButton } from "@/components/ImportDialog";
import { Badge, Card, Empty, LevelBadge, PageHeader, Segmented, TrendBadge } from "@/components/ui";
import { effectivePriority } from "@/lib/engine/report";
import { useWorkspace } from "@/lib/store";
import { THEME_STATUS_LABELS, type ThemeStatus } from "@/lib/types";

type Filter = "all" | "open" | "praise";

export default function ThemesPage() {
  const { workspace, themes } = useWorkspace();
  const [filter, setFilter] = useState<Filter>("open");
  if (!workspace) return null;

  const status = (id: string): ThemeStatus => workspace.statuses[id] ?? "new";
  const list = themes.filter((t) => (filter === "praise" ? t.isPositive : filter === "open" ? !t.isPositive && !["addressed", "dismissed"].includes(status(t.id)) : true));

  return (
    <>
      <PageHeader
        title="Themes"
        description="Related feedback grouped by what customers are actually saying. Open a theme to see the evidence behind it."
        actions={<><Segmented label="Filter themes" value={filter} onChange={setFilter} options={[{ value: "open", label: "Open problems" }, { value: "praise", label: "Praise" }, { value: "all", label: "All" }]} /><ImportButton /></>}
      />
      {themes.length === 0 ? (
        <Empty title="No themes yet" action={<ImportButton variant="primary" />}>Themes appear once you import feedback.</Empty>
      ) : list.length === 0 ? (
        <Empty title="Nothing here">No themes match this filter.</Empty>
      ) : (
        <ul className="grid gap-3">
          {list.map((t) => {
            const p = effectivePriority(t, workspace.priorityOverrides);
            const s = status(t.id);
            const quote = t.quotes[0];
            return (
              <li key={t.id}>
                <Link href={`/themes/${t.id}`} className="block rounded-lg border border-line bg-surface p-4 shadow-[var(--shadow)] transition-colors hover:border-linestrong">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-[15px] font-medium text-ink">{t.title}</h2>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {!t.isPositive && <LevelBadge level={p.level} prefix={p.overridden ? "Your priority: " : "Suggested: "} />}
                      <TrendBadge trend={t.trend.label} explain={t.trend.explanation} />
                      <Badge tone={s === "new" ? "accent" : "neutral"}>{THEME_STATUS_LABELS[s]}</Badge>
                      {t.weakEvidence && <Badge tone="warn">Thin evidence</Badge>}
                    </div>
                  </div>
                  <p className="mt-1 text-[13px] text-ink2">{t.description}</p>
                  {quote && <blockquote className="mt-3 border-l-2 border-linestrong pl-3 text-[13px] italic text-muted">&ldquo;{quote.text.length > 200 ? quote.text.slice(0, 197) + "…" : quote.text}&rdquo;</blockquote>}
                  <p className="mt-2 text-xs text-muted">{t.productArea}{t.firstSeen ? ` · ${t.firstSeen} to ${t.lastSeen}` : ""}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Card className="mt-6" title="How themes are formed">
        <p className="text-[13px] text-ink2">Each entry is matched to a topic from its own wording. Entries that match no topic are clustered by similarity. Quotes and counts come straight from your data; the problem statement and priority are automated interpretations you should check.</p>
      </Card>
    </>
  );
}
