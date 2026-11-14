#!/usr/bin/env bash
set -euo pipefail

APP=efh-agents
mkdir -p "$APP" && cd "$APP"

cat > package.json <<'JSON'
{
  "name": "efh-agents",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node --env-file=.env dist/index.js",
    "seed:sql": "cat sql/schema.sql"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "axios": "^1.7.7",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "node-cron": "^3.0.3",
    "openai": "^4.56.0",
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.2",
    "yaml": "^2.6.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "typescript": "^5.6.3"
  }
}
JSON

cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "outDir": "dist",
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src"]
}
JSON

cat > .env.example <<'ENV'
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
APP_PORT=8788
DEFAULT_TIMEZONE=America/Indiana/Indianapolis
ENV

cp .env.example .env

mkdir -p sql src/{lib,core,agents,tools,routes} examples

# ── SQL: agents, runs, tasks, audit ────────────────────────────────────────────
cat > sql/schema.sql <<'SQL'
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,      -- e.g. 'content-planner'
  name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  status text not null default 'queued', -- queued|running|needs_review|completed|failed
  input jsonb,
  output jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  cron text,                         -- e.g. "0 9 * * *"
  next_run_at timestamptz,
  enabled boolean default true,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  level text default 'info',
  message text,
  data jsonb,
  created_at timestamptz default now()
);

create table if not exists kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

create or replace function ensure_kv_table() returns void language plpgsql as $$
begin
  create table if not exists kv ( key text primary key, value jsonb, updated_at timestamptz default now() );
end$$;
SQL

# ── lib: logger + db ───────────────────────────────────────────────────────────
cat > src/lib/logger.ts <<'TS'
import pino from "pino";
export const log = pino({
  transport: { target: "pino-pretty", options: { colorize: true } },
  level: process.env.LOG_LEVEL ?? "info",
});
TS

cat > src/lib/db.ts <<'TS'
import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"); }
export const sb = createClient(url, key);
TS

# ── core: types, registry, runner, tool interface ──────────────────────────────
cat > src/core/types.ts <<'TS'
export type ToolContext = {
  emit: (message: string, data?: any) => Promise<void>;
  vars: Record<string,string|number|boolean|undefined>;
};

export type Tool = {
  name: string;
  description: string;
  run: (args: Record<string,any>, ctx: ToolContext) => Promise<any>;
};

export type AgentStep =
  | { type: "prompt"; role?: "system"|"user"; template: string; tool?: string; args?: Record<string,any>; saveAs?: string; requiresReview?: boolean }
  | { type: "tool"; tool: string; args?: Record<string,any>; saveAs?: string; requiresReview?: boolean };

export type AgentSpec = {
  slug: string;
  name: string;
  description: string;
  steps: AgentStep[];
  defaults?: Record<string, any>;
};
TS

cat > src/core/registry.ts <<'TS'
import { AgentSpec } from "./types.js";
import contentPlanner from "../agents/content-planner.spec.js";

const registry: AgentSpec[] = [
  contentPlanner,
  // add more agent specs here
];

export function getAgentBySlug(slug: string) {
  return registry.find(a => a.slug === slug);
}

export function listAgents() {
  return registry;
}
TS

cat > src/core/tools.ts <<'TS'
import { Tool } from "./types.js";
import httpFetch from "../tools/http-fetch.js";
import supaKV from "../tools/supabase-kv.js";

const tools: Tool[] = [
  httpFetch,
  supaKV,
  // add more tools (calendar, email, socials) here
];

export function getTool(name: string) {
  return tools.find(t => t.name === name);
}

export function listTools() {
  return tools;
}
TS

cat > src/core/runner.ts <<'TS'
import OpenAI from "openai";
import { sb } from "../lib/db.js";
import { getTool } from "./tools.js";
import { AgentSpec, AgentStep } from "./types.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function logAudit(runId: string, message: string, data?: any) {
  await sb.from("audit_logs").insert({ run_id: runId, message, data });
}

