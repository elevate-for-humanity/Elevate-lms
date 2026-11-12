# ELEVATE OS UNIFIED SYSTEM — CAPABILITY INVENTORY

## Repository Info
```
Branch: main
SHA: d0bf4e6daf15deaccc6c0efb0deef2f63ad951c9
```

---

## PHASE 0: CAPABILITY INVENTORY TABLE

| Capability | Existing Files | Current Route | Current API | Database Tables | Status |
|------------|---------------|---------------|-------------|-----------------|--------|
| **AI Chat** | `apps/admin/app/studio/`, `lib/studio/agent.ts`, `lib/paris/dev-studio.ts` | `/admin/studio` | `/api/devstudio/chat` | `studio_conversations`, `studio_tasks` | WORKING |
| **Course Creation** | `apps/admin/app/studio/courses/`, `apps/admin/app/career-courses/` | `/admin/studio/courses`, `/admin/courses` | `/api/admin/courses/*`, `/api/admin/course-builder/*` | `courses`, `modules`, `lessons`, `quizzes` | WORKING |
| **Content Generation** | `apps/admin/app/paris/`, `lib/paris/` | `/admin/paris` | `/api/paris/*` | `ai_conversation_memory` | WORKING |
| **Media Management** | `apps/admin/app/studio/media/`, `apps/admin/app/media/` | `/admin/studio/media` | `/api/admin/media-assets` | `media_assets` | PARTIAL |
| **Deployment** | `components/studio/DeployPanel.tsx`, `apps/app/api/admin/deploy/` | `/admin/studio?workspace=deploy` | `/api/devstudio/deployments`, `/api/admin/deploy` | None (uses GitHub/Northflank) | WORKING |
| **Containers** | `components/studio/DevContainerPanel.tsx` | `/admin/studio?workspace=environments` | `/api/devstudio/devcontainer/*` | None (Northflank API) | WORKING |
| **Evaluation** | `apps/admin/app/evaluation/` | `/admin/evaluation` | `/api/evaluation/*` | `ai_tasks`, `guardrail_enforcement_log` | WORKING |
| **CFD Simulation** | `apps/admin/app/cfd-studio/` | `/admin/cfd-studio` | None (standalone) | None | PARTIAL |

---

## PHASE 1: EXISTING ARCHITECTURE

### Unified Dev Studio (`/admin/studio`)
```
apps/admin/app/studio/
├── page.tsx                          # Main DevStudioUnifiedClient
├── DevStudioUnifiedClient.tsx        # 38KB unified interface
├── layout.tsx
├── agents/                           # AI Agents sub-page
├── builds/                           # Build history
├── course/                           # Redirect to /courses
├── courses/                          # Course Builder
│   ├── page.tsx                     # Redirect to ?tab=courses
│   ├── [courseId]/                   # Course editing
│   ├── create/                       # Create course
│   ├── generate/                     # AI generation
│   ├── bulk-operations/              # Bulk actions
│   └── ai-builder/
│       └── AICourseBuilderChat.tsx    # AI Course Builder
├── deployments/                      # Deployments sub-page
├── media/                            # Media Studio
├── memory/                           # AI Memory
├── pages/                            # Page Builder
├── panels/                           # Studio panels
├── settings/                         # Settings
├── tasks/                            # AI Tasks
└── workflows/                        # Workflows
```

### Components Structure
```
components/studio/
├── AIChat.tsx                       # AI Chat interface
├── UnifiedEllieChat.tsx            # Unified chat
├── DeployPanel.tsx                 # Deployment panel
├── DevContainerPanel.tsx           # Container management
├── SecretsPanel.tsx                # Secrets management
├── ServicesPanel.tsx               # Services status
├── HealthPanel.tsx                 # Health checks
├── IntegrationsPanel.tsx           # Integrations
├── CommandCenterPanel.tsx           # Command center
├── WebContainerSandbox.tsx          # File sandbox
└── ...

components/admin/dashboard/
├── LizzyWorkspace.tsx              # Lizzy embedded
├── LizzyContainer.tsx              # Lizzy container
├── LizzyUploadPanel.tsx            # File upload
├── LizzyOperationsPanel.tsx         # Operations
├── LizzyErrorsPanel.tsx             # Error tracking
├── LizzyVideoPanel.tsx              # Video management
└── LizzyFilesPanel.tsx             # File management
```

### API Routes
```
apps/app/api/devstudio/
├── chat/route.ts                   # AI Chat
├── execute/route.ts                # Command execution
├── agents/route.ts                 # Agent management
├── builds/route.ts                 # Build management
├── conversations/route.ts          # Conversations
├── deploy/route.ts                # Deployments
├── devcontainer/route.ts           # Container control
├── health/route.ts                # Health checks
├── jobs/route.ts                  # Job management
├── memory/route.ts                 # AI memory
├── services/route.ts              # Services
├── skills/route.ts                # Skills loader
├── workflows/route.ts               # Workflows
├── upload/route.ts                 # File uploads
├── snapshot/route.ts               # Snapshots
├── tasks/route.ts                 # AI tasks
├── northflank-status/route.ts     # Northflank status
├── platform-status/route.ts        # Platform status
└── ...

apps/app/api/paris/
├── route.ts                       # PARIS main
├── agents/route.ts                # PARIS agents
├── commands/route.ts              # PARIS commands
├── media/route.ts                # PARIS media
└── session/route.ts              # PARIS session

apps/admin/app/api/
├── admin/courses/                 # Course CRUD
├── admin/course-builder/         # Course builder AI
├── admin/devstudio/               # DevStudio config
├── admin/lms/courses/             # LMS courses
├── admin/media-assets/           # Media management
├── admin/deploy/                  # Deployment
└── evaluation/                    # Evaluation
```

