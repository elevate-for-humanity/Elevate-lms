# Open Studio - AI Agent Context

## Overview

Open Studio is Elevate for Humanity's AI-powered development environment built on OpenHands SDK concepts. It provides an integrated workspace for coding, deployment, and LMS management.

> Correction 2026-11-23: this file previously documented `/api/devstudio/*`
> routes and `lib/dev-studio/agent.ts` / `lib/dev-studio/skills-loader.ts`.
> None of those exist at HEAD. The canonical Dev Studio API namespace is
> `/api/admin/dev-studio/*` (86 routes), enforced by
> `scripts/dev-studio-integration-gate.sh`; Dev Studio runtime code lives
> under `lib/devstudio/`. The sections below are corrected to the
> canonical paths. Anything marked "not present" was verified absent.

## Core Features

### 1. Agent System (`lib/devstudio/` — `lib/dev-studio/agent.ts` does NOT exist)
- **OpenHands agent**: `lib/devstudio/openhands/` (client, runtime, task access)
- **Message types**: user, assistant, system, tool
- **Session persistence**: Supabase `studio_conversations` table
- **Skill detection**: see Skills System below

### 2. Skills System (`lib/dev-studio/skills-loader.ts` does NOT exist)
Built-in skills with trigger keywords:
- **skill-creator**: Create new skills
- **github**: PRs, issues, repos
- **docker**: Container operations
- **kubernetes**: K8s operations
- **github-actions**: CI/CD workflows
- **jupyter**: Notebook operations
- **slack**: Slack integration
- **linear**: Linear project management
- **code-review**: Code quality analysis
- **testing**: Test automation

### 3. Conversation Persistence (`lib/dev-studio/conversation-store.ts`)
- **Storage**: Supabase `studio_conversations` table
- **Fallback**: localStorage
- **Features**: Create, update, delete, search, export/import

### 4. Sandbox Workspace (`components/dev-studio/WebContainerSandbox.tsx`)
- File tree browser
- Code editor with syntax highlighting
- Terminal output
- File upload support
- Run/stop execution controls

## Architecture

```
Open Studio
├── Chat Panel (UnifiedEllieChat)
│   ├── Skill activation
│   ├── Message history
│   └── Streaming responses
├── File Workspace (WebContainerSandbox)
│   ├── File tree
│   ├── Code editor
│   └── Terminal
├── Container Panel (DevContainerPanel)
│   ├── Northflank connection
│   ├── Environment variables
│   └── Build status
├── Deploy Panel (DeployPanel)
│   ├── Git operations
│   └── Northflank triggers
└── Settings (SecretsPanel)
    ├── API keys
    └── Model configuration
```

## API Endpoints (canonical — `/api/admin/dev-studio/*`)

| Endpoint | Purpose |
|----------|---------|
| `/api/admin/dev-studio/chat` | AI chat (Dev Studio) |
| `/api/admin/dev-studio/muse-loop` | Muse-style loop: branch → PR → CI check (no OpenHands) |
| `/api/admin/dev-studio/workflows` | Workflow management |
| `/api/admin/dev-studio/system-health` | System health status |
| `/api/admin/dev-studio/env` | Container environment |

The legacy `/api/devstudio/*` endpoints listed here before 2026-11-23 do
not exist at HEAD.

## Database Tables

### `studio_conversations`
Stores conversation history and configuration.
```sql
- id: UUID PRIMARY KEY
- user_id: UUID REFERENCES profiles
- title: TEXT
- messages: JSONB
- config: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `ai_tasks`
Stores workflow execution status.
```sql
- id: UUID PRIMARY KEY
- user_id: UUID REFERENCES profiles
- title: TEXT
- status: TEXT (pending/running/completed/failed)
- result: JSONB
- error: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `apprentice_competency_records`
Tracks DOL competency progress.
```sql
- id: UUID PRIMARY KEY
- apprentice_id: UUID REFERENCES profiles
- competency_code: TEXT
- competency_name: TEXT
- status: TEXT (not_started/in_progress/completed)
- verified: BOOLEAN
- verified_by: UUID
- verified_at: TIMESTAMPTZ
```

## Environment Variables

Required for Open Studio:
```
OPENAI_API_KEY or ANTHROPIC_API_KEY
NORTHFLANK_API_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Northflank Integration

Open Studio connects to Northflank for:
- Container management (`DevContainerPanel`)
- Service deployments (`DeployPanel`)
- Build triggers (`scripts/northflank/`)
- Health monitoring

## Skills Directory

Custom skills should be placed in:
```
.agents/skills/
├── skill-name/
│   ├── SKILL.md
│   └── references/
```

Skills are loaded via `getSkillsLoader()` and activated based on trigger keywords in user messages.