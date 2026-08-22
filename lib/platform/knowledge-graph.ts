/**
 * Canonical platform knowledge graph used by Admin AI.
 *
 * This file describes CURRENT ownership and write authority, not historical
 * table names. Compatibility/projection stores are documented as debt instead
 * of being presented to the AI as equal sources of truth.
 */

export interface RouteNode {
  path: string;
  system: string;
  description: string;
  dbTables?: string[];
  apiRoutes?: string[];
  components?: string[];
  auth?: 'public' | 'student' | 'admin' | 'instructor' | 'employer' | 'staff';
  status?: 'active' | 'stub' | 'deprecated';
}

export interface ApiNode {
  path: string;
  method: string;
  system: string;
  description: string;
  dbTables?: string[];
  auth?: 'public' | 'student' | 'admin' | 'any';
}

export interface SystemNode {
  id: string;
  name: string;
  description: string;
  routes: string[];
  apis: string[];
  tables: string[];
  status: 'active' | 'partial' | 'stub';
}

export const SYSTEMS: SystemNode[] = [
  {
    id: 'admin-core',
    name: 'Admin Operations',
    description: 'Privileged operational dashboard and manual record views. Admin AI is the primary control surface; these routes are governed manual views.',
    routes: ['/dashboard','/applications','/students','/programs','/operations','/reports','/system-health'],
    apis: ['/api/admin/*'],
    tables: ['applications','program_enrollments','profiles','programs','audit_logs','admin_activity_log'],
    status: 'active',
  },
  {
    id: 'admin-ai',
    name: 'Admin AI / Studio',
    description: 'Conversation-first administrative control plane. Natural-language requests select internal capabilities; advanced Studio routes are manual inspection/editing surfaces.',
    routes: ['/studio','/studio/courses','/studio/repository','/studio/workflows','/studio/browser','/studio/deployments','/studio/health','/studio/settings'],
    apis: ['/api/devstudio/chat','/api/admin/ai-assistant','/api/admin/ai-assistant/approve','/api/devstudio/jobs','/api/devstudio/upload','/api/admin/dev-studio/*'],
    tables: ['devstudio_chat_log','studio_conversations','devstudio_jobs','devstudio_documents','ai_conversation_memory','ellie_pending_actions','audit_logs'],
    status: 'active',
  },
  {
    id: 'course-authoring',
    name: 'Studio Course Builder / Course Factory',
    description: 'Studio controls one Course Builder application boundary. Course Builder owns generation, editing, validation, governance, repair, media and publication; the private Course Factory performs complete-package execution and persistence.',
    routes: ['/studio/courses', '/studio/courses/[courseId]'],
    apis: ['/api/admin/course-builder'],
    tables: ['courses', 'course_modules', 'course_lessons', 'assessment_questions'],
    status: 'active',
  },
  {
    id: 'learner-lms',
    name: 'Learner LMS',
    description: 'Learner delivery, progress, assessments, remediation, credentials, and course access. LMS consumes published canonical courses and does not own complete-course authoring.',
    routes: ['/lms/dashboard','/lms/courses','/lms/courses/[courseId]','/lms/courses/[courseId]/lessons/[lessonId]','/lms/certificates'],
    apis: ['/api/learner/*','/api/courses/[courseId]/*','/api/lms/*'],
    tables: ['program_enrollments','course_enrollments','course_lessons','lesson_progress','assessment_questions','program_completion_certificates'],
    status: 'active',
  },
  {
    id: 'admissions',
    name: 'Admissions & Enrollment',
    description: 'Application intake and conversion to the operational enrollment record.',
    routes: ['/apply', '/apply/status', '/applications'],
    apis: ['/api/apply', '/api/admin/applications/*'],
    tables: ['applications', 'program_enrollments'],
    status: 'active',
  },
  {
    id: 'workflow-engine',
    name: 'Workflow & Automation Engine',
    description: 'Versioned workflows, runs, triggers, and platform event orchestration.',
    routes: ['/studio/workflows', '/operations'],
    apis: ['/api/admin/workflows/*', '/api/admin/automations/run'],
    tables: ['workflows', 'workflow_runs', 'workflow_triggers', 'platform_events'],
    status: 'active',
  },
  {
    id: 'testing-center',
    name: 'Testing Center',
    description: 'Exam scheduling, administration, funding, and completion records.',
    routes: ['/testing-center'],
    apis: ['/api/admin/testing/*'],
    tables: ['exam_bookings', 'exam_funding_authorizations'],
    status: 'active',
  },
  {
    id: 'payments',
    name: 'Payments & Billing',
    description: 'Payment lifecycle, checkout, subscriptions, revenue and funding state.',
    routes: ['/billing'],
    apis: ['/api/stripe/*', '/api/payments/*'],
    tables: ['program_enrollments','payments','stripe_sessions_staging','barber_subscriptions','cosmetology_subscriptions','barber_payments'],
    status: 'active',
  },
  {
    id: 'employer-portal',
    name: 'Employer / Host Shop Operations',
    description: 'Apprentice placement, hours, employer records, and host-shop oversight.',
    routes: ['/employer/dashboard', '/employer/apprentices', '/employer/hours'],
    apis: ['/api/employer/*'],
    tables: ['employer_profiles', 'program_enrollments', 'apprenticeship_placements', 'hour_entries'],
    status: 'active',
  },
  {
    id: 'program-holder',
    name: 'Program Holder Operations',
    description: 'Program-holder onboarding, approval, documents, and partner operations.',
    routes: ['/program-holder/dashboard', '/program-holder/apprentices', '/program-holder/documents'],
    apis: ['/api/program-holder/*'],
    tables: ['program_holder_profiles', 'program_holder_documents', 'program_enrollments'],
    status: 'active',
  },
];