---

## PHASE 2: GAP ANALYSIS

### MISSING COMPONENTS NEEDED:

| Gap | Status | Files to Create |
|-----|--------|-----------------|
| Workspace Registry | MISSING | `apps/admin/app/studio/workspace-registry.ts` |
| Shared Service Contract | MISSING | `packages/platform-core/src/result.ts` |
| Permission System | PARTIAL | `packages/platform-core/src/permissions.ts` (extend) |
| Audit Log Table | MISSING | Migration needed |
| Health Endpoints | PARTIAL | `/api/devstudio/*/health` for each subsystem |
| Environment Validator | MISSING | `apps/app/lib/env/server-env.ts` |
| Error Handler | PARTIAL | Extend existing API error handling |
| Feature Flags | MISSING | `apps/app/lib/feature-flags.ts` |

### DUPLICATE/REDIRECT SYSTEMS:

| Duplicate | Action | Status |
|-----------|--------|--------|
| `/admin/dev-studio/` | Redirects to `/admin/studio` | FIXED ✅ |
| `/admin/dev-studio/*` | Removed, use `/admin/studio/*` | FIXED ✅ |

---

## PHASE 3: WORKSPACE MAPPING

### Current Workspaces in DevStudioUnifiedClient:

| Workspace ID | Label | Permission | Status |
|-------------|-------|------------|---------|
| studio | Studio | ai.use | WORKING ✅ |
| workflows | Workflows | deployments.manage | WORKING ✅ |
| command | Command | studio.view | WORKING ✅ |
| deploy | Deploy | deployments.manage | WORKING ✅ |
| files | Files | studio.view | WORKING ✅ |
| environments | Container | containers.manage | WORKING ✅ |
| health | Health | studio.view | WORKING ✅ |
| secrets | Secrets | studio.settings | WORKING ✅ |
| integrations | Integrations | studio.view | WORKING ✅ |
| upload | Upload | media.manage | WORKING ✅ |
| operations | Operations | studio.view | WORKING ✅ |
| errors | Errors | studio.view | WORKING ✅ |
| video | Video | studio.view | WORKING ✅ |

### MISSING WORKSPACES:

| Workspace | Route | Status |
|-----------|-------|--------|
| content-studio | /admin/paris | WORKING ✅ |
| evaluations | /admin/evaluation | WORKING ✅ |
| cfd-simulation | /admin/cfd-studio | PARTIAL ⚠️ |

---

## PHASE 4: CONNECTIVITY MATRIX

### Feature Connections:

```
AI Chat (DevStudioUnifiedClient)
├── ✅ Course Builder → AICourseBuilderChat
├── ✅ PARIS Commands → via execute API
├── ✅ Deployments → DeployPanel
├── ✅ Containers → DevContainerPanel
├── ✅ Media → MediaStudio
├── ✅ Workflows → WorkflowsPanel
├── ✅ Evaluations → /admin/evaluation (link)
├── ❌ CFD Simulation → /admin/cfd-studio (link only, not integrated)
└── ❌ Audit Log → MISSING
```

---

## PHASE 5: IMPLEMENTATION CHECKLIST

### Required Files to Create:

| # | File | Purpose | Priority |
|---|------|---------|----------|
| 1 | `apps/admin/app/studio/workspace-registry.ts` | Workspace registry | HIGH |
| 2 | `packages/platform-core/src/result.ts` | Service result contract | HIGH |
| 3 | `packages/platform-core/src/permissions.ts` | Permission system | HIGH |
| 4 | `supabase/migrations/audit_events.sql` | Audit log table | MEDIUM |
| 5 | `apps/app/lib/env/server-env.ts` | Environment validator | MEDIUM |
| 6 | `apps/app/lib/feature-flags.ts` | Feature flags | MEDIUM |
| 7 | `apps/app/api/devstudio/ai/health/route.ts` | AI health | MEDIUM |
| 8 | `apps/app/api/devstudio/courses/health/route.ts` | Courses health | MEDIUM |
| 9 | `apps/app/api/devstudio/content/health/route.ts` | Content health | MEDIUM |
| 10 | `apps/app/api/devstudio/media/health/route.ts` | Media health | MEDIUM |
| 11 | `apps/app/api/devstudio/deployments/health/route.ts` | Deployments health | MEDIUM |
| 12 | `apps/app/api/devstudio/containers/health/route.ts` | Containers health | MEDIUM |
| 13 | `apps/app/api/devstudio/evaluations/health/route.ts` | Evaluations health | MEDIUM |
| 14 | `apps/app/api/devstudio/simulations/health/route.ts` | Simulations health | MEDIUM |

