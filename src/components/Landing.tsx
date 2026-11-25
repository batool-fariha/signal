"use client";
import clsx from "clsx";
import { ArrowRight, ClipboardPaste, FileSpreadsheet, Layers, Lock, Scale, Sparkles, Upload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { classifyEntry } from "@/lib/engine/classify";
import { buildThemes } from "@/lib/engine/themes";
import { timeAxis, weeklyCounts } from "@/lib/engine/trends";
import { buildFlowdeskSample } from "@/lib/sample/flowdesk";
import { SITE } from "@/lib/site";
import { useWorkspace } from "@/lib/store";
import type { PriorityFactor } from "@/lib/types";
import { Footer } from "./Footer";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades content up once as it enters the viewport. Static under reduced motion. */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A light and a dark screenshot of the real app; CSS shows the one matching the theme. */
function Shot({ name, alt, priority = false }: { name: "overview" | "theme"; alt: string; priority?: boolean }) {
  return (
    <>
      <Image src={`/landing/${name}.webp`} alt={alt} width={1180} height={760} priority={priority} unoptimized className="h-auto w-full dark:hidden" />
      <Image src={`/landing/${name}-dark.webp`} alt={alt} width={1180} height={760} unoptimized className="hidden h-auto w-full dark:block" />
    </>
  );
}

const pill = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium transition-[transform,opacity,background-color,box-shadow] active:scale-[0.98]";

function Ctas({ returning, busy, onEnter, workspaceName, onBrand = false, center = false }: { returning: boolean; busy: null | "sample" | "blank"; onEnter: (sample: boolean) => void; workspaceName?: string; onBrand?: boolean; center?: boolean }) {
  const primary = onBrand ? "bg-white text-brandink hover:bg-white/90" : "bg-brand text-white shadow-[0_10px_30px_-10px_var(--brand)] hover:bg-branddeep";
  const secondary = onBrand ? "border border-white/35 text-white hover:bg-white/10" : "border border-linestrong bg-surface text-ink hover:bg-surface2";
  if (returning) {
    return (
      <div className={clsx("flex flex-wrap items-center gap-4", center && "justify-center")}>
        <Link href="/overview" className={clsx(pill, primary)}>
          Open your workspace <ArrowRight className="size-4" aria-hidden />
        </Link>
        <span className={clsx("text-sm", onBrand ? "text-white/75" : "text-muted")}>&ldquo;{workspaceName}&rdquo; is saved in this browser.</span>
      </div>
    );
  }
  return (
    <div className={clsx("flex flex-wrap gap-3", center && "justify-center")}>
      <button type="button" disabled={busy !== null} onClick={() => onEnter(true)} className={clsx(pill, primary, "disabled:opacity-60")}>
        {busy === "sample" ? "Opening the demo…" : "Try the demo"} {busy !== "sample" && <ArrowRight className="size-4" aria-hidden />}
      </button>
      <button type="button" disabled={busy !== null} onClick={() => onEnter(false)} className={clsx(pill, secondary, "disabled:opacity-60")}>
        {busy === "blank" ? "Opening…" : "Import your data"}
      </button>
    </div>
  );
}

function FactorRow({ name, f }: { name: string; f: PriorityFactor }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-3 text-[12.5px]">
      <span className="text-ink2">{name}</span>
      <span className="h-1.5 rounded-full bg-surface2">
        <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(f.score * 100)}%` }} />
      </span>
    </div>
  );
}

/** Real engine output on the bundled sample, computed the same way the app does. */
function useSample() {
  return useMemo(() => {
    const entries = buildFlowdeskSample().map((e) => ({ ...e, analysis: classifyEntry(e) }));
    const themes = buildThemes(entries);
    const axis = timeAxis(entries);
    const weeks = axis ? weeklyCounts(entries, axis).map((b) => b.count) : [];
    return { themes, weeks, total: entries.length };
  }, []);
}

const H2 = "text-[2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-ink md:text-5xl";

export function Landing() {
  const { ready, workspace, createWorkspace } = useWorkspace();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState<null | "sample" | "blank">(null);
  const returning = ready && workspace !== null;

  const { themes, weeks, total } = useSample();
  const dash = themes.find((t) => t.id === "dashboard-performance");
  const problems = themes.filter((t) => !t.isPositive && !t.weakEvidence);
  const mostMentioned = [...problems].sort((a, b) => b.count - a.count)[0];
  const topPriority = problems[0];
  const thin = themes.find((t) => t.trend.label === "potential_pattern" && !t.isPositive && !t.id.startsWith("other"));
  const maxWeek = Math.max(1, ...weeks);

  async function enter(sample: boolean) {
    setBusy(sample ? "sample" : "blank");
    await createWorkspace(sample ? "Flowdesk feedback (sample)" : "My workspace", sample);
    router.push("/overview");
  }

  const ctaProps = { returning, busy, onEnter: enter, workspaceName: workspace?.name };
  const rise = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease: EASE } });

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Signal home"><Logo /></Link>
          <nav aria-label="Page" className="flex items-center gap-1">
            <a href="#features" className="hidden rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink md:inline">Features</a>
            <a href="#how" className="hidden rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink md:inline">How it works</a>
            <a href="#import" className="hidden rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink md:inline">Import</a>
            <a href={SITE.repo} className="rounded-full px-3 py-1.5 text-[13px] text-ink2 hover:text-ink">GitHub</a>
            <ThemeToggle className="ml-1 rounded-full" />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section aria-labelledby="hero-title" className="relative isolate">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_55%_at_80%_20%,color-mix(in_oklab,var(--brand)_22%,transparent),transparent_70%),radial-gradient(35%_40%_at_95%_70%,color-mix(in_oklab,var(--brand-sky)_22%,transparent),transparent_70%)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:pt-20 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
            <div>
              <motion.p {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.07] px-3 py-1 text-xs font-medium text-brand dark:text-brandsky">
                <Sparkles className="size-3.5" aria-hidden /> Open source and private by design
              </motion.p>
              <motion.h1 {...rise(0.08)} id="hero-title" className="mt-6 text-[2.75rem] font-semibold leading-[1.0] tracking-[-0.04em] text-ink sm:text-[4rem]">
                Turn feedback noise into product{" "}
                <span className="bg-[linear-gradient(100deg,var(--brand),var(--brand-sky))] bg-clip-text text-transparent">signal.</span>
              </motion.h1>
              <motion.p {...rise(0.16)} className="mt-6 max-w-md text-[17px] leading-relaxed text-ink2">
                Signal groups support tickets, reviews and interviews into themes, and shows the customer words behind every one.
              </motion.p>
              <motion.div {...rise(0.24)} className="mt-9">
                <Ctas {...ctaProps} />
              </motion.div>
            </div>

            <motion.figure
              initial={reduce ? false : { opacity: 0, y: 30, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
              className="relative [perspective:1600px]"
            >
              <div className="rounded-[22px] bg-[linear-gradient(140deg,color-mix(in_oklab,var(--brand)_55%,transparent),color-mix(in_oklab,var(--brand-sky)_45%,transparent))] p-[5px] shadow-[0_40px_90px_-35px_var(--brand)] lg:[transform:rotateY(-8deg)_rotateX(4deg)]">
                <div className="overflow-hidden rounded-[18px] bg-surface">
                  <Shot name="overview" priority alt="Signal's overview dashboard with the sample dataset: feedback volume over time, sentiment, and the most frequent themes" />
                </div>
              </div>
            </motion.figure>
          </div>
        </section>

        {/* Marquee: real themes from the sample */}
        <section aria-label="Themes Signal finds in the sample data" className="marquee overflow-hidden border-y border-line bg-surface py-4">
          <div className="marquee-track flex w-max gap-3">
            {[...problems, ...problems].map((t, i) => (
              <span key={`${t.id}-${i}`} aria-hidden={i >= problems.length} className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-bg px-4 py-1.5 text-[13px] text-ink2">
                {t.title}
                <span className="tabnum rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand dark:text-brandsky">{t.count}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Bento */}
        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 md:py-32">
          <Reveal>
            <h2 id="features-title" className={clsx(H2, "max-w-3xl")}>Read it, weigh it, decide. With the evidence one click away.</h2>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6 md:auto-rows-[minmax(220px,auto)]">
            {/* A: evidence chain */}
            {dash && (
              <Reveal className="md:col-span-4 md:row-span-2">
                <article className="relative h-full overflow-hidden rounded-3xl border border-line bg-[linear-gradient(160deg,color-mix(in_oklab,var(--brand)_12%,var(--surface)),var(--surface)_55%)] p-7 md:p-8">
                  <h3 className="text-xl font-semibold tracking-tight text-ink">Every theme shows its receipts</h3>
                  <p className="mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-ink2">Quotes stay word for word and link back to the entry. This one is real output from the sample.</p>
                  <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_1.05fr]">
                    <div className="space-y-3">
                      {dash.quotes.slice(0, 2).map((q) => (
                        <blockquote key={q.entryId} className="rounded-2xl border border-line bg-surface p-4 text-[13.5px] leading-relaxed text-ink">
                          &ldquo;{q.text}&rdquo;
                          <footer className="mt-2 text-[11.5px] text-muted">Entry {q.entryId}</footer>
                        </blockquote>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_50px_-30px_color-mix(in_oklab,var(--brand)_60%,transparent)]">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[15px] font-semibold leading-snug tracking-tight text-ink">{dash.title}</h4>
                        <span className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold capitalize text-white">{dash.trend.label.replace("_", " ")}</span>
                      </div>
                      <p className="mt-1 text-[12px] text-muted">{dash.count} entries, {dash.customersAffected} customers</p>
                      <div className="mt-5 space-y-2.5">
                        <FactorRow name="Frequency" f={dash.priority.frequency} />
                        <FactorRow name="Severity" f={dash.priority.severity} />
                        <FactorRow name="Impact" f={dash.priority.customerImpact} />
                        <FactorRow name="Business" f={dash.priority.businessRelevance} />
                        <FactorRow name="Confidence" f={dash.priority.confidence} />
                      </div>
                      <p className="mt-5 border-t border-line pt-3 text-[12.5px] text-ink2"><span className="font-semibold text-ink">Suggested: {dash.priority.suggested}.</span> Reasons shown, yours to override.</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            )}

            {/* B: weekly volume on solid brand blue */}
            <Reveal className="md:col-span-2" delay={0.06}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-[linear-gradient(155deg,var(--brand),var(--brand-deep))] p-7 text-white">
                <h3 className="text-xl font-semibold tracking-tight">Spot what is growing</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/75">Weekly volume across {total} sample entries.</p>
                <div className="mt-auto flex h-24 items-end gap-1 pt-6" role="img" aria-label={`Weekly feedback counts: ${weeks.join(", ")}`}>
                  {weeks.map((c, i) => (
                    <span key={i} className="flex-1 rounded-t-sm bg-white" style={{ height: `${Math.max(8, (c / maxWeek) * 100)}%`, opacity: 0.35 + (c / maxWeek) * 0.65 }} />
                  ))}
                </div>
              </article>
            </Reveal>

            {/* C: frequency is not impact */}
            <Reveal className="md:col-span-2" delay={0.1}>
              <article className="flex h-full flex-col rounded-3xl bg-brandink p-7 text-white">
                <Scale className="size-5 text-brandsky" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold tracking-tight">Frequency is not impact</h3>
                {mostMentioned && topPriority && mostMentioned.id !== topPriority.id ? (
                  <dl className="mt-auto space-y-3 pt-6 text-[13px]">
                    <div>
                      <dt className="text-white/55">Mentioned most</dt>
                      <dd className="mt-0.5 font-medium">{mostMentioned.title} <span className="text-brandsky">({mostMentioned.count})</span></dd>
                    </div>
                    <div>
                      <dt className="text-white/55">Suggested first</dt>
                      <dd className="mt-0.5 font-medium">{topPriority.title} <span className="text-brandsky">({topPriority.count})</span></dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-[14px] text-white/75">Mentions, severity, reach and revenue risk are scored apart.</p>
                )}
              </article>
            </Reveal>

            {/* D: provenance colours, straight from the product */}
            <Reveal className="md:col-span-2" delay={0.06}>
              <article className="h-full rounded-3xl border border-line bg-surface p-7">
                <h3 className="text-xl font-semibold tracking-tight text-ink">Know what is fact</h3>
                <ul className="mt-5 space-y-2.5 text-[13px]">
                  <li className="flex items-center justify-between gap-3 rounded-xl bg-possoft px-3.5 py-2.5"><span className="font-semibold text-pos">Observed</span><span className="text-ink2">The customer&rsquo;s words</span></li>
                  <li className="flex items-center justify-between gap-3 rounded-xl bg-warnsoft px-3.5 py-2.5"><span className="font-semibold text-warn">Interpretation</span><span className="text-ink2">Check the evidence</span></li>
                  <li className="flex items-center justify-between gap-3 rounded-xl bg-accentsoft px-3.5 py-2.5"><span className="font-semibold text-accent">Suggestion</span><span className="text-ink2">Yours to judge</span></li>
                </ul>
              </article>
            </Reveal>

            {/* E: uncertainty */}
            <Reveal className="md:col-span-2" delay={0.1}>
              <article className="h-full rounded-3xl border border-line bg-[linear-gradient(170deg,var(--warn-soft),var(--surface)_70%)] p-7">
                <h3 className="text-xl font-semibold tracking-tight text-ink">Honest when it is unsure</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink2">No trend without enough dated evidence.</p>
                {thin && (
                  <div className="mt-5 rounded-xl border border-line bg-surface p-3.5">
                    <span className="rounded-full bg-warnsoft px-2.5 py-0.5 text-[11px] font-semibold text-warn">Potential pattern</span>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink2"><span className="font-medium text-ink">{thin.title}:</span> {thin.trend.explanation.split(";")[0]}.</p>
                  </div>
                )}
              </article>
            </Reveal>

            {/* F: privacy, on a dotted pattern */}
            <Reveal className="md:col-span-2" delay={0.14}>
              <article className="relative h-full overflow-hidden rounded-3xl border border-line bg-surface p-7">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklab,var(--brand)_28%,transparent)_1px,transparent_1.5px)] [background-size:14px_14px] [mask-image:linear-gradient(to_top,black,transparent_75%)]" />
                <span className="relative grid size-11 place-items-center rounded-2xl bg-brand text-white"><Lock className="size-5" aria-hidden /></span>
                <h3 className="relative mt-5 text-xl font-semibold tracking-tight text-ink">Private by default</h3>
                <p className="relative mt-2 text-[14px] leading-relaxed text-ink2">Runs in your browser. No account, no API key, nothing uploaded.</p>
              </article>
            </Reveal>
          </div>
        </section>

        {/* How it works, on a tinted band */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-y border-line bg-[linear-gradient(180deg,color-mix(in_oklab,var(--brand)_7%,var(--bg)),var(--bg))]">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <h2 id="how-title" className={H2}>From a pile of comments to a brief in minutes.</h2>
              <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-ink2">Bring the feedback you already have. Signal does the sorting, you make the call.</p>
            </Reveal>
            <ol className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Upload, t: "Import", d: "CSV, text or paste. Every row is checked first." },
                { icon: Layers, t: "Group", d: "Entries become themes with quotes and segments." },
                { icon: Scale, t: "Weigh", d: "Five factors, each with a reason you can override." },
                { icon: ArrowRight, t: "Decide", d: "Set status, draft a brief, export a report." },
              ].map(({ icon: Icon, t, d }, i) => (
                <Reveal key={t} delay={i * 0.07}>
                  <li className="flex h-full gap-4 rounded-2xl border border-line bg-surface p-5">
                    <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", i % 2 === 0 ? "bg-brand text-white" : "bg-brand/10 text-brand dark:text-brandsky")}><Icon className="size-[18px]" aria-hidden /></span>
                    <div>
                      <h3 className="text-[15px] font-semibold tracking-tight text-ink">{t}</h3>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-ink2">{d}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Import: copy left, product right */}
        <section id="import" aria-labelledby="import-title" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-12 px-5 py-24 md:py-32 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <h2 id="import-title" className={H2}>Bring feedback from anywhere.</h2>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-ink2">Export from your help desk, survey tool, app store or CRM. Only the feedback text is required.</p>
            <div className="mt-8 space-y-5">
              <div className="flex gap-4">
                <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-brand dark:text-brandsky" aria-hidden />
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">CSV, matched for you</h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {["Feedback text", "Customer", "Source", "Date", "Segment", "Plan", "Rating", "Product area"].map((c, i) => (
                      <li key={c} className={clsx("rounded-full border px-2.5 py-0.5 text-xs", i === 0 ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink2")}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-4">
                <ClipboardPaste className="mt-0.5 size-5 shrink-0 text-brand dark:text-brandsky" aria-hidden />
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Text files and paste</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink2">One comment per line, or separated by blank lines. Empty rows and duplicates are caught before import.</p>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_40px_80px_-40px_color-mix(in_oklab,var(--ink)_35%,transparent)]">
              <Shot name="theme" alt="A theme page with customer quotes labelled as observed, the problem labelled as AI interpretation, and affected segments" />
            </div>
          </Reveal>
        </section>

        {/* Closing call to action on solid brand */}
        <section aria-labelledby="cta-title" className="mx-auto max-w-6xl px-5 pb-24">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,var(--brand),var(--brand-deep)_55%,var(--brand-ink))] px-6 py-20 text-center text-white md:py-24">
              <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(40%_60%_at_85%_10%,color-mix(in_oklab,var(--brand-sky)_45%,transparent),transparent_70%)]" />
              <h2 id="cta-title" className="mx-auto max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.035em] md:text-6xl">See what your customers keep telling you.</h2>
              <p className="mx-auto mt-5 max-w-md text-[16px] text-white/75">Open the demo in seconds, then bring your own feedback.</p>
              <div className="mt-9"><Ctas {...ctaProps} onBrand center /></div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