export const ROUTE_SYSTEM_MAP: Record<string, string> = {};
for (const system of SYSTEMS) for (const route of system.routes) ROUTE_SYSTEM_MAP[route] = system.id;

export const TABLE_SYSTEM_MAP: Record<string, string[]> = {};
for (const system of SYSTEMS) {
  for (const table of system.tables) {
    if (!TABLE_SYSTEM_MAP[table]) TABLE_SYSTEM_MAP[table] = [];
    TABLE_SYSTEM_MAP[table].push(system.id);
  }
}

export const ROUTE_DEPENDENCIES: Record<string,{ tables: string[]; apis: string[]; components: string[] }> = {
  '/dashboard': {
    tables: ['applications', 'program_enrollments', 'profiles', 'programs'],
    apis: ['/api/admin/*', '/api/devstudio/chat', '/api/admin/ai-assistant'],
    components: ['AdminDashboardContent', 'StatsOverviewBar', 'SystemHealthPanel'],
  },
  '/studio': {
    tables: ['devstudio_chat_log', 'studio_conversations', 'ellie_pending_actions'],
    apis: ['/api/devstudio/chat', '/api/admin/ai-assistant', '/api/admin/ai-assistant/approve'],
    components: ['UnifiedEllieChat', 'StudioWorkspaceGrid'],
  },
  '/studio/courses': {
    tables: ['courses', 'course_modules', 'course_lessons', 'assessment_questions'],
    apis: ['/api/admin/course-builder'],
    components: ['UnifiedCourseBuilder'],
  },
  '/studio/courses/[courseId]': {
    tables: ['courses', 'course_modules', 'course_lessons', 'assessment_questions'],
    apis: ['/api/admin/course-builder'],
    components: ['CourseProvider', 'CourseStudioApplication', 'StudioWorkspace'],
  },
  '/applications': {
    tables: ['applications'],
    apis: ['/api/admin/applications/*'],
    components: ['RecentApplicationsList'],
  },
  '/students': {
    tables: ['profiles', 'program_enrollments'],
    apis: ['/api/admin/*'],
    components: [],
  },
  '/operations': {
    tables: ['workflows', 'workflow_runs', 'platform_events', 'admin_activity_log'],
    apis: ['/api/admin/workflows/*', '/api/admin/automations/run'],
    components: ['SystemHealthPanel'],
  },
  '/lms/courses/[courseId]/lessons/[lessonId]': {
    tables: ['course_lessons', 'lesson_progress', 'assessment_questions', 'program_enrollments'],
    apis: ['/api/learner/*', '/api/courses/[courseId]/*'],
    components: ['CourseTutor'],
  },
};

export const PLATFORM_DEBT = [
  {
    id: 'legacy-enrollments-table',
    severity: 'high',
    description: 'enrollments and program_enrollments are both populated with the same 19 record IDs. program_enrollments is the canonical operational table; remaining enrollments readers must be migrated before the mirror can be retired.',
    affectedRoutes: ['/students', '/lms/dashboard'],
    resolution: 'Move remaining runtime readers/writers to program_enrollments, prove parity, then retire enrollments or replace it with an explicitly read-only compatibility projection.',
  },
  {
    id: 'legacy-course-projections',
    severity: 'high',
    description: 'lms_courses, training_courses, modules, curriculum_lessons, lms_lessons, and training_lessons remain populated historical/projection stores. Course Builder is the application authority and Course Factory is the private complete-package persistence engine for courses/course_modules/course_lessons.',
    affectedRoutes: ['/studio/courses', '/lms/courses'],
    resolution: 'Inventory remaining consumers, classify required read projections, eliminate parallel writers, and retire or formally version compatibility projections.',
  },
  {
    id: 'deployment-table-convergence',
    severity: 'medium',
    description: 'ai_deployments and copilot_deployments both exist and require ownership mapping before any consolidation. workspace_deployments belongs to customer workspaces and is not part of Studio cleanup.',
    affectedRoutes: ['/studio/deployments'],
    resolution: 'Map active deployment writers/readers and assign one Admin AI deployment authority without touching customer workspace deployments.',
  },
  {
    id: 'build-evidence-required',
    severity: 'high',
    description: 'Repository architecture gates exist, but a current green Admin build, Studio typecheck/integration gate, and deployed authenticated smoke evidence are still required before procurement certification.',
    affectedRoutes: ['/dashboard', '/studio'],
    resolution: 'Run the repository gates in CI, deploy main, and capture authenticated production health/smoke evidence.',
  },
];

