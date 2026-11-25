import { Code } from "lucide-react";
import { Logo } from "./Logo";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { GithubMark, LinkedinMark } from "./BrandIcons";

const iconLink = "inline-grid size-10 place-items-center rounded-full border border-line bg-surface text-ink2 transition-colors hover:border-linestrong hover:text-ink";
const textLink = "underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent";

/** Site footer, matching PRD Doctor: who built it, the privacy promise, and author links. */
export function Footer() {
  return (
    <footer className="no-print border-t border-line bg-surface/40 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-8">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-ink2">
            Designed and built by{" "}
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className={textLink}>{SITE.author}</a>.
          </p>
          <p className="mt-1 text-xs text-muted">Free, no account. Your feedback never leaves your browser.</p>
          <Link href="/#how" className={`mt-1 inline-flex min-h-10 items-center text-sm text-ink2 ${textLink}`}>How it works</Link>
        </div>
        <nav aria-label="Author links" className="flex items-center gap-2">
          <a href={SITE.github} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label={`${SITE.author} on GitHub`} title="GitHub"><GithubMark className="size-[18px]" /></a>
          <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label={`${SITE.author} on LinkedIn`} title="LinkedIn"><LinkedinMark className="size-[18px]" /></a>
          <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label="Signal source code" title="Source code"><Code className="size-[18px]" aria-hidden /></a>
        </nav>
      </div>
    </footer>
  );
}
