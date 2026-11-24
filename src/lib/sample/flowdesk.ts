/**
 * Sample dataset: 115 fictional feedback entries for "Flowdesk", a project management
 * platform for distributed teams. The text is hand-written; sources, segments, dates,
 * ratings and customers are generated deterministically so the demo is identical on every run.
 *
 * Recurring themes are intentional (so clustering has something to find), and the time
 * profile of each theme differs: dashboard complaints rise sharply, onboarding is steady,
 * Slack notifications appear late in the window, and so on.
 */
import type { FeedbackEntry } from "../types";

type Profile = "rising" | "flat" | "late" | "early" | "mild";
type Seg = "Enterprise" | "Mid-market" | "SMB" | "Startup";

interface Group {
  profile: Profile;
  segments: [Seg, number][];
  sources: [string, number][];
  /** Rating range for entries in the group. */
  rating: [number, number];
  texts: string[];
}

const SOURCES_SUPPORT: [string, number][] = [["Support ticket", 5], ["Survey", 2], ["User interview", 2], ["Email", 2], ["Sales call", 1]];
const SOURCES_REVIEW: [string, number][] = [["App review", 5], ["Support ticket", 2], ["Survey", 2], ["Slack community", 1]];
const SOURCES_SALES: [string, number][] = [["Sales call", 4], ["Support ticket", 3], ["Email", 2], ["User interview", 2]];

