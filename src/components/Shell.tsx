"use client";
import clsx from "clsx";
import { BarChart3, FileText, Inbox, Layers, LayoutDashboard, Settings, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useWorkspace } from "@/lib/store";
import { Button, Notice, Spinner } from "./ui";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/feedback", label: "Feedback", icon: Inbox },
  { href: "/themes", label: "Themes", icon: Layers },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
      <span aria-hidden className="grid size-6 place-items-center rounded-md bg-ink text-bg">
        <BarChart3 className="size-3.5" />
      </span>
      Signal
    </span>
  );
}

function CreateWorkspace() {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<null | "sample" | "blank">(null);

  async function go(sample: boolean) {
    setBusy(sample ? "sample" : "blank");
    await createWorkspace(name || (sample ? "Flowdesk feedback" : "My workspace"), sample);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>
      <h1 className="mt-8 text-3xl font-semibold text-ink">Turn scattered customer feedback into product signals.</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink2">
        Import support tickets, reviews, call notes or survey answers. Signal groups them into themes, shows the evidence behind each one, and suggests what is worth investigating. It helps you decide; it does not decide for you.
      </p>
      <div className="mt-8 rounded-lg border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <label htmlFor="ws-name" className="text-[13px] font-medium text-ink">Name your workspace</label>
        <input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme product feedback" maxLength={80} className="mt-2 h-10 w-full rounded-md border border-linestrong bg-bg px-3 text-sm text-ink placeholder:text-muted" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" disabled={busy !== null} onClick={() => go(true)}>
            {busy === "sample" ? "Loading sample…" : "Start with the sample dataset"}
          </Button>
          <Button disabled={busy !== null} onClick={() => go(false)}>
            {busy === "blank" ? "Creating…" : "Start empty and import my own"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">The sample is 115 fictional entries for Flowdesk, a project management tool. No account or API key is needed, and your data stays in this browser.</p>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { ready, workspace, saveError } = useWorkspace();
  const path = usePathname();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Opening workspace" />
      </div>
    );
  }
  if (!workspace) return <CreateWorkspace />;

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="no-print hidden border-r border-line bg-surface md:block">
        <div className="sticky top-0 flex h-screen flex-col px-3 py-4">
          <div className="px-2"><Logo /></div>
          <div className="mt-4 truncate px-2 text-xs text-muted" title={workspace.name}>{workspace.name}</div>
          <nav aria-label="Main" className="mt-3 flex flex-col gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={clsx("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors", active(href) ? "bg-surface2 font-medium text-ink" : "text-ink2 hover:bg-surface2")}>
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 px-2">
            <ThemeToggle withLabel className="w-full" />
            <p className="text-[11px] leading-snug text-muted">Priorities and trends are suggestions for your judgement, not facts.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-10 border-b border-line bg-surface md:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <Logo />
            <span className="flex items-center gap-2">
              <span className="max-w-[35vw] truncate text-xs text-muted">{workspace.name}</span>
              <ThemeToggle />
            </span>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={clsx("flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs", active(href) ? "bg-surface2 font-medium text-ink" : "text-ink2")}>
                <Icon className="size-3.5" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
          {saveError && <div className="mb-4"><Notice tone="warn">{saveError}</Notice></div>}
          {children}
        </main>
      </div>
    </div>
  );
}
