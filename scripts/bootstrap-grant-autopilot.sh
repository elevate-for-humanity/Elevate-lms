#!/usr/bin/env bash
set -euo pipefail

APP_DIR="efh-grant-autopilot"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# ── Node/TS project ────────────────────────────────────────────────────────────
cat > package.json << 'JSON'
{
  "name": "efh-grant-autopilot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node --env-file=.env --enable-source-maps ./dist/index.js",
    "build": "tsc -p tsconfig.json",
    "lint": "echo 'lint placeholder'",
    "db:sql:print": "cat sql/schema.sql"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "axios": "^1.7.7",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "googleapis": "^144.0.0",
    "node-cron": "^3.0.3",
    "openai": "^4.56.0",
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "typescript": "^5.6.3"
  }
}
JSON

cat > tsconfig.json << 'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "outDir": "dist",
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src"]
}
JSON

# ── env template ───────────────────────────────────────────────────────────────
cat > .env.example << 'ENV'
# ── OpenAI ──
OPENAI_API_KEY=sk-...

# ── Supabase ──
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Google (service account JSON contents, one line, or path) ──
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"}'
GOOGLE_CALENDAR_ID=primary

# ── App Settings ──
APP_PORT=8787
ORG_DISPLAY_NAME="Elevate for Humanity"
ORG_EIN="00-0000000"
ORG_DOMAINS="elevateforhumanity.org,selfishinc.org"
DEFAULT_TIMEZONE="America/Indiana/Indianapolis"

# ── Feature Flags ──
ENABLE_GRANTS_GOV=true
ENABLE_FOUNDATION_FEEDS=true

# ── (Optional) Grants.gov API if available ──
GRANTS_GOV_API_KEY=
ENV

cp .env.example .env

# ── SQL schema ─────────────────────────────────────────────────────────────────
mkdir -p sql
cat > sql/schema.sql << 'SQL'
-- Run these in Supabase (SQL editor)

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ein text,
  websites text[],
  focus_areas text[],       -- e.g. ['workforce','entrepreneurship','healthcare']
  location text,            -- e.g. 'Indianapolis, IN'
  created_at timestamptz default now()
);

create table if not exists grants_catalog (
  id uuid primary key default gen_random_uuid(),
  source text not null,     -- 'grants.gov' | 'foundation' | 'state' | 'custom'
  external_id text,         -- e.g. opportunitynumber
  title text not null,
  synopsis text,
  sponsor text,
  url text,
  posted_date date,
  close_date date,
  categories text[],        -- program categories
  eligibility text[],       -- eligible applicant types
  amount_min numeric,
  amount_max numeric,
  raw jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_grants_catalog_dates on grants_catalog (close_date, posted_date);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references grants_catalog(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  match_score numeric,      -- 0..1
  reasons text[],
  status text default 'new',-- 'new'|'drafted'|'submitted'|'awarded'|'declined'
  created_at timestamptz default now()
);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  executive_summary text,
  need_statement text,
  objectives text,
  methods text,
  outcomes text,
  budget_narrative text,
  full_proposal text,
  tokens_used int,
  created_at timestamptz default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  portal text,            -- 'grants.gov' | 'foundation-portal'
  submitted_at timestamptz,
  confirmation_number text,
  notes text
);
SQL

# ── src tree ───────────────────────────────────────────────────────────────────
mkdir -p src/services src/templates src/lib

# logger
cat > src/lib/logger.ts << 'TS'
import pino from "pino";
export const log = pino({
  transport: { target: "pino-pretty", options: { colorize: true } },
  level: process.env.LOG_LEVEL ?? "info"
});
TS

# db
cat > src/lib/db.ts << 'TS'
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  throw new Error("Supabase config missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

export const sb = createClient(url, key);
TS

# OpenAI writer
cat > src/services/writer.ts << 'TS'
import OpenAI from "openai";
import { log } from "../lib/logger.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type DraftInput = {
  orgName: string;
  orgFocus: string[];
  grantTitle: string;
  grantSynopsis: string;
  sponsor?: string;
  amount?: string;
  city?: string;
  state?: string;
};