const GROUPS: Group[] = [
  {
    profile: "rising",
    segments: [["Enterprise", 4], ["Mid-market", 4], ["SMB", 1], ["Startup", 1]],
    sources: SOURCES_SUPPORT,
    rating: [1, 3],
    texts: [
      "The main dashboard takes forever to load now. With about 400 active projects it sits on a spinner for 20 seconds before anything shows up.",
      "Dashboard is painfully slow since the last release. My team stopped opening it in the mornings because we can't wait that long.",
      "Loading the project board lags badly when we filter by team. Sometimes it freezes completely and I have to refresh the page.",
      "Pages time out when I open our portfolio view. We run a large workspace and it has gotten noticeably slower over the past month.",
      "Honestly the performance is unacceptable for the price. Every single report page takes more than ten seconds to load.",
      "Slow loading is our biggest problem right now. Our ops lead says it is blocking standups because the board won't render.",
      "We are evaluating alternatives mainly because Flowdesk is so sluggish with large projects. Load times have doubled since August.",
      "The dashboard spinner is back again. It was fast when we started, but now it takes a long time to open the home screen.",
      "Why is the timeline so laggy? Scrolling through a quarter of work stutters and sometimes freezes.",
      "The dashboard loads slowly on our office wifi and on a fiber connection, so it isn't our network.",
      "Our account is not huge, but the dashboard still takes about 8 seconds. Performance has really dropped.",
      "Opening a project with lots of tasks is slow. It's the one thing that makes me hesitate to recommend Flowdesk.",
    ],
  },
  {
    profile: "flat",
    segments: [["Startup", 4], ["SMB", 4], ["Mid-market", 2], ["Enterprise", 1]],
    sources: SOURCES_SUPPORT,
    rating: [2, 3],
    texts: [
      "Onboarding was confusing. I didn't know where to start after creating the workspace and ended up watching a video for twenty minutes.",
      "Our new hires get lost in the first week. There's no walkthrough, and the empty project screen doesn't explain what to do next.",
      "Getting started took us three days. Setting up templates, inviting the team, and figuring out boards was overwhelming.",
      "I wish the setup guided me through creating my first project. The learning curve is steep for people who aren't project managers.",
      "As a new user I had no idea where to find the basics. A short tutorial would make the first day so much easier.",
      "The first-run experience is cluttered. Too many options at once and no clear first step.",
      "We almost cancelled during the trial because nobody understood how to organize work. Onboarding needs to be clearer.",
      "Inviting teammates during setup was confusing, half of our invites went to the wrong role.",
      "Good product, but the initial setup is hard to figure out. Our consultant had to walk the whole team through it.",
      "Can't figure out the difference between projects, workspaces and portfolios. The terms are confusing during onboarding.",
      "I had to read the docs for an hour before my team could use it. Getting started should not be this hard.",
    ],
  },
  {
    profile: "late",
    segments: [["Mid-market", 4], ["SMB", 3], ["Enterprise", 2], ["Startup", 2]],
    sources: SOURCES_SUPPORT,
    rating: [1, 3],
    texts: [
      "We never got a Slack notification when a task was reassigned to me, so I missed a deadline.",
      "Slack notifications are unreliable. Some mentions show up an hour late and some never arrive at all.",
      "Missing Slack alerts is a deal breaker for our support team. We rely on those pings to react quickly.",
      "I wish I could choose which events post to which Slack channel. Right now it's either everything or nothing and it's too noisy.",
      "The email digest is fine, but I need real-time Slack notifications for blocked tasks. We keep finding out too late.",
      "Notifications from the Slack integration stopped working for our private channels last week.",
      "Please add a way to mute notifications per project. The noise means people ignore every alert.",
      "We missed a launch handoff because the mention notification never reached Slack. This happens a couple of times a month.",
      "Notification settings are scattered across three places and it's unclear which one controls Slack.",
      "The Slack app doesn't notify us when comments are added to subtasks, which is where most of our discussion happens.",
      "Never got reminders for tasks due tomorrow. We are a distributed team and rely on timely reminders.",
    ],
  },
  {
    profile: "flat",
    segments: [["Mid-market", 4], ["Enterprise", 3], ["SMB", 3], ["Startup", 1]],
    sources: SOURCES_SALES,
    rating: [2, 3],
    texts: [
      "Building a status report for executives takes me two hours every Friday because I have to export to CSV and rebuild charts in Excel.",
      "Reporting is difficult. I can't customize the report layout or save a template for our weekly summary.",
      "Would love scheduled reports that email stakeholders automatically. Right now I screenshot dashboards.",
      "The analytics are too shallow. I need velocity and burndown by team and can't get them without exporting.",
      "Exporting to PDF breaks the formatting, so I can't share reports with clients.",
      "I wish the reports let me filter by custom fields. Our leadership asks for numbers by customer and I can't produce them.",
      "Difficult to get insight into how work is progressing across projects. We built our own spreadsheet instead.",
      "Cross-project reporting is missing. Each report only covers a single project, which isn't useful for a portfolio review.",
      "Reports are hard to share. The shared link requires a login, and our client doesn't have one.",
      "Please add a custom report builder. Presenting progress to the board is the one thing I still do outside Flowdesk.",
      "The export to CSV drops the assignee column, which makes the data pointless for our weekly analytics.",
    ],
  },
  {
    profile: "flat",
    segments: [["Startup", 3], ["SMB", 4], ["Mid-market", 2], ["Enterprise", 1]],
    sources: SOURCES_REVIEW,
    rating: [1, 3],
    texts: [
      "The mobile app is missing half of the desktop features. I can't edit dependencies or reports from my phone.",
      "Android app crashes when I attach a photo to a task. Happens every time on my Pixel.",
      "I do site visits all day, and the mobile app has no offline mode. If I lose signal, I lose my updates.",
      "Mobile experience is clunky. Tiny buttons, and the board is hard to use with one hand.",
      "Push notifications on iOS arrive twice, sometimes hours late.",
      "I'd love to be able to approve tasks from my phone. Right now I have to open my laptop.",
      "The iPad layout looks like a stretched phone app. Using the timeline on a tablet is painful.",
      "Mobile search is slower than on desktop and often doesn't find tasks I know exist.",
      "There is a mobile app, but it logs me out every few days and I have to sign in again on the go.",
      "Our field team gave up on the mobile app because it doesn't work offline. They are back to paper.",
    ],
  },
  {
    profile: "mild",
    segments: [["Enterprise", 6], ["Mid-market", 3], ["SMB", 1], ["Startup", 0.2]],
    sources: SOURCES_SALES,
    rating: [1, 3],
    texts: [
      "Permission management is a mess. I can't give contractors access to a single project without exposing the entire workspace.",
      "We need granular roles. Admin and member aren't enough for a company our size, and security keeps asking for audit logs.",
      "Guests can see more than they should. We've had to remove client access entirely because of this.",
      "Please add read-only access for stakeholders. We don't want them editing tasks by accident.",
      "No SSO on our plan and the lack of role controls is blocking our security review. We might have to choose another tool.",
      "I can't see who has access to what. Auditing permissions across 60 projects is impossible.",
      "Private projects are not really private, admins can still see everything and our HR team can't accept that.",
      "Changing permissions for a team means clicking through every project one at a time. It takes ages.",
      "We want to restrict who can export data. Right now any member can download everything.",
      "Client access is confusing. External users end up with the wrong visibility and we find out afterwards.",
    ],
  },
  {
    profile: "flat",
    segments: [["SMB", 5], ["Startup", 5], ["Mid-market", 1], ["Enterprise", 0.3]],
    sources: [["Sales call", 4], ["Support ticket", 3], ["Survey", 2], ["Email", 2]],
    rating: [1, 3],
    texts: [
      "Per-seat pricing is too expensive for our small team. We only need two admins but have to pay for twelve seats.",
      "The jump from the Team plan to Business is steep. Our budget can't absorb it and we are considering downgrading.",
      "Pricing is confusing. I couldn't tell which features are on which plan until I had already upgraded.",
      "Renewal price went up 20% with no notice. That's a reason for us to look at alternatives.",
      "Too expensive compared to similar tools. For our startup the cost per user is hard to justify.",
      "We hit the project limit on the free plan within a week. The upgrade jump is huge.",
      "Please offer annual billing discounts or a viewer seat. Paying full price for people who only read updates isn't fair.",
      "Billing was a nightmare. We were charged twice and the invoice didn't match the seats we had.",
      "Value for money is poor for guests and contractors. We keep removing people to save on seats.",
      "The pricing page doesn't explain what counts as a seat. We were surprised by the invoice.",
      "We almost cancelled at renewal. If the price stays like this we will switch to a cheaper competitor.",
    ],
  },
  {
    profile: "flat",
    segments: [["Mid-market", 3], ["SMB", 3], ["Enterprise", 2], ["Startup", 2]],
    sources: SOURCES_SUPPORT,
    rating: [2, 4],
    texts: [
      "I can only assign a task to one person. Our tasks usually have a main owner and a reviewer.",
      "Please add multiple assignees. Pair work and handoffs are the norm for our team.",
      "Subtasks can't have their own due dates and assignees in the board view, which makes breaking down work messy.",
      "Workload view is missing. I can't tell who is overloaded before I assign new work.",
      "There's no way to bulk reassign tasks when someone leaves. I had to update forty tasks one by one.",
      "Dependencies are limited. I can't set a task to start automatically when its predecessor is done.",
      "Recurring tasks reset the assignee every cycle, so someone has to fix them each week.",
      "Task ownership is unclear when several people work on the same item. I wish there was a reviewer field.",
      "Would be great to assign tasks to a team and let someone claim it.",
      "Assigning a task from a comment thread requires too many clicks.",
    ],
  },
  {
    profile: "mild",
    segments: [["Mid-market", 4], ["Enterprise", 3], ["SMB", 2], ["Startup", 1]],
    sources: SOURCES_SUPPORT,
    rating: [2, 3],
    texts: [
      "The Google Calendar sync is one-way. Changes I make in the calendar don't update the task due dates.",
      "Outlook calendar integration is missing entirely. Half of our company is on Microsoft 365.",
      "Calendar sync duplicates events every time a due date changes. Our calendars are full of ghosts.",
      "I need two-way sync with Google Calendar. Right now moving a meeting means updating Flowdesk by hand.",
      "The calendar view doesn't respect time zones. Our team in Berlin sees deadlines a day off.",
      "Please support iCal feeds per project so stakeholders can subscribe without a login.",
      "Calendar integration stopped syncing after we changed our Google Workspace password. It took support three days to fix.",
      "The calendar doesn't show meetings next to tasks, so I can't plan realistic workloads.",
      "Sync with Outlook would help our consultants who live in their calendars.",
    ],
  },
  {
    profile: "flat",
    segments: [["Mid-market", 3], ["SMB", 3], ["Startup", 3], ["Enterprise", 2]],
    sources: [["Survey", 4], ["App review", 3], ["User interview", 2], ["Support ticket", 2]],
    rating: [4, 5],
    texts: [
      "Love the timeline view. It gives our distributed team one place to see what's happening across time zones.",
      "Flowdesk replaced three tools for us. The board and docs together saved us hours every week.",
      "Great product. The interface is clean and my team picked up the basics quickly.",
      "Customer support was fantastic. They answered within an hour and fixed our import problem.",
      "The Slack integration for creating tasks from messages is brilliant. It saves us so much copy and paste.",
      "Easy to use and reliable. We have run all our client projects in Flowdesk for a year without problems.",
      "Templates saved us when we set up a new client project. Big fan of how fast it was to start.",
      "Really happy with the comments and mentions. It keeps all our discussion attached to the work.",
      "The recent update to the board view is excellent. Drag and drop feels smooth.",
      "Best project tool we've used for remote teams. Clean, simple and the roadmap is clear.",
      "I'd recommend Flowdesk to any agency. Setting up client portals was easy and the guest access works well.",
      "Pricing is fair for what we get. The Team plan covers everything a small studio needs.",
      "Reports are useful. The weekly summary email gets read by our whole leadership team.",
      "The mobile app is surprisingly solid. I can update tasks on the train without issues.",
    ],
  },
  {
    profile: "flat",
    segments: [["SMB", 2], ["Startup", 2], ["Mid-market", 2], ["Enterprise", 1]],
    sources: [["Email", 3], ["Survey", 2], ["Slack community", 2]],
    rating: [3, 3],
    texts: [
      "We use Flowdesk for our marketing team and for engineering.",
      "Is there a changelog I can subscribe to?",
      "Maybe consider a dark mode? It would be easier on the eyes at night.",
      "Dark mode please, the white background is rough in the evening.",
      "The logo update looks nice.",
      "Switched our team over last month.",
    ],
  },
];

