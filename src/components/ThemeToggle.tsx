"use client";
import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { toggleMode } from "@/lib/theme";

/**
 * One-click light/dark switch. Both icons are rendered and CSS shows the right one (the root
 * layout sets data-theme before first paint), so there is no flash and no hydration mismatch.
 */
export function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label="Toggle light and dark theme"
      title="Toggle light / dark theme"
      className={clsx("inline-flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2 text-[13px] text-ink2 transition-colors hover:bg-surface2 hover:text-ink", className)}
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
      {withLabel && (
        <>
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </>
      )}
    </button>
  );
}
