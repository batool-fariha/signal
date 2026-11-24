/**
 * Lexicons used by the heuristic analysis provider.
 *
 * A trailing "*" in a phrase matches any word ending ("notif*" matches "notifications").
 * Everything here is deliberately inspectable: a PM can read why an entry landed in a topic.
 */

export interface TopicDef {
  key: string;
  title: string;
  area: string;
  /** Phrases that strongly indicate the topic (weight 2). */
  strong: string[];
  /** Phrases that weakly indicate the topic (weight 1). */
  weak: string[];
  /** Interpretation: what customers are running into. */
  problem: string;
  /** Suggestion: a potential product opportunity. */
  opportunity: string;
  /** Suggestion: what to research next. */
  question: string;
}

export const TOPICS: TopicDef[] = [
  {
    key: "dashboard-performance",
    title: "Slow dashboard and page loading",
    area: "Performance",
    strong: ["slow*", "sluggish", "laggy", "lag", "spinner", "forever to load", "forever to open", "load time*", "loading time*", "freez*", "time* out", "timeout*", "unresponsive", "ages to load", "long time to open", "long time to load", "minutes to load", "stutter*"],
    weak: ["takes forever", "takes ages", "takes a long time", "dashboard*", "loading", "loads", "page*", "performance", "wait*", "hang*", "big workspace", "large project*"],
    problem: "Customers report that dashboards and project pages load slowly, which interrupts their work.",
    opportunity: "Investigate load-time bottlenecks for large workspaces and set a measurable performance budget for the dashboard.",
    question: "Which workspace sizes and views are slowest, and how does load time relate to how often those customers return?",
  },
  {
    key: "onboarding-confusion",
    title: "Confusing onboarding and first-run experience",
    area: "Onboarding",
    strong: ["onboarding", "getting started", "get started", "first day*", "first week", "first-time", "new user*", "new hire*", "walkthrough", "tutorial*", "where to start", "didn't know where", "no idea where", "learning curve", "steep learning"],
    weak: ["set up", "setup", "confusing", "lost", "overwhelm*", "template*", "invite*", "guide*", "figure out", "intuitive", "empty state"],
    problem: "New customers struggle to understand how to set up and start using the product.",
    opportunity: "Map the first-session journey and test a guided setup that gets a team to its first completed task faster.",
    question: "Where do new accounts stall in the first week, and does that stall predict who is still active after 30 days?",
  },
  {
    key: "notification-gaps",
    title: "Missing or unreliable Slack and email notifications",
    area: "Notifications",
    strong: ["slack", "notif*", "alert*", "reminder*", "missed a", "never got", "didn't get", "mention*", "email digest*", "ping*"],
    weak: ["email*", "inbox", "channel*", "updates", "find out", "too late", "too many", "noise", "noisy"],
    problem: "Customers miss important updates because notifications are absent, delayed or too noisy to rely on.",
    opportunity: "Audit which events trigger notifications and offer per-project controls so teams get what matters without the noise.",
    question: "Which events do customers most often miss, and what do they do instead when a notification does not arrive?",
  },
  {
    key: "reporting-limits",
    title: "Reporting is hard to build, customise and share",
    area: "Reporting",
    strong: ["report*", "export*", "analytics", "insight*", "pdf", "csv", "custom report*", "status update*", "executive summary", "stakeholder*"],
    weak: ["chart*", "graph*", "metric*", "data", "numbers", "spreadsheet*", "excel", "burndown", "velocity", "share with", "weekly summary"],
    problem: "Customers find it difficult to produce the reports and summaries they need for stakeholders.",
    opportunity: "Explore saved, shareable report templates and scheduled exports that cover the summaries customers rebuild by hand today.",
    question: "What do customers currently build outside the product to report progress, and who is the audience?",
  },
  {
    key: "mobile-experience",
    title: "Mobile app is limited and unreliable",
    area: "Mobile",
    strong: ["mobile", "ios", "android", "iphone", "ipad", "phone*", "tablet*", "on the go", "offline"],
    weak: ["app", "push", "small screen", "tap*", "swipe*", "commute", "on site", "on-site", "field"],
    problem: "Customers who work away from a desktop find the mobile experience incomplete or unreliable.",
    opportunity: "Identify the tasks people need on mobile most and close the gap between the mobile and desktop experience for those first.",
    question: "Which tasks do customers try to do on mobile, and which of those fail or push them back to a laptop?",
  },
  {
    key: "permission-management",
    title: "Permissions and access control are hard to manage",
    area: "Permissions & Admin",
    strong: ["permission*", "role*", "access control", "admin*", "guest*", "sso", "visibility", "private project*", "who can see", "restrict*", "read-only", "read only", "external user*", "client access", "share* with clients"],
    weak: ["access", "security", "audit", "member*", "invite*", "share*", "viewer*", "compliance", "control"],
    problem: "Admins struggle to control who can see and change what, especially for guests and clients.",
    opportunity: "Review the permission model against the cases customers describe, and consider clearer roles, guest access and an access overview for admins.",
    question: "Which access scenarios do admins need that they cannot configure today, and how do they work around them?",
  },
  {
    key: "pricing-concerns",
    title: "Pricing and plan limits create friction",
    area: "Pricing & Billing",
    strong: ["pric*", "expensive", "cost*", "billing", "invoice*", "per seat", "per user", "seat*", "discount*", "renewal*", "afford*", "budget", "too much for", "paywall", "subscription*"],
    weak: ["plan*", "tier*", "upgrade*", "downgrade*", "enterprise", "free", "trial*", "paid", "limit*", "value for"],
    problem: "Customers question whether the price or plan structure matches the value they get.",
    opportunity: "Test how plan limits and seat pricing line up with how different segments use the product before changing any pricing.",
    question: "Which plan limits do customers hit first, and is the objection about price level, packaging or predictability?",
  },
  {
    key: "task-assignment",
    title: "Task assignment and workload management are limiting",
    area: "Task Management",
    strong: ["assign*", "assignee*", "multiple owner*", "subtask*", "sub-task*", "dependenc*", "recurring", "bulk", "workload", "ownership", "who is responsible", "responsible for", "task owner*"],
    weak: ["tasks", "task", "due date*", "deadline*", "priorit*", "board", "kanban", "handoff*", "capacity", "overload*", "template*"],
    problem: "Teams cannot express who owns work and how tasks relate, so they track it outside the product.",
    opportunity: "Look at multi-owner tasks, dependencies and workload views, starting with the assignment cases customers describe most.",
    question: "How do teams model shared ownership and handoffs today, and what breaks when they do it in the product?",
  },
  {
    key: "calendar-integration",
    title: "Calendar integration is incomplete",
    area: "Integrations",
    strong: ["calendar*", "google calendar", "outlook", "ical", "gcal", "sync*", "two-way", "double book*", "meeting*"],
    weak: ["schedule*", "timeline*", "gantt", "event*", "availability", "time zone*", "timezone*", "integration*", "connect*"],
    problem: "Customers expect their tasks and deadlines to stay in step with their calendars, and the integration falls short.",
    opportunity: "Scope a reliable two-way calendar sync for the calendars customers actually use, and define what must stay consistent.",
    question: "Which calendar providers and sync directions matter most, and what goes wrong when the sync is stale?",
  },
  {
    key: "search-and-filters",
    title: "Finding and filtering work takes too long",
    area: "Search & Navigation",
    strong: ["search*", "filter*", "can't find", "cannot find", "hard to find", "sort*", "saved view*", "navigation"],
    weak: ["find", "lookup", "look up", "tag*", "label*", "organiz*", "organis*", "folder*", "archive*"],
    problem: "Customers have trouble locating tasks and information once a workspace grows.",
    opportunity: "Review search quality and saved filters against the lookups customers say they do most.",
    question: "What are customers trying to find when search fails, and how do they get there instead?",
  },
  {
    key: "reliability-bugs",
    title: "Bugs and data reliability issues",
    area: "Reliability",
    strong: ["bug*", "crash*", "error*", "broken", "doesn't work", "does not work", "not working", "stopped working", "glitch*", "lost data", "disappear*", "duplicate*", "wrong", "fails", "failed", "corrupt*"],
    weak: ["issue*", "problem*", "stuck", "random*", "sometimes", "unexpected", "inconsisten*"],
    problem: "Customers hit defects or inconsistencies that make them doubt the data they see.",
    opportunity: "Triage the reported defects by reproducibility and data-loss risk, and fix the ones that undermine trust first.",
    question: "Which of these reports can be reproduced, and which involve lost or incorrect data?",
  },
  {
    key: "support-and-docs",
    title: "Support and documentation fall short",
    area: "Support & Docs",
    strong: ["support", "documentation", "docs", "help center", "help article*", "knowledge base", "response time*", "customer service", "chat support", "ticket*"],
    weak: ["answer*", "help", "waiting for", "replied", "responded", "guide*", "video*"],
    problem: "Customers have trouble getting timely, useful answers when they are stuck.",
    opportunity: "Check the most common support questions against the docs and consider fixing the product friction behind them.",
    question: "Which questions generate the most contacts, and could the product answer them without a person?",
  },
];

