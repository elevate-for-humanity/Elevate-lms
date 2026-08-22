#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = (message) => {
  console.error(`AGENTIC_ADMISSIONS_CONTRACT_FAIL: ${message}`);
  process.exitCode = 1;
};
const requireText = (file, needle, label = needle) => {
  if (!exists(file)) return fail(`missing ${file}`);
  if (!read(file).includes(needle)) fail(`${file} missing ${label}`);
};
const forbidText = (file, needle, label = needle) => {
  if (!exists(file)) return fail(`missing ${file}`);
  if (read(file).includes(needle)) fail(`${file} still contains ${label}`);
};

const runtimeFiles = [
  'apps/marketing/app/api/paris/applications/route.ts',
  'apps/marketing/app/api/paris/applications/[applicationId]/submit/route.ts',
  'apps/marketing/app/api/paris/applications/[applicationId]/decision/route.ts',
  'lib/zora/admissions/orchestration-service.ts',
];
for (const file of runtimeFiles) {
  forbidText(file, "from('paris_applications')", 'retired paris_applications query');
  forbidText(file, "from(\"paris_applications\")", 'retired paris_applications query');
  forbidText(file, '@/lib/paris/admissions/application-service', 'retired application-service import');
}

for (const retiredFile of [
  'lib/paris/admissions/application-service.ts',
  'lib/paris/admissions/enrollment-service.ts',
  'lib/paris/admissions/provisioning-service.ts',
  'apps/marketing/app/api/paris/applications/[applicationId]/enroll/route.ts',
  'apps/marketing/types/paris-provisioning.d.ts',
]) {
  if (exists(retiredFile)) fail(`retired ${retiredFile} still exists`);
}

requireText('apps/marketing/app/apply/student/page.tsx', '/apply/student/interview', 'PARIS-first canonical redirect');
requireText('apps/marketing/app/apply/student/form/page.tsx', 'StudentApplicationForm', 'standard form fallback');
requireText('apps/marketing/app/apply/student/interview/page.tsx', 'ParisApplicationWorkspace', 'PARIS interview workspace');
requireText('apps/marketing/app/apply/student/interview/page.tsx', 'ApplicationDocumentsPanel', 'document review panel');
requireText('apps/marketing/app/apply/student/interview/ParisApplicationWorkspace.tsx', 'SpeechRecognition', 'voice input support');
requireText('apps/marketing/app/apply/student/interview/ParisApplicationWorkspace.tsx', "'/api/applications'", 'canonical application submission');
requireText('apps/marketing/app/apply/student/interview/ParisApplicationWorkspace.tsx', "'X-Idempotency-Key'", 'application idempotency');
requireText('apps/marketing/app/api/paris/application-interview/route.ts', 'paris_application_resume', 'persistent resume cookie');
requireText('apps/marketing/app/api/paris/application-interview/route.ts', "inputMode: z.enum(['text', 'voice'])", 'shared voice/text state authority');
requireText('lib/paris/admissions/interview-engine.ts', "export type ApplicationInterviewLocale = 'en' | 'es'", 'English/Spanish locale authority');
requireText('lib/paris/admissions/interview-engine.ts', 'CRITICAL_FIELDS', 'critical answer confirmation');
requireText('lib/paris/admissions/interview-engine.ts', 'requiresWorkOne', 'WorkOne pathway branching');
requireText('lib/paris/admissions/interview-engine.ts', 'claimedTransferHours', 'transfer-hours handling');
requireText('lib/paris/admissions/interview-engine.ts', 'supporting evidence and sponsor review', 'transfer-hours review disclaimer');
requireText('apps/marketing/app/api/paris/applications/[applicationId]/decision/route.ts', 'approveApplication', 'canonical approval pipeline');
requireText('apps/marketing/app/api/paris/applications/[applicationId]/decision/route.ts', "canonicalAuthority: 'applications'", 'canonical application authority response');
forbidText('apps/marketing/app/api/paris/applications/[applicationId]/decision/route.ts', 'bypassPaymentGate: true', 'payment/funding gate bypass');
requireText('apps/marketing/app/api/paris/applications/route.ts', 'Origin: canonicalUrl.origin', 'same-origin canonical submission');
requireText('lib/zora/admissions/orchestration-service.ts', "from('applications')", 'ZORA canonical applications authority');
requireText('lib/zora/admissions/orchestration-service.ts', "from('follow_up_reminders')", 'ZORA canonical follow-up authority');
requireText('apps/marketing/app/api/paris/application-interview/documents/route.ts', "status: 'pending'", 'documents remain pending review');
requireText('apps/marketing/app/api/paris/application-interview/documents/route.ts', "verified: false", 'PARIS cannot self-verify uploads');
requireText('supabase/migrations/20260822183500_agentic_build_foundation.sql', 'agentic_build_projects', 'shared BuildProject authority');
requireText('supabase/migrations/20260822183500_agentic_build_foundation.sql', 'agentic_build_runs', 'shared BuildRun authority');
requireText('supabase/migrations/20260822183500_agentic_build_foundation.sql', 'agentic_build_tasks', 'shared task graph authority');
requireText('supabase/migrations/20260822183500_agentic_build_foundation.sql', 'agentic_build_messages', 'shared PARIS conversation authority');
requireText('lib/agentic/worker-registry.ts', "name: 'application-interview'", 'application worker');
requireText('lib/agentic/worker-registry.ts', "name: 'course-architect'", 'course worker');
requireText('lib/agentic/worker-registry.ts', "name: 'website-builder'", 'website worker');
requireText('lib/agentic/worker-registry.ts', "name: 'translation'", 'translation worker');
requireText('lib/agentic/orchestrator.ts', 'createBaselineAgenticPlan', 'shared planner');
requireText('lib/agentic/orchestrator.ts', 'startAgenticRun', 'shared BuildRun service');
requireText('lib/agentic/orchestrator.ts', 'createAgenticCheckpoint', 'shared checkpoint service');
requireText('supabase/migrations/20260822190000_retire_paris_application_authority.sql', 'drop table if exists public.paris_applications', 'forward retirement of duplicate authority');
requireText('supabase/migrations/20260822191500_link_agentic_application_documents.sql', 'link_agentic_application_documents', 'server-side project/application document linking');
requireText('supabase/migrations/20260822191800_preserve_document_delete_audit.sql', 'drop constraint if exists document_audit_log_document_id_fkey', 'document deletion audit persistence');
requireText('supabase/migrations/20260822193000_documents_application_owner_types.sql', "'agentic_application'::text", 'pre-submission application document owner type');
requireText('supabase/migrations/20260822194500_agentic_run_credit_accounting.sql', 'increment_agentic_run_credits', 'atomic agentic run credit accounting');
requireText('supabase/migrations/20260822195000_harden_agentic_application_document_link.sql', 'Agentic application link identity mismatch', 'identity-bound agentic document handoff');
requireText('supabase/migrations/20260822195000_harden_agentic_application_document_link.sql', 'Agentic application link program mismatch', 'program-bound agentic document handoff');

if (!process.exitCode) {
  console.log('AGENTIC_ADMISSIONS_CONTRACT_PASS');
}
