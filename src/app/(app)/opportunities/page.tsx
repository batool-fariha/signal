"use client";
import Link from "next/link";
import { Fragment, useState } from "react";
import { ImportButton } from "@/components/ImportDialog";
import { Card, Empty, LevelBadge, Meter, PageHeader, Select } from "@/components/ui";
import { effectivePriority } from "@/lib/engine/report";
import { useWorkspace } from "@/lib/store";
import type { Level, PriorityFactor } from "@/lib/types";

function Cell({ f }: { f: PriorityFactor }) {
  return (
    <td className="px-2 py-3 align-top">
      <div className="w-20">
        <span className="text-xs capitalize text-ink2">{f.level}</span>
        {f.level !== "unknown" && <div className="mt-1.5"><Meter value={f.score} label={`${f.level} score`} /></div>}
      </div>
    </td>
  );
}

export default function Opportunities() {
  const { workspace, themes, setPriority } = useWorkspace();
  const [open, setOpen] = useState<string | null>(null);
  if (!workspace) return null;
  const problems = themes.filter((t) => !t.isPositive);

  return (
    <>
      <PageHeader title="Opportunities" description="Each theme scored on five separate factors. The suggestion is a starting point: frequency is not impact, and negative tone is not priority. Adjust it with what you know." actions={<ImportButton />} />
      {problems.length === 0 ? (
        <Empty title="No opportunities yet" action={<ImportButton variant="primary" />}>Import feedback to see themes assessed here.</Empty>
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <caption className="sr-only">Themes with frequency, severity, customer impact, business relevance, confidence and priority</caption>
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Theme</th>
                  {["Frequency", "Severity", "Impact", "Business", "Confidence"].map((h) => <th key={h} scope="col" className="px-2 py-2 font-medium">{h}</th>)}
                  <th scope="col" className="px-2 py-2 font-medium">Suggested</th>
                  <th scope="col" className="px-2 py-2 font-medium">Your priority</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((t) => {
                  const p = effectivePriority(t, workspace.priorityOverrides);
                  const isOpen = open === t.id;
                  return (
                    <Fragment key={t.id}>
                      <tr className="border-b border-line">
                        <td className="max-w-[260px] px-4 py-3 align-top">
                          <Link href={`/themes/${t.id}`} className="font-medium text-ink hover:underline">{t.title}</Link>
                          <div className="mt-0.5 text-xs text-muted">{t.count} {t.count === 1 ? "entry" : "entries"}</div>
                          <button aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : t.id)} className="mt-1 text-xs text-accent hover:underline">{isOpen ? "Hide rationale" : "Show rationale"}</button>
                        </td>
                        <Cell f={t.priority.frequency} />
                        <Cell f={t.priority.severity} />
                        <Cell f={t.priority.customerImpact} />
                        <Cell f={t.priority.businessRelevance} />
                        <Cell f={t.priority.confidence} />
                        <td className="px-2 py-3 align-top"><LevelBadge level={t.priority.suggested} /></td>
                        <td className="px-2 py-3 align-top">
                          <label className="sr-only" htmlFor={`pr-${t.id}`}>Your priority for {t.title}</label>
                          <Select id={`pr-${t.id}`} value={workspace.priorityOverrides[t.id] ?? ""} className="h-8 w-32 text-xs" onChange={(e) => setPriority(t.id, (e.target.value || null) as Level | null)}>
                            <option value="">Use suggestion ({p.overridden ? t.priority.suggested : p.level})</option>
                            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                          </Select>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-line bg-surface2/50">
                          <td colSpan={8} className="px-4 py-3">
                            <p className="mb-2 text-xs text-ink2">{t.priority.explanation}</p>
                            <dl className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                              {([["Frequency", t.priority.frequency], ["Severity", t.priority.severity], ["Customer impact", t.priority.customerImpact], ["Business relevance", t.priority.businessRelevance], ["Confidence", t.priority.confidence]] as [string, PriorityFactor][]).map(([k, f]) => (
                                <div key={k}><dt className="font-medium text-ink">{k}</dt><dd className="text-muted">{f.rationale}</dd></div>
                              ))}
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
