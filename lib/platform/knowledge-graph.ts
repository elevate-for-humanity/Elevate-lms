/**
 * Platform Knowledge Graph
 *
 * Structured registry of routes, APIs, DB tables, components, and their
 * relationships. Used by the AI console to reason about the platform
 * architecturally rather than answering from isolated context.
 *
 * Update this file when adding new systems, routes, or DB tables.
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

// ── Systems ─────────────────────────────────────────────────────────────────

export const SYSTEMS: SystemNode[] = [
  {
    id: 'lms',
    name: 'LMS (Learning Management System)',
    description: 'Course delivery, lesson progress, checkpoints, certificates',
    routes: [
      '/lms/courses',
      '/lms/courses/[courseId]',
      '/lms/courses/[courseId]/lessons/[lessonId]',
      '/lms/courses/[courseId]/certification',
      '/lms/dashboard',
      '/lms/programs',
      '/lms/certificates',
    ],
    apis: [
      '/api/lms/progress',
      '/api/lms/complete',
      '/api/lms/checkpoint',
      '/api/admin/courses',
      '/api/admin/enrollments',
    ],
    tables: [
      'curriculum_lessons',
      'training_lessons',
      'lms_lessons',
      'modules',
      'lesson_progress',
      'checkpoint_scores',
      'step_submissions',
      'program_completion_certificates',
      'courses',
      'course_modules',
      'course_lessons',
    ],
    status: 'active',
  },
  {
    id: 'programs',
    name: 'Program Catalog',
    description: 'Public program pages, apply flows, enrollment routing',
    routes: [
      '/programs',
      '/programs/[program]',
      '/programs/[program]/apply',
      '/programs/healthcare',
      '/programs/skilled-trades',
      '/programs/apprenticeships',
    ],
    apis: [
      '/api/admin/programs',
      '/api/programs/[slug]',
    ],
    tables: ['programs', 'courses', 'training_courses'],
    status: 'active',
  },
  {
    id: 'enrollment',
    name: 'Enrollment & Application Flow',
    description: 'Student intake, application submission, enrollment confirmation',
    routes: [
      '/apply',
      '/apply/intake',
      '/apply/student',
      '/apply/start',
      '/apply/success',
      '/apply/status',
      '/enrollment',
      '/enrollment/confirmed',
      '/checkout/[program]',
      '/checkout/success',
    ],
    apis: [
      '/api/apply',
      '/api/enrollment/create',
      '/api/admin/applications',
      '/api/admin/applications/[id]/approve',
      '/api/stripe/create-checkout',
    ],
    tables: [
      'applications',
      'enrollments',
      'intake_submissions',
      'waitlist_entries',
    ],
    status: 'active',
  },
  {
    id: 'payments',
    name: 'Payments & Billing',
    description: 'Stripe checkout, BNPL, payment plans, invoices, payroll',
    routes: [
      '/checkout/[program]',
      '/lms/payments',
      '/lms/payments/checkout',
      '/account/billing',
    ],
    apis: [
      '/api/stripe/create-checkout',
      '/api/stripe/checkout',
      '/api/stripe/invoice/create',
      '/api/stripe/webhook',
      '/api/payments/plan',
      '/api/payments/bnpl',
    ],
    tables: [
      'payments',
      'payment_plans',
      'stripe_customers',
      'invoices',
      'ita_vouchers',
    ],
    status: 'active',
  },
  {
    id: 'admin',
    name: 'Admin Dashboard',
    description: 'Platform administration — users, programs, enrollments, reports',
    routes: [
      '/admin/dashboard',
      '/admin/applications',
      '/admin/enrollments',
      '/admin/users',
      '/admin/programs',
      '/admin/courses',
      '/admin/studio',
      '/admin/payroll',
      '/admin/reports',
      '/admin/analytics',
      '/admin/dashboard',
      '/admin/monitoring',
      '/admin/audit-logs',
    ],
    apis: [
      '/api/admin/*',
      '/api/devstudio/*',
    ],
    tables: [
      'profiles',
      'audit_logs',
      'admin_audit_log',
      'ai_audit_log',
    ],
    status: 'active',
  },
  {
    id: 'staff-portal',
    name: 'Staff Portal',
    description: 'Case management, applications review, enrollment management',
    routes: [
      '/admin/staff-portal',
      '/admin/staff-portal/applications',
      '/admin/staff-portal/applications/[id]',
      '/admin/staff-portal/enrollments',
      '/admin/staff-portal/students',
      '/admin/staff-portal/reports',
    ],
    apis: [
      '/api/staff/*',
    ],
    tables: ['applications', 'enrollments', 'profiles'],
    status: 'active',
  },
  {
    id: 'employer-portal',
    name: 'Employer Portal',
    description: 'Apprentice tracking, hours logging, job postings, compliance',
    routes: [
      '/employer/dashboard',
      '/employer/apprentices',
      '/employer/hours',
      '/employer/jobs',
      '/employer/compliance',
      '/employer/documents',
    ],
    apis: [
      '/api/employer/apprentices',
      '/api/employer/apprentices/[id]/hours',
      '/api/employer/jobs',
    ],
    tables: [
      'employer_profiles',
      'apprenticeship_placements',
      'hour_entries',
      'job_postings',
    ],
    status: 'active',
  },
  {
    id: 'instructor-portal',
    name: 'Instructor Portal',
    description: 'Course management, student progress, sign-offs',
    routes: [
      '/instructor/dashboard',
      '/instructor/[[...slug]]',
    ],
    apis: [
      '/api/instructor/*',
    ],
    tables: [
      'instructor_assignments',
      'step_submissions',
      'lesson_progress',
    ],
    status: 'active',
  },
  {
    id: 'workforce-board',
    name: 'Workforce Board Portal',
    description: 'WIOA case management, funding authorization, reporting',
    routes: [
      '/workforce-board',
      '/workforce-board/cases',
      '/workforce-board/reports',
    ],
    apis: [],
    tables: [
      'wioa_cases',
      'funding_authorizations',
      'exam_funding_authorizations',
    ],
    status: 'partial',
  },
  {
    id: 'mentor-portal',
    name: 'Mentor Portal',
    description: 'Mentorship matching, session tracking',
    routes: [
      '/mentor',
      '/mentor/dashboard',
      '/mentor/students',
    ],
    apis: [],
    tables: ['mentor_assignments', 'mentor_sessions'],
    status: 'stub',
  },
  {
    id: 'program-holder',
    name: 'Program Holder / Partner Portal',
    description: 'Partner salon/barbershop management, apprentice oversight, MOU signing',
    routes: [
      '/program-holder/dashboard',
      '/program-holder/apprentices',
      '/program-holder/documents',
      '/program-holder/compliance',
    ],
    apis: [
      '/api/program-holder/*',
    ],
    tables: [
      'program_holder_profiles',
      'partner_shops',
      'mou_documents',
    ],
    status: 'active',
  },
  {
    id: 'ellie',
    name: 'Ellie — AI Ops',
    description: 'Platform AI operator — tool-calling, SSE execution, Q&A, platform state',
    routes: ['/admin/dashboard', '/admin/dashboard'],
    apis: [
      '/api/devstudio/execute',
      '/api/devstudio/chat',
      '/api/devstudio/platform-state',
      '/api/devstudio/knowledge-graph',
    ],
    tables: ['ai_audit_log', 'ai_assistant_conversations', 'ai_chat_history'],
    status: 'active',
  },
  {
    id: 'grants',
    name: 'Grants & Funding Engine',
    description: 'WIOA, ITA vouchers, grant eligibility, package builder',
    routes: ['/funding', '/funding/grant-programs', '/funding/federal-programs'],
    apis: [
      '/api/grants/eligibility',
      '/api/grants/match',
      '/api/grants/package',
      '/api/grants/submit',
    ],
    tables: [
      'grant_applications',
      'ita_vouchers',
      'wioa_cases',
      'funding_authorizations',
    ],
    status: 'active',
  },
  {
    id: 'certificates',
    name: 'Certificate & Credential Engine',
    description: 'Completion certificates, public verification, exam funding',
    routes: [
      '/lms/certificates',
      '/lms/courses/[courseId]/certification',
      '/verify/[certificateId]',
    ],
    apis: [
      '/api/admin/certificates/bulk',
      '/api/certificates/verify',
    ],
    tables: [
      'program_completion_certificates',
      'exam_funding_authorizations',
      'checkpoint_scores',
    ],
    status: 'active',
  },
];

// ── Route → System map ───────────────────────────────────────────────────────

export const ROUTE_SYSTEM_MAP: Record<string, string> = {};
for (const system of SYSTEMS) {
  for (const route of system.routes) {
    ROUTE_SYSTEM_MAP[route] = system.id;
  }
}

// ── DB Table → System map ────────────────────────────────────────────────────

export const TABLE_SYSTEM_MAP: Record<string, string[]> = {};
for (const system of SYSTEMS) {
  for (const table of system.tables) {
    if (!TABLE_SYSTEM_MAP[table]) TABLE_SYSTEM_MAP[table] = [];
    TABLE_SYSTEM_MAP[table].push(system.id);
  }
}

// ── Dependency graph ─────────────────────────────────────────────────────────
// Maps a route to what it depends on (tables + APIs)

export const ROUTE_DEPENDENCIES: Record<string, { tables: string[]; apis: string[]; components: string[] }> = {
  '/programs/[program]': {
    tables: ['programs', 'courses'],
    apis: ['/api/admin/programs'],
    components: ['ProgramDetailPageComponent', 'HeroBanner', 'ApplyButton'],
  },
  '/lms/courses/[courseId]/lessons/[lessonId]': {
    tables: ['curriculum_lessons', 'lms_lessons', 'lesson_progress', 'checkpoint_scores'],
    apis: ['/api/lms/progress', '/api/lms/complete'],
    components: ['QuizPlayer', 'HvacLessonVideo', 'SpacedRepetitionReview', 'StepSubmissionForm'],
  },
  '/checkout/[program]': {
    tables: ['programs', 'enrollments', 'stripe_customers'],
    apis: ['/api/stripe/create-checkout', '/api/payments/plan'],
    components: ['BNPLOptions', 'PaymentPlanCalculator'],
  },
  '/apply/intake': {
    tables: ['applications', 'intake_submissions'],
    apis: ['/api/apply'],
    components: ['IntakeForm'],
  },
  '/admin/dashboard': {
    tables: ['ai_audit_log'],
    apis: ['/api/devstudio/execute', '/api/devstudio/chat', '/api/devstudio/platform-state'],
    components: ['AIChat', 'XTerminal', 'DevStudioClient'],
  },
};

// ── Known platform debt ──────────────────────────────────────────────────────

export const PLATFORM_DEBT = [
  {
    id: 'programs-vs-courses-terminology',
    severity: 'medium',
    description: 'Public LMS uses "Programs" (/lms/programs) while authenticated app uses "Courses" (/lms/courses). Canonical term is "Program".',
    affectedRoutes: ['/lms/courses', '/lms/programs'],
    resolution: 'Add redirects, update 20+ inbound hrefs, update nav labels',
  },
  {
    id: 'workforce-board-no-api',
    severity: 'high',
    description: 'Workforce board portal has 5 pages but 0 API routes. Pages are stubs.',
    affectedRoutes: ['/workforce-board', '/workforce-board/cases', '/workforce-board/reports'],
    resolution: 'Build /api/workforce-board/* routes',
  },
  {
    id: 'mentor-portal-no-api',
    severity: 'medium',
    description: 'Mentor portal has 3 pages but 0 API routes.',
    affectedRoutes: ['/mentor', '/mentor/dashboard', '/mentor/students'],
    resolution: 'Build /api/mentor/* routes',
  },
  {
    id: 'lab-assignment-signoff-ui',
    severity: 'medium',
    description: 'step_submissions table exists but instructor sign-off UI is not built.',
    affectedRoutes: ['/lms/courses/[courseId]/lessons/[lessonId]'],
    resolution: 'Build instructor sign-off UI in lesson page',
  },
  {
    id: 'auth-gaps',
    severity: 'high',
    description: '62 routes with no auth check, 13 admin routes with identity-only auth (no role check)',
    affectedRoutes: [],
    resolution: 'Run scripts/audit-auth-gaps.sh and fix each route',
  },
  {
    id: 'console-log-pollution',
    severity: 'low',
    description: '~1,521 console.log occurrences across 118 files. Use lib/logger.ts instead.',
    affectedRoutes: [],
    resolution: 'Replace console.log with logger.info/warn/error',
  },
];

// ── Canonical architecture decisions ────────────────────────────────────────

export const CANONICAL_DECISIONS = [
  {
    id: 'program-routes',
    decision: 'All programs use /programs/[program] via the dynamic route. Dedicated pages only when unique client components are needed.',
    rationale: 'Prevents route sprawl. DB-driven via programs table.',
  },
  {
    id: 'supabase-imports',
    decision: 'Import Supabase clients from @/lib/supabase/* only. All 10 deprecated root-level shims deleted.',
    rationale: 'Single canonical import path prevents version drift.',
  },
  {
    id: 'rate-limiting',
    decision: 'Use applyRateLimit() from @/lib/api/withRateLimit. lib/rateLimit.ts (in-memory) is deprecated.',
    rationale: 'Upstash Redis works in serverless; in-memory does not.',
  },
  {
    id: 'api-auth',
    decision: 'Use apiAuthGuard / apiRequireAdmin / apiRequireInstructor from @/lib/admin/guards.',
    rationale: 'Canonical auth pattern. Legacy patterns (withAuth, getCurrentUser) are correct but non-canonical.',
  },
  {
    id: 'middleware',
    decision: 'All middleware logic goes in proxy.ts. Do NOT create middleware.ts.',
    rationale: 'middleware.ts conflicts with proxy.ts and breaks the build.',
  },
  {
    id: 'error-responses',
    decision: 'All API errors use safeError/safeInternalError/safeDbError from @/lib/api/safe-error.',
    rationale: 'Prevents error.message leakage in production responses.',
  },
  {
    id: 'lms-step-types',
    decision: 'Course engine routes by step_type column on curriculum_lessons. No per-program hardcoded logic.',
    rationale: 'DB-driven rendering is program-agnostic and scalable.',
  },
  {
    id: 'resilience-wrapper',
    decision: 'All external service calls (OpenAI, Groq, Gemini, Stripe, SendGrid) use withResilience() from @/lib/resilience/with-resilience. Convenience wrappers: resilientOpenAI, resilientStripe, resilientSendGrid, etc.',
    rationale: 'Circuit breaker + retry in one call. Shared breaker singletons prevent cascade failures.',
  },
  {
    id: 'ai-orchestration',
    decision: 'All AI task execution routes through executeAiTask() from @/lib/ai/execute-ai-task (alias for runAITask from orchestrator). No direct provider instantiation in route handlers.',
    rationale: 'Single governance point for provider selection, fallback, and logging.',
  },
  {
    id: 'event-bus',
    decision: 'All significant platform events (enrollments, payments, cron failures, deploys) emit via emitEvent() from @/lib/events/emit. Events stored in platform_events table and broadcast via Supabase Realtime.',
    rationale: 'Institutional memory. Powers Mission Control realtime feed and audit trail.',
  },
  {
    id: 'canonical-admin-routes',
    decision: 'All admin nav items, redirects, and action hrefs reference ADMIN constants from @/lib/routes/canonical-routes. Never hardcode /admin/* paths.',
    rationale: 'Single source of truth eliminates navigation entropy and orphan flows.',
  },
  {
    id: 'realtime-telemetry',
    decision: 'Global operational status bar (RealtimeSystemStatus) is mounted once in the admin layout. Powered by useRealtimeMetrics hook — polls /api/admin/platform-health every 30s + Supabase realtime subscriptions.',
    rationale: 'Platform feels alive. Admins see failures immediately without refreshing.',
  },
  {
    id: 'ecs-health-gate',
    decision: 'All ECS deploys (LMS + Admin) run post-deploy health checks via curl. Failure triggers automatic rollback via aws ecs update-service --force-new-deployment.',
    rationale: 'No blind deployments. Broken deploys are caught and reverted automatically.',
  },
  {
    id: 'mission-control-canonical',
    decision: 'Admin Dashboard (/admin/dashboard) is the single operational home. Mission Control, command-center, and monitoring aliases redirect to /admin/dashboard. Lizzy (single preview container with workspace tabs) is the only control surface on that page.',
    rationale: 'One operational surface eliminates context switching and duplicate maintenance.',
  },
];

/**
 * Get the full knowledge graph as a structured context string for AI injection.
 */