export const FALLBACK_TOPIC = {
  key: "other-feedback",
  title: "Other feedback",
  area: "General",
};

export const PRAISE_AREA_TITLES: Record<string, string> = {
  Performance: "Customers value speed",
  Onboarding: "Customers value an easy start",
  Notifications: "Customers value staying informed",
  Reporting: "Customers value clear reporting",
  Mobile: "Customers value the mobile app",
  "Permissions & Admin": "Customers value access control",
  "Pricing & Billing": "Customers value the pricing",
  "Task Management": "Customers value task management",
  Integrations: "Customers value the integrations",
  "Search & Navigation": "Customers value finding things quickly",
  Reliability: "Customers value reliability",
  "Support & Docs": "Customers value the support",
  General: "Customers value the product overall",
};

export const POSITIVE_WORDS = [
  "love*", "great", "excellent", "amazing", "awesome", "fantastic", "perfect", "helpful", "easy", "easier", "intuitive", "smooth", "fast", "reliable", "clean", "clear", "saved us", "saves us", "game changer", "game-changer", "happy", "impressed", "recommend*", "best", "nice", "solid", "useful", "enjoy*", "thank*", "works well", "works great", "brilliant", "delight*", "favorite", "favourite", "worth it",
];

export const NEGATIVE_WORDS = [
  "slow*", "forever", "stutter*", "sluggish", "time* out", "bad", "terrible", "awful", "horrible", "frustrat*", "annoy*", "confus*", "difficult", "hard", "painful", "pain", "useless", "broken", "crash*", "bug*", "error*", "missing", "missed", "lack*", "limited", "disappoint*", "poor", "worse", "worst", "hate*", "unreliable", "clunky", "cumbersome", "overwhelm*", "complicated", "unclear", "impossible", "never", "fail*", "stuck", "expensive", "can't", "cannot", "doesn't", "won't", "unable", "lost", "wrong", "waste", "ridiculous", "unacceptable", "lag*", "laggy", "freez*", "lacking", "nightmare",
];