export const CANONICAL_DECISIONS = [
  {
    id: 'admin-ai-front-door',
    decision: 'Admin /studio is the conversation-first control plane. Course Builder, workflows, repository, browser, deployment and other Studio pages are capabilities behind the AI plus advanced manual surfaces.',
    rationale: 'Administrators describe outcomes instead of selecting separate mini-products.',
  },
  {
    id: 'admin-route-root',
    decision: 'Admin-host routes are root-level (/dashboard, /applications, /students, /programs, /operations, /studio), not /admin/* page paths.',
    rationale: 'Matches the deployed Admin application shell and prevents stale navigation metadata.',
  },
  {
    id: 'application-source-of-truth',
    decision: 'applications is the canonical application/intake table. Admin AI and dashboard counts must use the same pending-status set.',
    rationale: 'Prevents conflicting application counts and removes the retired intake_submissions contract.',
  },
  {
    id: 'enrollment-source-of-truth',
    decision: 'program_enrollments is the canonical operational enrollment table.',
    rationale: 'It contains the complete funding, access, apprenticeship, payout, progress, and compliance state and drives current Admin/LMS operations.',
  },
  {
    id: 'course-write-authority',
    decision: 'Studio controls the Course Builder. /api/admin/course-builder is the single application mutation/orchestration boundary; Course Factory is the private complete-package execution/persistence engine.',
    rationale: 'Eliminates partial course writes, competing HTTP builders, and parallel publication authorities while preserving specialized internal capability services.',
  },
  {
    id: 'studio-data-boundary',
    decision: 'Canonical Admin AI data is devstudio_chat_log, studio_conversations, devstudio_jobs, devstudio_documents, ai_conversation_memory, and ellie_pending_actions. Privileged Studio data requires Admin authorization and AAL2/MFA.',
    rationale: 'Matches the Admin-only trust boundary and the hardened live RLS policies.',
  },
  {
    id: 'studio-api-boundaries',
    decision: '/api/devstudio/* owns operational runtime APIs; /api/admin/dev-studio/* owns Admin capability health/configuration APIs. Duplicate relative implementations are forbidden.',
    rationale: 'Keeps runtime operations separate from privileged capability configuration without duplicate behavior.',
  },
  {
    id: 'high-impact-approval',
    decision: 'High-impact administrative actions are staged in ellie_pending_actions and executed only after explicit human approval, with audit logging.',
    rationale: 'Government operations require traceable human authorization for consequential changes.',
  },
  {
    id: 'pwa-admin-shell',
    decision: 'Studio inherits the Admin application shell and Admin PWA. It is not a standalone PWA or parallel application shell.',
    rationale: 'One authenticated navigation/session/update lifecycle reduces drift and operator confusion.',
  },
  {
    id: 'api-auth',
    decision: 'Privileged Admin/Studio APIs use canonical Admin/Dev Studio guards, rate limiting, safe errors, and database RLS as defense in depth.',
    rationale: 'UI routing alone is not an authorization boundary.',
  },
];

export function getKnowledgeGraphContext(): string {
  const lines: string[] = [
    '=== ELEVATE PLATFORM CANONICAL KNOWLEDGE GRAPH ===','',
    '## SYSTEMS',
    ...SYSTEMS.map((system) => `[${system.status.toUpperCase()}] ${system.name} (${system.id})\n  ${system.description}\n  Routes: ${system.routes.slice(0, 4).join(', ')}${system.routes.length > 4 ? ` +${system.routes.length - 4} more` : ''}\n  Tables: ${system.tables.slice(0, 5).join(', ')}${system.tables.length > 5 ? ` +${system.tables.length - 5} more` : ''}`),
    '', '## OPEN CONSOLIDATION DEBT',
    ...PLATFORM_DEBT.map((debt) => `[${debt.severity.toUpperCase()}] ${debt.id}: ${debt.description}`),
    '', '## CANONICAL DECISIONS',
    ...CANONICAL_DECISIONS.map((decision) => `• ${decision.id}: ${decision.decision}`),
  ];
  return lines.join('\n');
}

export function lookupRoute(routePath: string): SystemNode | undefined {
  const systemId = ROUTE_SYSTEM_MAP[routePath];
  return systemId ? SYSTEMS.find((system) => system.id === systemId) : undefined;
}

export function lookupTable(table: string): SystemNode[] {
  const systemIds = TABLE_SYSTEM_MAP[table] ?? [];
  return SYSTEMS.filter((system) => systemIds.includes(system.id));
}
