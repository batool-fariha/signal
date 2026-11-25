"use client";
import clsx from "clsx";
import { BarChart3, FileText, Inbox, Layers, LayoutDashboard, Settings, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useWorkspace } from "@/lib/store";
import { Notice, Spinner } from "./ui";
import { Landing } from "./Landing";
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
  if (!workspace) return <Landing />;

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