const CUSTOMERS = [
  "Northwind Labs", "Brightside Studio", "Kestrel Logistics", "Orchard Health", "Lumen Analytics", "Harbor & Pine", "Foxglove Media", "Meridian Works", "Paperplane Co", "Atlas Freight", "Bluebird Learning", "Cobalt Systems", "Driftwood Design", "Evergreen Care", "Fathom Robotics", "Granite Partners", "Hollow Oak", "Ironbridge Ltd", "Juniper Cloud", "Keystone Legal", "Lighthouse Labs", "Marlow & Co", "Nimbus Travel", "Opal Finance", "Pinecone Games", "Quartz Energy", "Riverbend Dental", "Saffron Foods", "Tidewater Group", "Umber Studio", "Verity Insurance", "Willow Education", "Xylo Mobility", "Yarrow Biotech", "Zephyr Apps", "Arbor Consulting", "Beacon Retail", "Cinder Security", "Dune Capital", "Ember Agency",
];

const PLAN_FOR: Record<Seg, [string, number][]> = {
  Enterprise: [["Enterprise", 3], ["Business", 1]],
  "Mid-market": [["Business", 3], ["Team", 1]],
  SMB: [["Team", 3], ["Business", 1], ["Free", 1]],
  Startup: [["Free", 2], ["Team", 3]],
};

