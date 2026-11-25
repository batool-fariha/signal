"use client";
import { useState } from "react";
import { Button, Card, Notice, PageHeader, Segmented } from "@/components/ui";
import { heuristicProvider } from "@/lib/ai/provider";
import { useWorkspace } from "@/lib/store";
import { setMode, useThemeMode, type ThemeMode } from "@/lib/theme";

export default function Settings() {
  const { workspace, renameWorkspace, deleteWorkspace } = useWorkspace();
  const [draft, setDraft] = useState<string | null>(null);
  const theme = useThemeMode();
  const [confirm, setConfirm] = useState(false);
  const name = draft ?? workspace?.name ?? "";
  const setName = (v: string) => setDraft(v);

  if (!workspace) return null;
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-2xl gap-4">
        <Card title="Workspace">
          <label htmlFor="name" className="text-[13px] text-ink2">Name</label>
          <div className="mt-1.5 flex gap-2">
            <input id="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="h-9 flex-1 rounded-md border border-linestrong bg-bg px-3 text-sm" />
            <Button disabled={!name.trim() || name === workspace.name} onClick={() => { renameWorkspace(name); setDraft(null); }}>Save</Button>
          </div>
          <p className="mt-2 text-xs text-muted">{workspace.entries.length} entries · created {workspace.createdAt.slice(0, 10)}</p>
        </Card>

        <Card title="Appearance">
          <Segmented<ThemeMode> label="Theme" value={theme} onChange={setMode} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} />
        </Card>

        <Card title="Analysis engine">
          <p className="text-[13px] text-ink2"><span className="font-medium text-ink">{heuristicProvider.label}.</span> Categories, sentiment and themes are produced by an inspectable, rule-based analyser that runs entirely in your browser, so no feedback is sent anywhere.</p>
          <p className="mt-2 text-xs text-muted">The analysis layer is a provider interface. A language-model provider can be added on the server without changing the rest of the app; its output is validated and any quoted excerpt must appear in the original feedback. See the README.</p>
        </Card>

        <Card title="Your data">
          <p className="text-[13px] text-ink2">Your workspace is stored only in this browser. Clearing site data or switching browsers removes it, so export a JSON backup from Reports if it matters.</p>
          {confirm ? (
            <div className="mt-3 space-y-2">
              <Notice tone="neg">This deletes the workspace, all feedback, statuses, priorities and briefs from this browser. It cannot be undone.</Notice>
              <div className="flex gap-2"><Button variant="danger" onClick={deleteWorkspace}>Delete everything</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button></div>
            </div>
          ) : (
            <Button variant="danger" className="mt-3" onClick={() => setConfirm(true)}>Delete workspace…</Button>
          )}
        </Card>
      </div>
    </>
  );
}
