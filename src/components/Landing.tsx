"use client";
import { ArrowRight, BarChart3, ClipboardList, FileSpreadsheet, FileText, Layers, Lock, Quote, Scale, ShieldCheck, Target } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { useWorkspace } from "@/lib/store";
import { ThemeToggle } from "./ThemeToggle";

const GITHUB = "https://github.com/batool-fariha/signal";

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

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line py-16 sm:py-20">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-2 max-w-2xl text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      {intro && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink2">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

type Busy = null | "sample" | "blank";

function TryButtons({ busy, onEnter, align = "start" }: { busy: Busy; onEnter: (sample: boolean) => void; align?: "start" | "center" }) {
  return (
    <div className={`flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
      <button type="button" disabled={busy !== null} onClick={() => onEnter(true)} className="inline-flex h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60">
        {busy === "sample" ? "Opening the sample…" : "Try it with sample data"} {busy !== "sample" && <ArrowRight className="size-4" aria-hidden />}
      </button>
      <button type="button" disabled={busy !== null} onClick={() => onEnter(false)} className="inline-flex h-11 items-center rounded-md border border-linestrong bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-surface2 disabled:opacity-60">
        {busy === "blank" ? "Opening…" : "Import my own feedback"}
      </button>
    </div>
  );
}

export function Landing() {
  const { createWorkspace } = useWorkspace();
  const [busy, setBusy] = useState<Busy>(null);

  async function enter(sample: boolean) {
    setBusy(sample ? "sample" : "blank");
    await createWorkspace(sample ? "Flowdesk feedback (sample)" : "My workspace", sample);
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <nav aria-label="Page" className="flex items-center gap-1 sm:gap-2">
            <a href="#why" className="hidden rounded-md px-2.5 py-1.5 text-[13px] text-ink2 hover:text-ink sm:inline">Why</a>
            <a href="#how" className="hidden rounded-md px-2.5 py-1.5 text-[13px] text-ink2 hover:text-ink sm:inline">How it works</a>
            <a href="#import" className="hidden rounded-md px-2.5 py-1.5 text-[13px] text-ink2 hover:text-ink sm:inline">Import</a>
            <a href={GITHUB} className="rounded-md px-2.5 py-1.5 text-[13px] text-ink2 hover:text-ink">GitHub</a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section aria-labelledby="hero-title" className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink2">
              <Lock className="size-3" aria-hidden /> Free · open source · runs in your browser
            </p>
            <h1 id="hero-title" className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Turn scattered customer feedback into product signals you can defend.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink2">
              Signal reads support tickets, reviews, call notes and survey answers, groups them into themes, and shows the exact customer words behind every conclusion. It helps you decide what to investigate. It does not decide for you.
            </p>
            <div className="mt-8"><TryButtons busy={busy} onEnter={enter} /></div>
            <p className="mt-4 text-xs text-muted">No sign-up and no API key. Your feedback never leaves this browser.</p>
          </div>
          <figure className="relative">
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_20px_60px_-20px_rgba(20,20,15,0.25)]">
              <Image src="/landing/overview.webp" alt="Signal's overview: 115 feedback entries, 12 themes, feedback volume over time, sentiment, and the most frequent themes" width={1180} height={760} priority unoptimized className="h-auto w-full" />
            </div>
            <figcaption className="sr-only">The overview dashboard with the built-in sample dataset.</figcaption>
          </figure>
        </section>

        {/* Why */}
        <Section id="why" eyebrow="Why it is useful" title="Feedback piles up faster than anyone can read it. Signal makes it decidable." intro="Product teams hear from customers in a dozen places. The same problem arrives worded twenty different ways, the loudest voice wins, and the quiet pattern gets missed. Signal is built for the moment you go from hundreds of comments to “what should we look into first?”">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Quote, t: "Evidence, not summaries", d: "Every theme links to the original entries, and every quote is the customer’s exact words. Nothing is paraphrased into something they did not say." },
              { icon: Scale, t: "Frequency is not impact", d: "How often something is mentioned, how severe it is, who is affected and whether revenue is at stake are scored separately, with the reasoning shown." },
              { icon: ShieldCheck, t: "Honest about uncertainty", d: "A trend is only called a trend with enough dated evidence. Thin themes are flagged, and missing data is shown as unknown rather than guessed." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-lg border border-line bg-surface p-5">
                <Icon className="size-5 text-accent" aria-hidden />
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink2">{d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* How */}
        <Section id="how" eyebrow="How it works" title="From a pile of comments to a brief in four steps">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <ol className="space-y-6">
              {[
                { icon: FileSpreadsheet, t: "Import", d: "Upload a CSV or text file, paste comments, or start from the 115-entry sample. You preview and validate everything before it is added." },
                { icon: Layers, t: "Analyse and group", d: "Each entry gets a topic, product area, sentiment, urgency and type. Related entries are grouped into themes with their quotes, segments and dates." },
                { icon: Target, t: "Prioritise with reasons", d: "Each theme is scored on frequency, severity, customer impact, business relevance and confidence. The score is a suggestion you can override." },
                { icon: ClipboardList, t: "Brief and share", d: "Generate a draft product brief for any theme, track its status, and export a report, CSVs or a full backup." },
              ].map(({ icon: Icon, t, d }, i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-ink"><Icon className="size-4" aria-hidden /></span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink"><span className="tabnum text-muted">{i + 1}.</span> {t}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink2">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <Image src="/landing/theme.webp" alt="A theme page: the problem statement labelled as AI interpretation, customer quotes labelled as observed, affected segments and a suggested opportunity" width={1180} height={760} unoptimized className="h-auto w-full" />
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-transparent bg-possoft px-2 py-1 font-medium text-pos">Observed: the customer’s own words</span>
            <span className="rounded border border-transparent bg-warnsoft px-2 py-1 font-medium text-warn">AI interpretation: check it against the evidence</span>
            <span className="rounded border border-transparent bg-accentsoft px-2 py-1 font-medium text-accent">Suggested action: a proposal for you to judge</span>
          </div>
        </Section>

        {/* Import */}
        <Section id="import" eyebrow="Bring your own feedback" title="Import from wherever your feedback lives" intro="Export from your help desk, survey tool, app store or CRM and drop the file in. Only one column is required.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-5">
              <FileSpreadsheet className="size-5 text-accent" aria-hidden />
              <h3 className="mt-3 text-[15px] font-semibold text-ink">CSV</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink2">Columns are matched automatically and you can change the mapping. Signal recognises:</p>
              <ul className="mt-3 flex flex-wrap gap-1.5 text-xs text-ink2">
                {["Feedback text (required)", "Customer", "Source", "Date", "Segment", "Plan", "Rating", "Product area"].map((c) => <li key={c} className="rounded border border-line bg-surface2 px-1.5 py-0.5">{c}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-line bg-surface p-5">
              <FileText className="size-5 text-accent" aria-hidden />
              <h3 className="mt-3 text-[15px] font-semibold text-ink">Text file or paste</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink2">Paste interview notes or a list of comments. Separate entries with a blank line, or put one per line. Bullets and numbering are stripped.</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-5">
              <ShieldCheck className="size-5 text-accent" aria-hidden />
              <h3 className="mt-3 text-[15px] font-semibold text-ink">Checked before it counts</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink2">Empty rows, duplicates, unreadable dates and ratings are caught and listed row by row before anything is imported. Up to 5,000 rows per file.</p>
            </div>
          </div>
        </Section>

        {/* Final CTA */}
        <section aria-labelledby="cta-title" className="border-t border-line py-16 text-center sm:py-20">
          <h2 id="cta-title" className="text-2xl font-semibold text-ink sm:text-3xl">See what your customers keep telling you.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-ink2">Start with the sample to see how it works, then bring your own feedback. It takes about a minute.</p>
          <div className="mt-8"><TryButtons busy={busy} onEnter={enter} align="center" /></div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted">
          <span>Signal is open source under the MIT license. Analysis runs entirely in your browser.</span>
          <a href={GITHUB} className="hover:text-ink">Source on GitHub</a>
        </div>
      </footer>
    </div>
  );
}
