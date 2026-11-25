"use client";
import clsx from "clsx";
import { ArrowRight, BarChart3, ClipboardPaste, FileSpreadsheet, GitBranch, Layers, Scale, ShieldCheck, Upload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { classifyEntry } from "@/lib/engine/classify";
import { buildThemes } from "@/lib/engine/themes";
import { buildFlowdeskSample } from "@/lib/sample/flowdesk";
import { useWorkspace } from "@/lib/store";
import type { PriorityFactor, Theme } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";

const GITHUB = "https://github.com/batool-fariha/signal";
const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades content up once as it enters the viewport. Static under reduced motion. */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
      <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-ink text-bg">
        <BarChart3 className="size-4" />
      </span>
      Signal
    </span>
  );
}

/** A light and a dark screenshot of the real app; CSS shows the one matching the theme. */
function Shot({ name, alt, priority = false, className }: { name: "overview" | "theme"; alt: string; priority?: boolean; className?: string }) {
  return (
    <>
      <Image src={`/landing/${name}.webp`} alt={alt} width={1180} height={760} priority={priority} unoptimized className={clsx("h-auto w-full dark:hidden", className)} />
      <Image src={`/landing/${name}-dark.webp`} alt={alt} width={1180} height={760} unoptimized className={clsx("hidden h-auto w-full dark:block", className)} />
    </>
  );
}

const pill = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-[transform,opacity,background-color] active:scale-[0.98]";

function Ctas({ returning, busy, onEnter, workspaceName, center = false }: { returning: boolean; busy: null | "sample" | "blank"; onEnter: (sample: boolean) => void; workspaceName?: string; center?: boolean }) {
  if (returning) {
    return (
      <div className={clsx("flex flex-wrap items-center gap-4", center && "justify-center")}>
        <Link href="/overview" className={clsx(pill, "bg-ink text-bg hover:opacity-90")}>
          Open your workspace <ArrowRight className="size-4" aria-hidden />
        </Link>
        <span className="text-sm text-muted">&ldquo;{workspaceName}&rdquo; is saved in this browser.</span>
      </div>
    );
  }
  return (
    <div className={clsx("flex flex-wrap gap-3", center && "justify-center")}>
      <button type="button" disabled={busy !== null} onClick={() => onEnter(true)} className={clsx(pill, "bg-ink text-bg hover:opacity-90 disabled:opacity-60")}>
        {busy === "sample" ? "Opening the demo…" : "Try the demo"} {busy !== "sample" && <ArrowRight className="size-4" aria-hidden />}
      </button>
      <button type="button" disabled={busy !== null} onClick={() => onEnter(false)} className={clsx(pill, "border border-linestrong bg-surface text-ink hover:bg-surface2 disabled:opacity-60")}>
        {busy === "blank" ? "Opening…" : "Import your data"}
      </button>
    </div>
  );
}