export function getKnowledgeGraphContext(): string {
  const lines: string[] = [
    '=== ELEVATE LMS PLATFORM KNOWLEDGE GRAPH ===',
    '',
    '## SYSTEMS',
    ...SYSTEMS.map(s =>
      `[${s.status.toUpperCase()}] ${s.name} (${s.id})\n  ${s.description}\n  Routes: ${s.routes.slice(0, 3).join(', ')}${s.routes.length > 3 ? ` +${s.routes.length - 3} more` : ''}\n  Tables: ${s.tables.slice(0, 4).join(', ')}${s.tables.length > 4 ? ` +${s.tables.length - 4} more` : ''}`
    ),
    '',
    '## PLATFORM DEBT',
    ...PLATFORM_DEBT.map(d => `[${d.severity.toUpperCase()}] ${d.id}: ${d.description}`),
    '',
    '## CANONICAL DECISIONS',
    ...CANONICAL_DECISIONS.map(d => `• ${d.id}: ${d.decision}`),
  ];
  return lines.join('\n');
}

/**
 * Look up which system owns a route or table.
 */
export function lookupRoute(path: string): SystemNode | undefined {
  const systemId = ROUTE_SYSTEM_MAP[path];
  return systemId ? SYSTEMS.find(s => s.id === systemId) : undefined;
}

export function lookupTable(table: string): SystemNode[] {
  const systemIds = TABLE_SYSTEM_MAP[table] ?? [];
  return SYSTEMS.filter(s => systemIds.includes(s.id));
}