export const NEGATORS = ["not", "no", "never", "hardly", "barely", "isn't", "wasn't", "don't", "doesn't", "didn't", "can't", "cannot", "won't", "without"];

export const REQUEST_CUES = [
  "would love", "would like", "i wish", "we wish", "wish *", "please add", "please allow", "can you add", "could you add", "it would be great", "it'd be great", "would be great", "would be nice", "would be helpful", "need a way", "we need", "i need", "should be able", "support for", "feature request", "add the ability", "ability to", "any plans", "is there a way", "looking for a way", "missing feature", "would help if", "it would help", "want to be able", "wanted to be able", "hoping for", "hope you add", "can we get", "please support", "please let",
  "is missing", "are missing", "missing entirely", "no way to", "there's no", "there is no", "doesn't support", "does not support", "can only assign", "can only",
];

export const BUG_CUES = ["bug*", "crash*", "error*", "broken", "doesn't work", "does not work", "not working", "stopped working", "glitch*", "fails", "failed", "disappear*", "duplicate*", "wrong", "lost data", "corrupt*", "won't save", "doesn't save", "stuck"];
export const USABILITY_CUES = ["confus*", "hard to find", "unclear", "can't figure", "cannot figure", "clunky", "complicated", "unintuitive", "not intuitive", "too many clicks", "difficult", "cumbersome", "overwhelm*", "where do i", "not obvious", "hidden", "buried", "no idea", "lost"];
export const PERFORMANCE_CUES = ["slow*", "sluggish", "laggy", "lag", "spinner", "forever to load", "forever to open", "ages to load", "load time*", "loading time*", "freez*", "time* out", "timeout*", "unresponsive", "long time to open", "long time to load", "minutes to load", "stutter*", "performance"];
export const PRICING_CUES = ["pric*", "expensive", "cost*", "per seat", "per user", "billing", "invoice*", "discount*", "afford*", "budget", "paywall", "renewal*", "too much for", "subscription*"];
export const SUGGESTION_CUES = ["suggest*", "maybe", "consider*", "idea", "perhaps", "might be", "how about", "what if", "one thing"];

export const HIGH_URGENCY = [
  "blocking", "blocker", "blocked", "can't work", "cannot work", "unable to", "urgent*", "asap", "critical", "deal breaker", "dealbreaker", "deal-breaker", "every day", "every single", "constantly", "always", "unacceptable", "lost data", "losing", "cancel*", "churn*", "switching", "switch to", "leaving", "evaluating alternatives", "looking at alternatives", "escalat*", "deadline", "missed a deadline", "production", "showstopper", "show-stopper", "whole team", "entire team", "unusable", "can't use", "cannot use",
];
export const LOW_URGENCY = ["minor", "small thing", "nitpick", "nice to have", "nice-to-have", "someday", "no rush", "not a big deal", "slightly", "a little", "bit annoying", "cosmetic", "eventually"];

/** Phrases that suggest retention, conversion, revenue or adoption impact. */
export const BUSINESS_SIGNALS = [
  "cancel*", "churn*", "switch* to", "switching", "leaving", "leave you", "evaluating", "alternative*", "competitor*", "renewal*", "renew*", "downgrad*", "refund*", "trial", "didn't convert", "not worth", "lose a deal", "lost a deal", "deal", "budget", "pilot", "rollout", "roll out", "expand*", "upgrade*", "recommend*", "adoption", "stopped using", "stop using", "nobody uses", "team won't use", "go back to", "going back to",
];

/** Feature nouns that count as "entities mentioned" when found in an entry. */
export const FEATURE_ENTITIES = [
  "dashboard", "timeline", "gantt", "calendar", "slack", "notifications", "reports", "reporting", "mobile app", "permissions", "templates", "subtasks", "dependencies", "workload view", "board view", "kanban", "search", "filters", "API", "webhooks", "SSO", "guest access", "time tracking", "comments", "file attachments", "integrations", "onboarding", "export", "automations", "recurring tasks", "email digest", "billing", "invoices",
];
