# Pending Database Migrations

## How to Run Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files in order (earliest first)

### Option 2: Supabase CLI
```bash
supabase db push
```

### Option 3: Manual Execution
Run each migration file in the SQL Editor in order.

---

## Migration Order (Run in this order)

### Priority 1: Core Infrastructure

| File | Purpose | Status |
|------|---------|--------|
| `20260723000001_application_fee_policy.sql` | Application fee policy tables | Ready |
| `20260808000001_studio_audit_fixes.sql` | Dev Studio audit fixes | Ready |
| `20260808000002_dev_studio_schema_reconcile.sql` | Dev Studio schema | Ready |

### Priority 2: AI & Intelligence

| File | Purpose | Status |
|------|---------|--------|
| `20260810000001_ai_agents_dev_studio.sql` | AI agents for Dev Studio | Ready |
| `20260810000002_course_generation_pipeline.sql` | Course generation pipeline | Ready |
| `20260810000003_qa_auto_healing.sql` | QA auto-healing | Ready |

### Priority 3: Control Plane & Operations

| File | Purpose | Status |
|------|---------|--------|
| `20260810000004_unified_control_plane.sql` | Unified control plane | Ready |
| `20260810000005_autonomous_ops_agent.sql` | Autonomous operations agent | Ready |

### Priority 4: Commerce & Subscriptions

| File | Purpose | Status |
|------|---------|--------|
| `20260810000006_host_shop_subscriptions.sql` | Host shop subscriptions | Ready |
| `20260815000001_store_product_images_variants.sql` | Store product images | Ready |

---

## Key Tables Created

### Application Fees
- `application_fee_policies` - Fee policies per program
- `application_fee_exemptions` - Fee waivers

### Dev Studio
- `studio_audit_logs` - Audit trail
- `studio_conversations` - Conversation history

### AI Agents
- `dev_studio_agents` - Agent configurations
- `agent_executions` - Execution tracking

### Course Generation
- `course_generation_jobs` - Generation job queue
- `curriculum_blueprints` - Blueprint storage

### Control Plane
- `control_plane_tasks` - Task definitions
- `control_plane_executions` - Execution tracking

### Subscriptions
- `host_shop_subscriptions` - Subscription tracking