function interpolate(tpl: string, vars: Record<string,any>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

async function executeStep(runId: string, step: AgentStep, vars: Record<string,any>) {
  if (step.type === "prompt") {
    const role = step.role ?? "user";
    const msg = interpolate(step.template, vars);
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: role === "system"
        ? [{ role: "system", content: msg }]
        : [{ role: "system", content: "You are a helpful business automation agent." }, { role, content: msg }]
    });
    const text = res.choices[0]?.message?.content ?? "";
    if (step.saveAs) vars[step.saveAs] = text;
    await logAudit(runId, "prompt_ok", { role, tokens: res.usage, preview: text.slice(0,240) });
    if (step.requiresReview) throw { needsReview: true, outputVar: step.saveAs };
    return { vars };
  }

  if (step.type === "tool") {
    const tool = getTool(step.tool);
    if (!tool) throw new Error(\`Tool not found: \${step.tool}\`);
    const output = await tool.run(step.args ?? {}, {
      vars,
      emit: (message, data) => logAudit(runId, message, data)
    });
    if (step.saveAs) vars[step.saveAs] = output;
    if (step.requiresReview) throw { needsReview: true, outputVar: step.saveAs };
    await logAudit(runId, "tool_ok", { tool: step.tool, preview: String(output).slice(0,240) });
    return { vars };
  }
}

export async function runAgent(spec: AgentSpec, runId: string, input: Record<string,any>) {
  let vars: Record<string,any> = { ...(spec.defaults ?? {}), ...(input ?? {}) };
  try {
    await sb.from("runs").update({ status: "running" }).eq("id", runId);
    for (const step of spec.steps) {
      const r = await executeStep(runId, step, vars);
      vars = r?.vars ?? vars;
    }
    await sb.from("runs").update({ status: "completed", output: vars }).eq("id", runId);
    return vars;
  } catch (e: any) {
    if (e?.needsReview) {
      await sb.from("runs").update({ status: "needs_review", output: vars }).eq("id", runId);
      return vars;
    }
    await sb.from("runs").update({ status: "failed", error: String(e?.message ?? e) }).eq("id", runId);
    throw e;
  }
}
TS

# ── tools: http fetch + simple Supabase KV (demo) ──────────────────────────────
cat > src/tools/http-fetch.ts <<'TS'
import axios from "axios";
import { Tool } from "../core/types.js";

const httpFetch: Tool = {
  name: "http.fetch",
  description: "Fetch a URL and return JSON or text",
  async run(args) {
    const url = args.url;
    const expect = (args.expect ?? "json").toLowerCase();
    const res = await axios.get(url, { timeout: 20000 });
    return expect === "json" && typeof res.data === "object" ? res.data : res.data?.toString?.() ?? String(res.data);
  }
};

export default httpFetch;
TS

cat > src/tools/supabase-kv.ts <<'TS'
import { Tool } from "../core/types.js";
import { sb } from "../lib/db.js";

const supaKV: Tool = {
  name: "supabase.kv",
  description: "Store or get small blobs of data in a KV table (creates if absent).",
  async run(args) {
    await sb.rpc("ensure_kv_table"); // no-op if not present; see SQL function below (optional)
    const op = args.op ?? "set";
    if (op === "set") {
      const { key, value } = args;
      const { error } = await sb.from("kv").upsert({ key, value });
      if (error) throw error;
      return true;
    } else {
      const { key } = args;
      const { data, error } = await sb.from("kv").select("*").eq("key", key).limit(1);
      if (error) throw error;
      return data?.[0]?.value ?? null;
    }
  }
};

export default supaKV;
TS

# ── example agent: Content Planner (like Enso marketing agent) ─────────────────
cat > src/agents/content-planner.spec.ts <<'TS'
import { AgentSpec } from "../core/types.js";

const spec: AgentSpec = {
  slug: "content-planner",
  name: "Content Planner",
  description: "Plans a week of posts for a brand, then stores the plan.",
  defaults: {
    brand: "Elevate for Humanity / Merigoround",
    tone: "warm, professional, community-centered",
    channels: "Facebook, Instagram, LinkedIn, TikTok",
    keyword: "workforce development, tea & wellness, training, grants"
  },
  steps: [
    {
      type: "prompt",
      role: "system",
      template: "You are a marketing strategist who creates concise, post-ready content calendars with CTAs and hashtags."
    },
    {
      type: "prompt",
      role: "user",
      saveAs: "plan",
      template: "Create a 7-day content plan for {{brand}} across {{channels}} using keywords {{keyword}}. Each day: 1 headline, 1 post caption (<=120 words), 3-5 hashtags, and 1 CTA."
    },
    {
      type: "tool",
      tool: "supabase.kv",
      args: { op: "set", key: "content_plan_latest", value: { fromAgent: "content-planner", plan: "{{plan}}" } },
      requiresReview: true
    }
  ]
};

export default spec;
TS

# ── routes: simple REST API ────────────────────────────────────────────────────
cat > src/routes/api.ts <<'TS'
import { Router } from "express";
import { sb } from "../lib/db.js";
import { getAgentBySlug, listAgents } from "../core/registry.js";
import { runAgent } from "../core/runner.js";

export const api = Router();

api.get("/agents", (_req, res) => res.json({ agents: listAgents().map(a => ({ slug: a.slug, name: a.name, description: a.description })) }));

api.post("/runs/:slug", async (req, res) => {
  const spec = getAgentBySlug(req.params.slug);
  if (!spec) return res.status(404).json({ error: "Agent not found" });

  const { data, error } = await sb.from("agents").upsert({ slug: spec.slug, name: spec.name, description: spec.description }, { onConflict: "slug" }).select().limit(1);
  if (error) return res.status(500).json({ error: error.message });

  const agentId = data![0].id;
  const { data: runRows, error: rErr } = await sb.from("runs").insert({ agent_id: agentId, input: req.body ?? {} }).select().limit(1);
  if (rErr) return res.status(500).json({ error: rErr.message });
  const run = runRows![0];

  runAgent(spec, run.id, req.body ?? {}).catch(()=>{});
  res.json({ queued: true, run_id: run.id });
});

api.get("/runs/:id", async (req, res) => {
  const { data, error } = await sb.from("runs").select("*").eq("id", req.params.id).limit(1);
  if (error) return res.status(500).json({ error: error.message });
  if (!data?.[0]) return res.status(404).json({ error: "not found" });
  res.json(data[0]);
});
TS

# ── server + scheduler ─────────────────────────────────────────────────────────
cat > src/index.ts <<'TS'
import "dotenv/config";
import express from "express";
import cron from "node-cron";
import { api } from "./routes/api.js";
import { log } from "./lib/logger.js";
import { sb } from "./lib/db.js";
import { getAgentBySlug } from "./core/registry.js";
import { runAgent } from "./core/runner.js";

const app = express();
app.use(express.json());
app.use("/api", api);
app.get("/", (_req,res)=>res.json({ ok:true, service:"EFH Agents"}));

const PORT = Number(process.env.APP_PORT || 8788);

// Example: run content-planner every Monday 9am ET
cron.schedule("0 9 * * 1", async () => {
  try {
    const spec = getAgentBySlug("content-planner");
    if (!spec) return;
    const { data: a } = await sb.from("agents").upsert({ slug: spec.slug, name: spec.name, description: spec.description }, { onConflict:"slug" }).select().limit(1);
    const agentId = a?.[0]?.id;
    if (!agentId) return;

    const { data: runRows, error } = await sb.from("runs").insert({ agent_id: agentId, input: {} }).select().limit(1);
    if (error) throw error;
    await runAgent(spec, runRows![0].id, {});
    log.info("Weekly content-planner run completed");
  } catch(e:any) {
    log.error(e, "cron error");
  }
}, { timezone: process.env.DEFAULT_TIMEZONE || "America/Indiana/Indianapolis" });

app.listen(PORT, () => log.info(\`EFH Agents running on :\${PORT}\`));
TS

# ── example curl ───────────────────────────────────────────────────────────────
cat > examples/README.md <<'MD'
# Try it

1) Create tables in Supabase (paste \`sql/schema.sql\` into SQL editor).
2) Fill \`.env\` with your keys.
3) Run the server:

\`\`\`bash
npm i
npm run dev
\`\`\`

4) Start a run:

\`\`\`bash
curl -X POST http://localhost:8788/api/runs/content-planner \\
  -H "Content-Type: application/json" \\
  -d '{"brand":"Merigoround","channels":"Facebook, TikTok","keyword":"herbal tea, wellness, workforce"}'
\`\`\`

5) Poll status:

\`\`\`bash
curl http://localhost:8788/api/runs/REPLACE_RUN_ID
\`\`\`

MD

npm i
echo "✅ Scaffold ready. Next: add your own agents in src/agents and tools in src/tools."
