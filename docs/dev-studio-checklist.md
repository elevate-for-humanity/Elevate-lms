# Dev Studio Checklist - Implementation Status

> Correction 2026-11-23: several lines below were wrong and are corrected
> in place. `lib/dev-studio/skills-loader.ts` and `lib/dev-studio/agent.ts`
> do not exist at HEAD. O*NET / CareerOneStop / BLS ARE connected — in the
> Ultimate Course Builder (lib/ultimate-course-builder/, feed clients in
> lib/industry/ and lib/onet/; single-builder PR #2823). Snapshot/rollback
> routes exist (`snapshots/[id]/rollback`). `/api/devstudio/*` routes do
> not exist at HEAD. Unverified lines are marked as such; do not treat
> this checklist as a status source without re-checking the code.

## ✅ EXISTING (Already Implemented)

### 1. Repository Scan
- FileTree.tsx - File browsing
- DevStudioFilesWorkspace.tsx - Workspace files
- DevStudioEditorWorkspace.tsx - Code editor

### 2. Dev Studio Control Center
- ✅ Platform map - CommandCenterPanel.tsx (platform services display)
- ✅ Health monitor - DevStudioHealthPanel.tsx
- ✅ Logs panel - apps/admin/app/admin/dev-studio/logs/
- ✅ Deployment controls - DeployPanel.tsx + GitPanel.tsx
- ✅ Northflank deployment status - NorthflankStatusPanel.tsx
- ⚠️ Rollback controls - routes exist (`snapshots/[id]/rollback`, tasks rollback) but live UI wiring is UNVERIFIED — corrected 2026-11-23; was wrongly listed as NOT IMPLEMENTED
- ❌ Cloudflare cache controls - NOT IMPLEMENTED
- ❌ Supabase status - NOT IMPLEMENTED (partial in health panel)
- ❌ Stripe status - NOT IMPLEMENTED
- ❌ GitHub PR status - NOT IMPLEMENTED

### 3. AI Assistants
- ✅ AI Chat - AIChat.tsx, UnifiedEllieChat.tsx
- ❌ Skills loader - lib/dev-studio/skills-loader.ts — FILE DOES NOT EXIST at HEAD (stale line, corrected 2026-11-23)
- ❌ Agent system - lib/dev-studio/agent.ts — FILE DOES NOT EXIST at HEAD; agent code lives in lib/devstudio/openhands/ (stale line, corrected 2026-11-23)
- ❌ Named assistants with avatars - NOT IMPLEMENTED
- ❌ Assistant permissions - PARTIAL
- ❌ Assistant audit logs - PARTIAL

### 4. Voice Control
- ✅ TTS available - AutoPlayTTS.tsx (homepage voiceover)
- ❌ Microphone button in Dev Studio - NOT IMPLEMENTED
- ❌ Speech-to-text - NOT IMPLEMENTED
- ❌ AI text response via voice - NOT IMPLEMENTED
- ❌ Voice confirmation before actions - NOT IMPLEMENTED

### 5. Live Preview
- ✅ LivePreviewStudio.tsx - Preview panel exists
- ✅ IframePreview.tsx - Iframe preview
- ❌ Auto-refresh after changes - NOT IMPLEMENTED

### 6. Course Generator
- ✅ AI Course Builder Chat - AICourseBuilderChat.tsx
- ✅ Supabase Edge Function - supabase/functions/ai-course-create
- ✅ O*NET connection - IMPLEMENTED in the Ultimate Course Builder (lib/onet/, lib/industry/standards-loader.ts) — corrected 2026-11-23; was wrongly listed as NOT IMPLEMENTED
- ✅ CareerOneStop connection - IMPLEMENTED in the Ultimate Course Builder (lib/industry/careeronestop.ts) — corrected 2026-11-23
- ✅ BLS connection - IMPLEMENTED in the Ultimate Course Builder (lib/industry/bls.ts) — corrected 2026-11-23
- ❌ Media to Cloudflare R2 - NOT IMPLEMENTED

### 7. Course Gap Detection
- ❌ Program gap detection - NOT IMPLEMENTED
- ❌ Draft generation jobs - NOT IMPLEMENTED

### 8. LMS Automation
- ✅ Auto-create student dashboard - PARTIAL
- ✅ Auto-assign role/tenant/course - PARTIAL
- ❌ Auto-send document checklist - NOT IMPLEMENTED

### 9. Website Scanner
- ❌ Duplicate detection - NOT IMPLEMENTED
- ❌ Missing hero banners - NOT IMPLEMENTED
- ❌ Broken links - NOT IMPLEMENTED
- ❌ CSS issues - NOT IMPLEMENTED

### 10. Runtime QA
- ✅ TypeScript errors - TypeScript compiler
- ✅ Lint errors - ESLint
- ❌ Console errors detection - NOT IMPLEMENTED
- ❌ API failures detection - PARTIAL
- ❌ Auto-fix low-risk issues - NOT IMPLEMENTED

### 11. Application/Onboarding Scanner
- ❌ Incomplete applications - NOT IMPLEMENTED
- ❌ Missing documents - NOT IMPLEMENTED
- ❌ Stuck onboarding detection - NOT IMPLEMENTED

### 12. Payments / Stripe
- ✅ Store products - components/payments/
- ✅ Stripe checkout - app/api/store/create-payment-intent
- ✅ Jordan/Natalia billing - lib/barber/apprentice-stripe-billing.ts
- ❌ Enterprise plans display - NOT IMPLEMENTED
- ❌ Failed payment detection - PARTIAL

### 13. Grants
- ✅ Grant code exists - lib/grants/
- ❌ Grants.gov scan - NOT IMPLEMENTED
- ❌ SAM.gov scan - NOT IMPLEMENTED

### 14. Minority Certifications
- ❌ MBE/WBE/DBE support - NOT IMPLEMENTED

### 15. PWA Dashboard
- ✅ Manifest/icons - public/manifest.json
- ✅ Service worker - NEXT PWA plugin
- ❌ PWA status checker in Dev Studio - NOT IMPLEMENTED

### 16. Payroll
- ❌ Payroll detection - NOT IMPLEMENTED

### 17. Security
- ✅ Platform owner guard - lib/admin/guards.ts
- ✅ RBAC - PARTIAL
- ✅ Audit logging - PARTIAL

### 18. Deployment Safety
- ✅ Lint/typecheck/build in CI
- ❌ /api/devstudio/control-plane build issue - STALE: no /api/devstudio/* route exists at HEAD; the issue as written cannot be checked — corrected 2026-11-23

### 19. Backup/Recovery
- ✅ GitHub backup
- ❌ Supabase backup automation - NOT IMPLEMENTED

### 20. Jordan Payment
- Jordan White has account: cus_UGFxoJKjtlNoy8
- Weekly rate: $76.41, Start date: 2026-04-17
- Down payment: $2000, Payment term: 29 weeks

## Priority Implementation Order

### HIGH PRIORITY (Blocking features)
1. Voice Control for Dev Studio
2. Course Gap Detection
3. Application/Onboarding Scanner
4. Runtime QA console error detection
5. Jordan Payment fix

### MEDIUM PRIORITY (Important features)
6. Rollback controls
7. Cloudflare cache controls
8. Supabase status panel
9. Stripe status panel
10. GitHub PR status
11. Website scanner
12. PWA status checker

### LOW PRIORITY (Nice to have)
13. O*NET/CareerOneStop/BLS connection
14. Minority certifications
15. Payroll detection
16. Backup automation