const START = Date.UTC(2026, 7, 3); // Monday 3 Aug 2026
const WEEKS = 16;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rnd: () => number, items: [T, number][]): T {
  const total = items.reduce((n, [, w]) => n + w, 0);
  let r = rnd() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
}

function weekWeights(profile: Profile): [number, number][] {
  return Array.from({ length: WEEKS }, (_, w) => {
    const x = w / (WEEKS - 1);
    const weight =
      profile === "rising" ? 0.15 + 4 * x * x
      : profile === "late" ? (w >= 8 ? 1 + (w - 8) * 0.6 : 0)
      : profile === "early" ? 1.2 - x
      : profile === "mild" ? 0.6 + x
      : 1;
    return [w, weight];
  });
}

export function buildFlowdeskSample(): FeedbackEntry[] {
  const rnd = mulberry32(20260803);
  const entries: FeedbackEntry[] = [];
  let n = 0;
  for (const g of GROUPS) {
    const weeks = weekWeights(g.profile);
    for (const text of g.texts) {
      n++;
      const week = weighted(rnd, weeks);
      const day = Math.floor(rnd() * 5);
      const date = new Date(START + (week * 7 + day) * 86400000).toISOString().slice(0, 10);
      const segment = weighted(rnd, g.segments);
      const rating = g.rating[0] + Math.floor(rnd() * (g.rating[1] - g.rating[0] + 1));
      entries.push({
        id: `fd-${String(n).padStart(3, "0")}`,
        text,
        customer: CUSTOMERS[Math.floor(rnd() * CUSTOMERS.length)],
        source: weighted(rnd, g.sources),
        date,
        segment,
        plan: weighted(rnd, PLAN_FOR[segment]),
        rating,
      });
    }
  }
  return entries.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id));
}

export const SAMPLE_PRODUCT = "Flowdesk";
export const SAMPLE_DESCRIPTION = "A fictional project management platform for distributed teams. 115 entries across eight sources, with recurring problems, a few emerging ones, and plenty of praise.";