function FactorRow({ name, f }: { name: string; f: PriorityFactor }) {
  return (
    <div className="grid grid-cols-[110px_1fr_56px] items-center gap-3 text-[13px]">
      <span className="text-ink2">{name}</span>
      <span className="h-1.5 rounded-full bg-surface2">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(f.score * 100)}%` }} />
      </span>
      <span className="text-right capitalize text-muted">{f.level}</span>
    </div>
  );
}

/** Real engine output on the bundled sample, computed the same way the app does. */
function useSampleThemes(): Theme[] {
  return useMemo(() => buildThemes(buildFlowdeskSample().map((e) => ({ ...e, analysis: classifyEntry(e) }))), []);
}

export function Landing() {
  const { ready, workspace, createWorkspace } = useWorkspace();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState<null | "sample" | "blank">(null);
  const returning = ready && workspace !== null;

  const themes = useSampleThemes();
  const dash = themes.find((t) => t.id === "dashboard-performance");
  const problems = themes.filter((t) => !t.isPositive && !t.weakEvidence);
  const mostMentioned = [...problems].sort((a, b) => b.count - a.count)[0];
  const topPriority = problems[0];
  // A real topic (not the catch-all bucket) that has too little evidence to call a trend.
  const thin = themes.find((t) => t.trend.label === "potential_pattern" && !t.isPositive && !t.id.startsWith("other"));

  async function enter(sample: boolean) {
    setBusy(sample ? "sample" : "blank");
    await createWorkspace(sample ? "Flowdesk feedback (sample)" : "My workspace", sample);
    router.push("/overview");
  }

  const ctaProps = { returning, busy, onEnter: enter, workspaceName: workspace?.name };
  const rise = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease: EASE } });

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav aria-label="Page" className="flex items-center gap-1">
            <a href="#evidence" className="hidden rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink md:inline">Evidence</a>
            <a href="#how" className="hidden rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink md:inline">How it works</a>
            <a href="#import" className="hidden rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink md:inline">Import</a>
            <a href={GITHUB} className="rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink">GitHub</a>
            <ThemeToggle className="ml-1 rounded-full" />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section aria-labelledby="hero-title" className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_55%_at_75%_30%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_70%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:pt-20 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
            <div>
              <motion.p {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs text-ink2 backdrop-blur">
                <ShieldCheck className="size-3.5 text-accent" aria-hidden /> Open source and private by design
              </motion.p>
              <motion.h1 {...rise(0.08)} id="hero-title" className="mt-6 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-6xl">
                Turn feedback noise into product <span className="text-accent">signal.</span>
              </motion.h1>
              <motion.p {...rise(0.16)} className="mt-6 max-w-md text-[17px] leading-relaxed text-ink2">
                Signal groups support tickets, reviews and interviews into themes, and shows the customer words behind every one.
              </motion.p>
              <motion.div {...rise(0.24)} className="mt-9">
                <Ctas {...ctaProps} />
              </motion.div>
            </div>

            <motion.figure
              initial={reduce ? false : { opacity: 0, y: 28, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: EASE }}
              className="relative [perspective:1600px]"
            >
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--accent)_45%,transparent)] lg:[transform:rotateY(-7deg)_rotateX(3deg)]">
                <Shot name="overview" priority alt="Signal's overview dashboard with the sample dataset: feedback volume over time, sentiment, and the most frequent themes" />
              </div>
            </motion.figure>
          </div>

          <div className="mx-auto max-w-6xl px-5">
            <ul className="grid gap-6 border-y border-line py-7 text-[14px] text-ink2 sm:grid-cols-3">
              <li className="flex items-center gap-3"><Upload className="size-4 text-accent" aria-hidden /> Runs in your browser. Nothing is uploaded.</li>
              <li className="flex items-center gap-3"><ShieldCheck className="size-4 text-accent" aria-hidden /> No sign-up and no API key.</li>
              <li className="flex items-center gap-3"><GitBranch className="size-4 text-accent" aria-hidden /> Open source under MIT.</li>
            </ul>
          </div>
        </section>

        {/* Evidence chain */}
        <section id="evidence" aria-labelledby="evidence-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 md:py-32">
          <Reveal>
            <h2 id="evidence-title" className="max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-ink md:text-[2.75rem] md:leading-[1.08]">Every theme shows its receipts.</h2>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-ink2">Quotes stay word for word and link back to the original entry. Here is a theme Signal finds in the sample data.</p>
          </Reveal>

          {dash && (
            <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_auto_1.05fr]">
              <div className="space-y-3">
                {dash.quotes.slice(0, 3).map((q, i) => (
                  <Reveal key={q.entryId} delay={i * 0.08}>
                    <blockquote className="rounded-2xl border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink">
                      &ldquo;{q.text}&rdquo;
                      <footer className="mt-2 text-xs text-muted">Entry {q.entryId}</footer>
                    </blockquote>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.2} className="hidden justify-center lg:flex">
                <span className="grid size-11 place-items-center rounded-full border border-line bg-surface text-accent">
                  <ArrowRight className="size-5" aria-hidden />
                </span>
              </Reveal>

              <Reveal delay={0.28}>
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_60px_-32px_color-mix(in_oklab,var(--ink)_40%,transparent)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-ink">{dash.title}</h3>
                    <span className="rounded-full bg-accentsoft px-2.5 py-0.5 text-xs font-medium capitalize text-accent">{dash.trend.label.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">
                    {dash.count} entries from {dash.customersAffected} customers. {dash.trend.explanation}
                  </p>
                  <div className="mt-6 space-y-3">
                    <FactorRow name="Frequency" f={dash.priority.frequency} />
                    <FactorRow name="Severity" f={dash.priority.severity} />
                    <FactorRow name="Customer impact" f={dash.priority.customerImpact} />
                    <FactorRow name="Business" f={dash.priority.businessRelevance} />
                    <FactorRow name="Confidence" f={dash.priority.confidence} />
                  </div>
                  <p className="mt-6 border-t border-line pt-4 text-[13px] leading-relaxed text-ink2">
                    <span className="font-medium text-ink">Suggested priority: {dash.priority.suggested}.</span> A starting point for your judgement, with the reasoning shown.
                  </p>
                </div>
              </Reveal>
            </div>
          )}
        </section>

        {/* Principles bento */}
        <section aria-labelledby="principles-title" className="mx-auto max-w-6xl px-5 pb-24 md:pb-32">
          <Reveal>
            <h2 id="principles-title" className="max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-ink md:text-[2.75rem] md:leading-[1.08]">Built to help you decide, not to sound sure.</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Reveal className="md:col-span-2">
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="p-7">
                  <Layers className="size-5 text-accent" aria-hidden />
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">Evidence, not summaries</h3>
                  <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-ink2">Each finding is labelled as observed, interpretation or suggestion, so you always know what came from a customer.</p>
                </div>
                <div className="relative mt-auto h-56 overflow-hidden border-t border-line">
                  <div className="absolute inset-x-0 top-0"><Shot name="theme" alt="A theme page showing labelled customer quotes and affected segments" /></div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="flex h-full flex-col rounded-2xl bg-ink p-7 text-bg dark:bg-accent">
                <Scale className="size-5 opacity-80" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold tracking-tight">Frequency is not impact</h3>
                <p className="mt-2 text-[15px] leading-relaxed opacity-75">Mentions, severity, reach and revenue risk are scored apart.</p>
                {mostMentioned && topPriority && mostMentioned.id !== topPriority.id && (
                  <dl className="mt-auto space-y-3 pt-8 text-[13px]">
                    <div>
                      <dt className="opacity-60">Mentioned most in the sample</dt>
                      <dd className="mt-0.5 font-medium">{mostMentioned.title} ({mostMentioned.count})</dd>
                    </div>
                    <div>
                      <dt className="opacity-60">Suggested first</dt>
                      <dd className="mt-0.5 font-medium">{topPriority.title} ({topPriority.count})</dd>
                    </div>
                  </dl>
                )}
              </div>
            </Reveal>

            <Reveal className="md:col-span-3" delay={0.12}>
              <div className="grid gap-8 rounded-2xl border border-line bg-accentsoft/60 p-7 md:grid-cols-[1fr_1.4fr] md:items-center">
                <div>
                  <ShieldCheck className="size-5 text-accent" aria-hidden />
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">Honest about uncertainty</h3>
                  <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink2">A trend needs enough dated evidence. Otherwise Signal says &ldquo;potential pattern&rdquo; and tells you why.</p>
                </div>
                <div className="space-y-3">
                  {dash && (
                    <div className="rounded-xl bg-surface p-4">
                      <span className="rounded-full bg-accentsoft px-2.5 py-0.5 text-xs font-medium text-accent">Trend</span>
                      <p className="mt-2 text-[13px] text-ink2"><span className="font-medium text-ink">{dash.title}.</span> {dash.trend.explanation}</p>
                    </div>
                  )}
                  {thin && (
                    <div className="rounded-xl bg-surface p-4">
                      <span className="rounded-full bg-warnsoft px-2.5 py-0.5 text-xs font-medium text-warn">Potential pattern</span>
                      <p className="mt-2 text-[13px] text-ink2"><span className="font-medium text-ink">{thin.title}.</span> {thin.trend.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works: a step rail */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
            <Reveal>
              <h2 id="how-title" className="max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-ink md:text-[2.75rem] md:leading-[1.08]">From a pile of comments to a brief.</h2>
            </Reveal>
            <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
              <span aria-hidden className="absolute left-0 right-0 top-5 hidden h-px bg-line md:block" />
              {[
                { icon: Upload, t: "Import", d: "Drop in a CSV or text file, or paste comments. Every row is checked first." },
                { icon: Layers, t: "Group", d: "Each entry is classified and grouped into themes with quotes, segments and dates." },
                { icon: Scale, t: "Weigh", d: "Themes are scored on five factors, with reasons you can read and override." },
                { icon: ArrowRight, t: "Decide", d: "Track status, draft a product brief, and export a report for your team." },
              ].map(({ icon: Icon, t, d }, i) => (
                <Reveal key={t} delay={i * 0.08}>
                  <li className="relative">
                    <span className="relative grid size-10 place-items-center rounded-full border border-line bg-bg text-accent"><Icon className="size-4" aria-hidden /></span>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{t}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink2">{d}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Import */}
        <section id="import" aria-labelledby="import-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 md:py-32">
          <Reveal>
            <h2 id="import-title" className="max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-ink md:text-[2.75rem] md:leading-[1.08]">Bring feedback from anywhere.</h2>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-ink2">Export from your help desk, survey tool, app store or CRM. Only the feedback text is required.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-12 grid overflow-hidden rounded-2xl border border-line md:grid-cols-2">
              <div className="bg-surface p-7 md:p-9">
                <FileSpreadsheet className="size-5 text-accent" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">CSV, matched for you</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink2">Columns are recognised by name and can be re-mapped before import.</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {["Feedback text", "Customer", "Source", "Date", "Segment", "Plan", "Rating", "Product area"].map((c, i) => (
                    <li key={c} className={clsx("rounded-full border px-3 py-1 text-xs", i === 0 ? "border-accent bg-accentsoft font-medium text-accent" : "border-line text-ink2")}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-line bg-bg p-7 md:border-l md:border-t-0 md:p-9">
                <ClipboardPaste className="size-5 text-accent" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">Text files and paste</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink2">Interview notes or a list of comments, one per line or separated by blank lines.</p>
                <p className="mt-6 text-[14px] leading-relaxed text-ink2"><span className="font-medium text-ink">Checked before it counts.</span> Empty rows, duplicates and unreadable dates are listed row by row, up to 5,000 rows per file.</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Final call to action */}
        <section aria-labelledby="cta-title" className="relative overflow-hidden border-t border-line">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center md:py-32">
            <Reveal>
              <h2 id="cta-title" className="text-4xl font-semibold tracking-[-0.035em] text-ink md:text-6xl md:leading-[1.02]">See what your customers keep telling you.</h2>
              <p className="mx-auto mt-5 max-w-md text-[16px] text-ink2">Open the demo in a few seconds, then bring your own feedback.</p>
              <div className="mt-9"><Ctas {...ctaProps} center /></div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted">
          <Logo />
          <span>Open source under MIT. Analysis runs entirely in your browser.</span>
          <a href={GITHUB} className="hover:text-ink">Source on GitHub</a>
        </div>
      </footer>
    </div>
  );
}
