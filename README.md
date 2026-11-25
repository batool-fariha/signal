# Signal

**Turn scattered customer feedback into evidence-backed product signals.**

[![CI](https://github.com/batool-fariha/signal/actions/workflows/ci.yml/badge.svg)](https://github.com/batool-fariha/signal/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-2b50d6.svg)](LICENSE)

**Try it: https://signal-voc.vercel.app** (choose "Start with the sample dataset"; nothing is uploaded and there is no sign-up)

Product teams get feedback from support tickets, app reviews, sales calls, interviews, surveys and Slack. It is fragmented, repetitive and hard to turn into a decision. Signal imports it, groups it into themes, shows the customer evidence behind each theme, and suggests what is worth investigating. It is built to help a product manager decide, not to decide for them.

It is not a summariser and not a chatbot. It is an analysis workspace: a table, a dashboard and a set of themes you can open up and check.

Runs entirely in your browser. No account, no API key, no data leaves your machine.

## Who it is for

- **Primary:** product managers at B2B SaaS and digital product companies, especially associate and mid-level PMs who own feedback and prioritisation.
- **Also useful to:** founders without a research team, customer success managers, UX researchers and product operations.

The design target is someone going from hundreds of feedback entries to a clear view of the customer problems that matter most.

## What it does

1. **Create a workspace**, or start from the 115-entry sample dataset (a fictional project management tool called Flowdesk).
2. **Import feedback** from a CSV, a TXT file, pasted text or the sample. CSV columns are matched automatically and you can change the mapping. You see a preview and a validation summary before anything is imported.
3. **Analyse.** Each entry gets a topic, product area, customer problem, sentiment, urgency, feedback type, feature request and the features it mentions.
4. **Group into themes** with a title, problem statement, quotes, affected segments, sentiment mix, first and latest occurrence, and a suggested opportunity.
5. **Prioritise** with five separate factors (frequency, severity, customer impact, business relevance, confidence), each with its rationale. Adjust the priority yourself.
6. **Track** each theme as New, Investigating, Planned, Addressed or Dismissed.
7. **Generate a product brief** for a theme, clearly marked as a draft for PM review.
8. **Export** a findings report (Markdown, or print to PDF), themes and feedback as CSV, and a full JSON backup.

Pages: Overview, Feedback, Themes (and theme detail), Opportunities, Reports, Settings.

## Principles the code enforces

These are tested, not just stated.

- **No invented evidence.** Every quote is the exact text of an imported entry and links back to it. Excerpts such as "customer problem" and "feature request" are verbatim sentences from the entry. There are tests that fail if a quote is not an exact substring of its source.
- **Three kinds of statement, labelled.** *Observed* (from customer feedback), *AI interpretation* (derived by the engine) and *Suggested action* (a proposal for a PM). Each section of a theme page and of a brief carries its label.
- **Frequency is not impact.** Frequency, severity, customer impact and business relevance are scored and shown separately. Negative tone does not raise severity by itself, and many mentions of something mild do not read as urgent.
- **Priority is a suggestion.** The score is explained in words, labelled as a starting point, and you can override it.
- **Trends need evidence.** A theme is only called emerging, growing or declining with enough dated entries over enough weeks. Otherwise it is labelled a **potential pattern**, and the reason is shown.
- **Say when there is not enough.** Themes with fewer than three entries are flagged as thin evidence. When there is no customer or segment column, customer impact is shown as *unknown* instead of guessed.

## Quick start

Requires Node 20.9 or newer to run the app (Next.js 16), and Node 22.12 or newer to run the tests (Vitest).

```bash
npm install
npm run dev        # http://localhost:3000
```

Open the app, name a workspace and choose **Start with the sample dataset**.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Vitest (engine, ingestion, validation) |
| `npm run check` | All of the above, as CI runs them |

### Importing your own data

A CSV needs a header row. Only the feedback text column is required. These are recognised by name and can be re-mapped in the import dialog:

| Field | Typical column names |
|---|---|
| Feedback text | feedback, comment, review, message, body, description |
| Customer | customer, account, company, user id |
| Source | source, channel |
| Date | date, created, created_at, timestamp |
| Segment | segment, company size, industry |
| Plan | plan, tier, subscription |
| Rating | rating, score, stars (1 to 5, or 1 to 10, or "4/5") |
| Product area | product area, feature, module, category |

Validation: empty and too-short text is skipped, duplicates (same text, customer and date, in the file or already imported) are skipped, unreadable dates and ratings are dropped with a note but the entry is kept, over-long text is shortened, control characters are stripped, and limits apply (5 MB, 5,000 rows, 4,000 characters per entry). Every issue is listed by row.

TXT and pasted text: separate entries with a blank line, or put one per line.

## Architecture

```
src/
  app/                  Next.js App Router pages (client-rendered, state in the browser)
  components/           UI primitives, shell, charts, import dialog
  lib/
    types.ts            Domain types (entries, analysis, themes, briefs, provenance)
    store.tsx           Workspace state + persistence adapter (localStorage)
    ingest/ingest.ts    CSV / TXT / paste parsing, column detection, validation
    ai/provider.ts      AnalysisProvider interface, heuristic provider, output validation
    engine/
      lexicon.ts        Topics and word lists (readable, editable)
      classify.ts       Per-entry analysis
      themes.ts         Grouping, TF-IDF clustering of leftovers, quote selection
      priority.ts       Five-factor assessment and its rationale
      trends.ts         Trend labels and the signal feed
      brief.ts          Product brief generation
      report.ts         Report and CSV exports
    sample/flowdesk.ts  The 115-entry demo dataset
tests/                  Engine, ingestion and validation tests
```

**Analysis engine.** The default provider is deterministic and offline. Topics come from weighted phrase lists, sentiment from word lists with negation and the rating when present, urgency from blocking or deadline language. Entries that match no topic are clustered by TF-IDF cosine similarity. You can read `lexicon.ts` to see exactly why an entry landed where it did.

**Swapping in a language model.** Business logic only talks to the `AnalysisProvider` interface in `lib/ai/provider.ts`. To use an LLM, implement `analyze` in a server route (so keys never reach the browser), request JSON matching `Analysis`, and return it. Output is passed through `validateAnalysis`, which rejects malformed fields and any quoted excerpt that does not appear in the original text. Invalid results fall back to the built-in analyser per entry.

**Persistence.** Local-first: the workspace is stored in this browser's `localStorage` behind a small `StorageAdapter`, so it works with no backend. `setStorageAdapter` swaps the backend.

## Limitations

Read these before relying on the output.

- **The built-in analysis is heuristic.** It reads wording, not meaning. It will misclassify sarcasm, unusual phrasing and anything outside its topic lists. The topic lists are tuned for common B2B SaaS feedback and English only.
- **Themes depend on the topic lists.** Feedback about something the lists do not cover lands in "Other feedback" or a TF-IDF cluster that the engine itself says it cannot explain.
- **Trends are cautious by design.** With under six weeks of data, or under six dated entries in a theme, nothing is called a trend.
- **Customers who did not write in are invisible.** Feedback over-represents people who chose to speak.
- **Local storage is limited.** Browsers cap `localStorage` at about 5 MB, which is roughly a few thousand entries. Export a JSON backup from Reports.
- **Single user, no sign-in.** Statuses and priorities are not shared between people or devices.
- **Not yet tested with a screen reader**, and not tested in every browser.

## Roadmap

- Supabase persistence and authentication, for shared workspaces and statuses (the storage adapter is the seam).
- A language-model provider with structured outputs and the same evidence validation.
- Embedding-based clustering for feedback outside the built-in topics, and multilingual support.
- Importers for Intercom, Zendesk, app store reviews and Slack exports.
- Customer value (revenue, plan) as an input to impact, instead of customer count.
- Comparing two time periods, and alerts when a theme crosses a threshold.

## Contributing

Issues and pull requests are welcome. Run `npm run check` before opening a PR. If you change the lexicon, add a case to `tests/engine.test.ts` showing the behaviour you want. If you find an entry that is grouped wrongly, an example is the most useful bug report.

## License

[MIT](LICENSE)