const SYSTEM = \`You are an expert nonprofit grant writer for workforce development, entrepreneurship, healthcare pathways, and community services. 
Write clearly, concretely, and avoid fluffy language. 
Use measurable outcomes. Align with DOL/DWD best practices.\`;

export async function draftProposal(input: DraftInput) {
  const user = \`
Organization: \${input.orgName}
Focus Areas: \${input.orgFocus.join(", ")}
Location: \${input.city ?? ""} \${input.state ?? ""}
Grant: \${input.grantTitle}
Sponsor: \${input.sponsor ?? "Unknown"}
Synopsis: \${input.grantSynopsis}
Award Range: \${input.amount ?? "N/A"}

Write: 
1) Executive Summary (150-200 words)
2) Statement of Need (200-250 words) referencing workforce gaps
3) Objectives (bulleted, SMART)
4) Methods (training, partnerships, wraparound services)
5) Outcomes & Evaluation (KPIs, data sources)
6) Budget Narrative (staffing, supplies, participant supports)
Keep it tailored and specific.\`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user }
    ],
    temperature: 0.2
  });

  const text = res.choices[0]?.message?.content ?? "";
  log.info({ tokens: res.usage }, "Draft generated");
  return { text, tokens: res.usage?.total_tokens ?? 0 };
}
TS

# Google Calendar
cat > src/services/calendar.ts << 'TS'
import { google } from "googleapis";
import { log } from "../lib/logger.js";

export async function addDeadlineToCalendar(summary: string, dueISO: string, description?: string) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  const json = raw.trim().startsWith("{") ? JSON.parse(raw) : null;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must be a JSON string");

  const jwt = new google.auth.JWT({
    email: json.client_email,
    key: json.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"]
  } as any);

  const calendar = google.calendar({ version: "v3", auth: jwt });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  const start = new Date(dueISO).toISOString();
  const end = new Date(new Date(dueISO).getTime() + 60 * 60 * 1000).toISOString();

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description: description ?? "Grant deadline",
      start: { dateTime: start },
      end: { dateTime: end }
    }
  });

  log.info({ eventId: res.data.id }, "Calendar event created");
  return res.data;
}
TS

# Grant sources (stub + example)
cat > src/services/grants.ts << 'TS'
import axios from "axios";
import { sb } from "../lib/db.js";
import { log } from "../lib/logger.js";

/**
 * addOrUpdateGrant: idempotently upserts a grant into grants_catalog.
 */
async function addOrUpdateGrant(g: any) {
  const { data, error } = await sb
    .from("grants_catalog")
    .upsert(g, { onConflict: "external_id" })
    .select();
  if (error) throw error;
  return data?.[0];
}

/**
 * Example: fetch from Grants.gov public API (requires API key; if not present, skip).
 * You can also scrape their RSS as a fallback or pre-load via CSV.
 */
export async function fetchGrantsGov() {
  if (!process.env.ENABLE_GRANTS_GOV || process.env.ENABLE_GRANTS_GOV === "false") return 0;
  const key = process.env.GRANTS_GOV_API_KEY;
  if (!key) {
    log.warn("GRANTS_GOV_API_KEY not set; skipping Grants.gov fetch.");
    return 0;
  }

  const params = {
    // Example query params: workforce & education categories
    // See Grants.gov API docs for filters; here we keep generic.
    api_key: key,
    // placeholder fields for illustration:
    opportunityStatuses: "posted"
  };

  const url = "https://www.grants.gov/grantsws/rest/opportunities/search/";
  const res = await axios.post(url, params);
  const items = res.data?.opportunities || [];

  let count = 0;
  for (const it of items) {
    const row = {
      source: "grants.gov",
      external_id: it?.opportunityNumber,
      title: it?.opportunityTitle,
      synopsis: it?.synopsis,
      sponsor: it?.agency,
      url: \`https://www.grants.gov/search-results-detail/\${encodeURIComponent(it?.opportunityNumber ?? "")}\`,
      posted_date: it?.postDate ? it.postDate.split("T")[0] : null,
      close_date: it?.closeDate ? it.closeDate.split("T")[0] : null,
      categories: it?.category?.split(",") ?? null,
      eligibility: it?.eligibleApplicants?.split(",") ?? null,
      amount_min: it?.awardCeiling ? Number(it.awardFloor ?? 0) : null,
      amount_max: it?.awardCeiling ? Number(it.awardCeiling) : null,
      raw: it
    };
    await addOrUpdateGrant(row);
    count++;
  }
  return count;
}

/**
 * Example Foundation RSS/JSON feeders (stubbed with illustrative endpoints).
 * Replace with your curated list of Indiana / national foundations.
 */
export async function fetchFoundationFeeds() {
  if (!process.env.ENABLE_FOUNDATION_FEEDS || process.env.ENABLE_FOUNDATION_FEEDS === "false") return 0;

  // Add your handpicked sources here:
  const feeds = [
    // { name: "Lilly Endowment (example)", type: "html", url: "https://example.org/grants" }
  ];

  let count = 0;
  for (const f of feeds) {
    // TODO: implement parsing & normalization for each foundation source you trust
    // For now, just log placeholder:
    // After parsing, call addOrUpdateGrant({ ...normalized })
    // count++;
    void f;
  }
  return count;
}

/**
 * Basic matching: score grants against organization focus areas & location keywords.
 */
export async function matchGrantsToOrg(orgId: string) {
  const { data: orgs, error: oerr } = await sb.from("organizations").select("*").eq("id", orgId).limit(1);
  if (oerr) throw oerr;
  const org = orgs?.[0];
  if (!org) throw new Error("Organization not found");

  const { data: grants, error: gerr } = await sb
    .from("grants_catalog")
    .select("*")
    .lte("close_date", new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().slice(0,10)); // next 120 days
  if (gerr) throw gerr;

  let created = 0;
  for (const g of grants ?? []) {
    const title = (g.title ?? "").toLowerCase() + " " + (g.synopsis ?? "").toLowerCase();
    const needles = (org.focus_areas ?? []).map((x: string) => x.toLowerCase());
    const hits = needles.filter((n: string) => title.includes(n));
    const score = Math.min(1, hits.length / Math.max(1, needles.length));

    if (score >= 0.25) {
      const reasons = hits.length ? hits : ["general alignment"];
      const { data: exists, error: exErr } = await sb
        .from("matches").select("*")
        .eq("grant_id", g.id).eq("organization_id", org.id).limit(1);
      if (exErr) throw exErr;

      if (!exists || exists.length === 0) {
        const { error: insErr } = await sb.from("matches").insert({
          grant_id: g.id,
          organization_id: org.id,
          match_score: score,
          reasons
        });
        if (insErr) throw insErr;
        created++;
      }
    }
  }
  return created;
}
TS

# HTTP routes & cron
cat > src/index.ts << 'TS'
import "dotenv/config";
import express from "express";
import cron from "node-cron";
import { log } from "./lib/logger.js";
import { sb } from "./lib/db.js";
import { fetchGrantsGov, fetchFoundationFeeds, matchGrantsToOrg } from "./services/grants.js";
import { draftProposal } from "./services/writer.js";
import { addDeadlineToCalendar } from "./services/calendar.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.APP_PORT || 8787);
const ORG_NAME = process.env.ORG_DISPLAY_NAME ?? "Elevate for Humanity";

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "EFH Grant Autopilot", org: ORG_NAME });
});

/**
 * Seed an org (run once).
 * POST /api/org/seed { name, ein, websites[], focus_areas[], location }
 */
app.post("/api/org/seed", async (req, res) => {
  const body = req.body ?? {};
  const { data, error } = await sb.from("organizations").insert({
    name: body.name ?? ORG_NAME,
    ein: body.ein ?? process.env.ORG_EIN ?? null,
    websites: body.websites ?? (process.env.ORG_DOMAINS?.split(",") ?? []),
    focus_areas: body.focus_areas ?? ["workforce","entrepreneurship","healthcare","education"],
    location: body.location ?? "Indianapolis, IN"
  }).select().limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ seeded: data?.[0] });
});

/**
 * Trigger: fetch sources
 */
app.post("/api/scan", async (_req, res) => {
  const a = await fetchGrantsGov();
  const b = await fetchFoundationFeeds();
  res.json({ fetched: { grantsGov: a, foundations: b }});
});

/**
 * Trigger: match to org
 * POST /api/match { organization_id }
 */
app.post("/api/match", async (req, res) => {
  const orgId = req.body?.organization_id;
  if (!orgId) return res.status(400).json({ error: "organization_id required" });
  const created = await matchGrantsToOrg(orgId);
  res.json({ matches_created: created });
});

/**
 * Trigger: draft proposal for a match
 * POST /api/draft { match_id }
 */
app.post("/api/draft", async (req, res) => {
  const matchId = req.body?.match_id;
  if (!matchId) return res.status(400).json({ error: "match_id required" });

  const { data: match, error: mErr } = await sb.from("matches")
    .select("*, grants_catalog(*), organizations(*)").eq("id", matchId).limit(1);
  if (mErr) return res.status(500).json({ error: mErr.message });
  const row = match?.[0];
  if (!row) return res.status(404).json({ error: "match not found" });

  const grant = row.grants_catalog;
  const org = row.organizations;

  const { text, tokens } = await draftProposal({
    orgName: org.name,
    orgFocus: org.focus_areas ?? [],
    grantTitle: grant.title,
    grantSynopsis: grant.synopsis ?? "",
    sponsor: grant.sponsor ?? "",
    amount: grant.amount_max ? \`$\${grant.amount_min ?? 0}–$\${grant.amount_max}\` : undefined,
    city: (org.location ?? "").split(",")[0],
    state: (org.location ?? "").split(",")[1]?.trim()
  });

  const { error: dErr, data: draft } = await sb.from("drafts").insert({
    match_id: row.id,
    full_proposal: text,
    tokens_used: tokens
  }).select().limit(1);
  if (dErr) return res.status(500).json({ error: dErr.message });

  const deadline = grant.close_date ? new Date(grant.close_date).toISOString() : null;
  if (deadline) {
    await addDeadlineToCalendar(\`Grant Deadline: \${grant.title}\`, deadline, grant.url ?? undefined);
  }

  // mark match as drafted
  await sb.from("matches").update({ status: "drafted" }).eq("id", row.id);

  res.json({ drafted: draft?.[0]?.id, tokens });
});

/**
 * Simple health
 */
app.get("/healthz", (_req, res) => res.send("ok"));

/**
 * CRON: every morning 9am Eastern → scan & match (org: first one)
 */
cron.schedule("0 9 * * *", async () => {
  try {
    log.info("CRON: fetching grants…");
    await fetchGrantsGov();
    await fetchFoundationFeeds();

    const { data: orgs } = await sb.from("organizations").select("id").limit(1);
    if (orgs && orgs[0]) {
      await matchGrantsToOrg(orgs[0].id);
      log.info({ orgId: orgs[0].id }, "CRON: matching complete");
    }
  } catch (e: any) {
    log.error(e, "CRON error");
  }
}, { timezone: process.env.DEFAULT_TIMEZONE ?? "America/Indiana/Indianapolis" });

app.listen(PORT, () => log.info(\`EFH Grant Autopilot running on :\${PORT}\`));
TS

# README
cat > README.md << 'MD'
# EFH Grant Autopilot

AI-powered grant discovery, matching, drafting, and deadline tracking for Elevate for Humanity.

## Quick Start

\`\`\`bash
cp .env.example .env
# fill in OPENAI_API_KEY, SUPABASE_* and GOOGLE_* values

npm i
npm run dev
\`\`\`

### 1) Create tables

Paste \`sql/schema.sql\` into Supabase SQL editor and run.

### 2) Seed your org

\`\`\`bash
curl -X POST http://localhost:8787/api/org/seed \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Elevate for Humanity","focus_areas":["workforce","entrepreneurship","healthcare","education"],"location":"Indianapolis, IN"}'
\`\`\`

Save the returned \`organization.id\`.

### 3) Scan & Match

\`\`\`bash
curl -X POST http://localhost:8787/api/scan
curl -X POST http://localhost:8787/api/match -H "Content-Type: application/json" \\
  -d '{"organization_id":"YOUR_ORG_ID"}'
\`\`\`

### 4) Draft a Proposal

Find a match in Supabase table \`matches\`, copy its \`id\`, then:

\`\`\`bash
curl -X POST http://localhost:8787/api/draft \\
  -H "Content-Type: application/json" \\
  -d '{"match_id":"MATCH_ID"}'
\`\`\`

This generates a full draft and places the deadline on your Google Calendar.

## Deployment

* **Render**: use \`npm run build\` then \`npm start\`. Add env vars in dashboard.
* **Docker**: wrap with a simple Dockerfile (\`node:20\`), expose 8787.
* **Gitpod**: just open repo; port 8787 public.

## Notes

* \`fetchFoundationFeeds()\` is a placeholder—add Indiana/national foundations you trust.
* Grants.gov API requires a key; if you don't have it yet, leave blank and load sources you do have.
* Prompts are tuned for workforce/entrepreneurship/healthcare pathways—edit in \`writer.ts\`.

MD

npm i
echo "✅ Project scaffolded. Next: open .env and fill secrets, then: npm run dev"