### Required Files to Modify:

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `apps/admin/app/studio/DevStudioUnifiedClient.tsx` | Add workspace registry | HIGH |
| 2 | `apps/app/api/devstudio/chat/route.ts` | Add agent routing | HIGH |
| 3 | `apps/admin/app/studio/courses/ai-builder/AICourseBuilderChat.tsx` | Connect to workspace | HIGH |
| 4 | `components/studio/DeployPanel.tsx` | Add health status | MEDIUM |
| 5 | `components/studio/DevContainerPanel.tsx` | Add health status | MEDIUM |

---

## PHASE 6: DATABASE TABLES EXISTING

### Course Related:
- `courses` - Course definitions
- `modules` - Course modules
- `lessons` - Individual lessons
- `quizzes` - Quiz definitions
- `quiz_questions` - Quiz questions

### Studio Related:
- `studio_conversations` - Chat history
- `studio_tasks` - AI tasks
- `studio_workflow_tracking` - Workflow state
- `studio_settings` - Studio settings

### Media Related:
- `media_assets` - Media files
- `curriculum_uploads` - Uploaded files

### Audit Related:
- `workflow_step_logs` - Workflow logs
- `guardrail_enforcement_log` - AI guardrails
- `ai_conversation_memory` - AI memory

### MISSING TABLES NEEDED:
- `platform_audit_events` - Central audit log

---

## PHASE 7: AUTHENTICATION & AUTHORIZATION

### Current Auth:
- Supabase Auth (email, OAuth)
- Role-based: `admin`, `instructor`, `staff`, `super_admin`
- Organization-scoped via `organization_id`

### Current Permissions:
- `access_devstudio` - Dev Studio access
- `platform_owner` - Platform administration

### MISSING PERMISSIONS:
```ts
// Need to add:
'studio.view'
'ai.use'
'courses.manage'
'content.generate'
'media.manage'
'deployments.manage'
'containers.manage'
'evaluations.manage'
'simulations.manage'
'studio.settings'
```

---

## PHASE 8: EXTERNAL SERVICE CONNECTIONS

| Service | Provider | Status | Config |
|---------|----------|--------|--------|
| AI Chat | OpenAI/Anthropic | WORKING ✅ | `OPENAI_API_KEY` |
| Deployment | GitHub Actions | WORKING ✅ | `GITHUB_TOKEN` |
| Containers | Northflank | WORKING ✅ | `NORTHFLANK_API_TOKEN` |
| Media Storage | Supabase Storage | WORKING ✅ | Built-in |
| Search | Tavily | PARTIAL ⚠️ | `TAVILY_API_KEY` |
| Email | Resend | PARTIAL ⚠️ | `RESEND_API_KEY` |

---

## PHASE 9: BUILD & DEPLOYMENT

### Current Status:
- Marketing: ✅ Deployed to Northflank
- Admin: 🔄 Deploying (workflow in progress)
- LMS: ✅ Deployed to Northflank

### Required Builds:
```bash
pnpm --filter @elevate/marketing build  # ✅ Last: success
pnpm --filter @elevate/admin build      # 🔄 In progress
pnpm --filter @elevate/lms build        # ✅ Last: success
```

---

## FINAL STATUS TABLE

| Capability | UI loads | API works | Auth enforced | Data persists | Audit logged | Error states | End-to-end |
|-----------|----------|-----------|---------------|---------------|--------------|-------------|------------|
| AI Chat | ✅ | ✅ | ✅ | ✅ | ⚠️ PARTIAL | ✅ | ⚠️ PARTIAL |
| Course Creation | ✅ | ✅ | ✅ | ✅ | ⚠️ PARTIAL | ✅ | ✅ |
| Content Generation | ✅ | ✅ | ✅ | ✅ | ⚠️ PARTIAL | ✅ | ⚠️ PARTIAL |
| Media Management | ✅ | ✅ | ✅ | ✅ | ❌ NO | ⚠️ PARTIAL | ⚠️ PARTIAL |
| Deployment | ✅ | ✅ | ✅ | ⚠️ External | ❌ NO | ✅ | ⚠️ PARTIAL |
| Containers | ✅ | ✅ | ✅ | ⚠️ External | ❌ NO | ✅ | ⚠️ PARTIAL |
| Evaluation | ✅ | ✅ | ✅ | ✅ | ❌ NO | ✅ | ⚠️ PARTIAL |
| CFD Simulation | ✅ | ⚠️ PARTIAL | ⚠️ PARTIAL | ❌ NO | ❌ NO | ❌ NO | ❌ NO |

---

## NEXT ACTIONS REQUIRED

### HIGH PRIORITY:
1. Create workspace registry
2. Add audit log table and integration
3. Add health endpoints for all subsystems
4. Connect CFD to unified studio

### MEDIUM PRIORITY:
1. Create shared service result contract
2. Extend permission system
3. Add feature flags
4. Add environment validator

### LOW PRIORITY:
1. Create CFD API integration
2. Add simulation health endpoint
3. Create unified error handler
