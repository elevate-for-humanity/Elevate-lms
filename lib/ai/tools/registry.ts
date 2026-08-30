import 'server-only';

export type AIAgentId = 'PARIS' | 'ELLIE' | 'LIZZY' | 'ZORA' | 'ROUTER';
export type AIToolRisk = 'low' | 'medium' | 'high' | 'critical';
export type AIToolClassification = 'read' | 'write';
export type AIToolScope = 'platform' | 'tenant' | 'user';

export type AIToolDefinition = {
  name: string;
  description: string;
  method: 'GET' | 'POST';
  path: string | ((input: Record<string, unknown>) => string);
  classification: AIToolClassification;
  risk: AIToolRisk;
  scope: AIToolScope;
  allowedAgents: readonly AIAgentId[];
  allowedRoles: readonly string[];
  requiredInput?: readonly string[];
  approvalRequired: boolean;
  confirmationPhrase?: string;
  idempotent: boolean;
  timeoutMs: number;
  retryAttempts: number;
  audit: boolean;
};

const ADMIN_ROLES = ['admin', 'super_admin', 'staff'] as const;
const PRIVILEGED_ADMIN_ROLES = ['admin', 'super_admin'] as const;
const DEVSTUDIO_AGENTS = ['LIZZY', 'ZORA'] as const;

function queryPath(path: string, input: Record<string, unknown>, allowed: readonly string[]): string {
  const params = new URLSearchParams();
  for (const key of allowed) {
    const value = input[key];
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export const AI_TOOL_REGISTRY: readonly AIToolDefinition[] = [
  { name: 'applications.search', description: 'Read the current application queue and application records.', method: 'GET', path: '/api/admin/applications', classification: 'read', risk: 'low', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'applications.approve', description: 'Approve a specific application after human confirmation.', method: 'POST', path: (input) => `/api/admin/applications/${encodeURIComponent(String(input.id ?? ''))}/approve`, classification: 'write', risk: 'high', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, requiredInput: ['id'], approvalRequired: true, confirmationPhrase: 'CONFIRM APPROVE APPLICATION', idempotent: true, timeoutMs: 20_000, retryAttempts: 1, audit: true },
  { name: 'students.search', description: 'Read current student records available to the authenticated administrator.', method: 'GET', path: '/api/admin/students', classification: 'read', risk: 'medium', scope: 'platform', allowedAgents: ['ELLIE', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'enrollments.search', description: 'Read active and historical enrollment records.', method: 'GET', path: '/api/admin/enrollments', classification: 'read', risk: 'medium', scope: 'platform', allowedAgents: ['PARIS', 'ELLIE', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'enrollments.create', description: 'Create or confirm an enrollment using the canonical admin enrollment endpoint.', method: 'POST', path: '/api/admin/enrollments', classification: 'write', risk: 'high', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, requiredInput: ['user_id'], approvalRequired: true, confirmationPhrase: 'CONFIRM CREATE ENROLLMENT', idempotent: true, timeoutMs: 25_000, retryAttempts: 1, audit: true },
  { name: 'programs.list', description: 'Read the canonical program registry available to Admin.', method: 'GET', path: '/api/admin/programs', classification: 'read', risk: 'low', scope: 'platform', allowedAgents: ['PARIS', 'ELLIE', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'courses.generate', description: 'Generate a course through the canonical course-generation pipeline.', method: 'POST', path: '/api/admin/courses/generate', classification: 'write', risk: 'medium', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: false, timeoutMs: 90_000, retryAttempts: 1, audit: true },
  { name: 'analytics.read', description: 'Read current administrative analytics.', method: 'GET', path: '/api/admin/analytics', classification: 'read', risk: 'low', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'system.health', description: 'Read current platform health and integration status.', method: 'GET', path: '/api/admin/platform-health', classification: 'read', risk: 'low', scope: 'platform', allowedAgents: ['LIZZY', 'ZORA', 'PARIS'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 20_000, retryAttempts: 2, audit: true },
  { name: 'workflows.inspect', description: 'Read current workflow, task, build, and platform snapshot state without starting or modifying execution.', method: 'GET', path: '/api/admin/dev-studio/workflows', classification: 'read', risk: 'low', scope: 'platform', allowedAgents: ['LIZZY', 'ZORA'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 30_000, retryAttempts: 2, audit: true },
  { name: 'payouts.list', description: 'Read the current enrollment payout queue.', method: 'GET', path: '/api/admin/enrollments/payout-queue', classification: 'read', risk: 'medium', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'payouts.markPaid', description: 'Mark an enrollment payout as paid after explicit human confirmation.', method: 'POST', path: '/api/admin/enrollments/mark-payout-paid', classification: 'write', risk: 'critical', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, requiredInput: ['enrollmentId'], approvalRequired: true, confirmationPhrase: 'CONFIRM PAYOUT PAID', idempotent: true, timeoutMs: 20_000, retryAttempts: 1, audit: true },
  { name: 'certificates.issue', description: 'Issue certificates through the canonical bulk certificate endpoint.', method: 'POST', path: '/api/admin/certificates/bulk', classification: 'write', risk: 'high', scope: 'platform', allowedAgents: ['LIZZY', 'ZORA'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: true, confirmationPhrase: 'CONFIRM ISSUE CERTIFICATE', idempotent: true, timeoutMs: 30_000, retryAttempts: 1, audit: true },
  { name: 'communications.remind', description: 'Send a targeted learner/admin reminder through the canonical reminder endpoint.', method: 'POST', path: '/api/admin/send-reminder', classification: 'write', risk: 'medium', scope: 'user', allowedAgents: ['PARIS', 'ELLIE', 'LIZZY'], allowedRoles: ADMIN_ROLES, requiredInput: ['userId'], approvalRequired: false, idempotent: false, timeoutMs: 20_000, retryAttempts: 1, audit: true },
  { name: 'cohorts.list', description: 'Read current cohort records.', method: 'GET', path: '/api/admin/cohorts', classification: 'read', risk: 'low', scope: 'platform', allowedAgents: ['LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'wioa.list', description: 'Read current WIOA/workforce records exposed to Admin.', method: 'GET', path: '/api/admin/wioa', classification: 'read', risk: 'medium', scope: 'platform', allowedAgents: ['ZORA', 'LIZZY', 'PARIS'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 15_000, retryAttempts: 2, audit: true },
  { name: 'wioa.followups', description: 'Find due or overdue WIOA participant follow-ups, including case-manager routing and optional 30-day/type, sector, or program filters.', method: 'GET', path: (input) => queryPath('/api/admin/wioa/followups', input, ['type','status','program','sector','overdue','dueBefore','limit']), classification: 'read', risk: 'medium', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 20_000, retryAttempts: 2, audit: true },
  { name: 'wioa.performance', description: 'Read aggregate WIOA employment, earnings, credential-attainment, and measurable-skill-gain performance metrics for narrative reporting.', method: 'GET', path: (input) => queryPath('/api/admin/wioa/performance-summary', input, ['programId','periodStart','periodEnd','limit']), classification: 'read', risk: 'medium', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 20_000, retryAttempts: 2, audit: true },
  { name: 'reports.run', description: 'Run a named administrative report.', method: 'GET', path: (input) => `/api/admin/reports/${encodeURIComponent(String(input.type ?? 'overview'))}`, classification: 'read', risk: 'low', scope: 'platform', allowedAgents: DEVSTUDIO_AGENTS, allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 30_000, retryAttempts: 2, audit: true },
  { name: 'exports.run', description: 'Run a named administrative export.', method: 'GET', path: (input) => `/api/admin/export/${encodeURIComponent(String(input.type ?? 'participants'))}`, classification: 'read', risk: 'medium', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 30_000, retryAttempts: 1, audit: true },
  { name: 'risk.flagLearner', description: 'Flag a learner or enrollment as at-risk.', method: 'POST', path: '/api/admin/at-risk/flag', classification: 'write', risk: 'high', scope: 'user', allowedAgents: ['LIZZY', 'ZORA'], allowedRoles: PRIVILEGED_ADMIN_ROLES, requiredInput: ['userId'], approvalRequired: true, confirmationPhrase: 'CONFIRM FLAG AT RISK', idempotent: true, timeoutMs: 20_000, retryAttempts: 1, audit: true },
  { name: 'risk.assignCounselor', description: 'Assign an AI-supported student-success intervention to an at-risk learner.', method: 'POST', path: '/api/admin/at-risk/assign-counselor', classification: 'write', risk: 'medium', scope: 'user', allowedAgents: ['ELLIE', 'LIZZY', 'ZORA'], allowedRoles: ADMIN_ROLES, requiredInput: ['userId'], approvalRequired: false, idempotent: true, timeoutMs: 20_000, retryAttempts: 1, audit: true },
  { name: 'documents.sendForSignature', description: 'Send a document into the configured signature workflow.', method: 'POST', path: '/api/admin/sign-documents/send', classification: 'write', risk: 'high', scope: 'user', allowedAgents: ['LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: true, confirmationPhrase: 'CONFIRM SEND DOCUMENT', idempotent: false, timeoutMs: 30_000, retryAttempts: 1, audit: true },
  { name: 'email.sendTest', description: 'Send a non-bulk test email through the configured test endpoint.', method: 'POST', path: '/api/admin/test-email', classification: 'write', risk: 'low', scope: 'user', allowedAgents: ['LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: false, timeoutMs: 20_000, retryAttempts: 1, audit: true },
  { name: 'communications.bulkEmail', description: 'Send a bulk email campaign after explicit human approval.', method: 'POST', path: '/api/admin/email/bulk', classification: 'write', risk: 'critical', scope: 'platform', allowedAgents: ['LIZZY', 'PARIS'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: true, confirmationPhrase: 'CONFIRM BULK EMAIL', idempotent: false, timeoutMs: 90_000, retryAttempts: 1, audit: true },
  { name: 'video.generate', description: 'Generate a video asset through the canonical video endpoint.', method: 'POST', path: '/api/video/generate', classification: 'write', risk: 'medium', scope: 'platform', allowedAgents: ['PARIS', 'LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: false, timeoutMs: 120_000, retryAttempts: 1, audit: true },
  { name: 'workflows.buildCourses', description: 'Run the existing course-build autopilot.', method: 'POST', path: '/api/autopilots/build-courses', classification: 'write', risk: 'medium', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: false, timeoutMs: 120_000, retryAttempts: 1, audit: true },
  { name: 'workflows.runTests', description: 'Run the existing platform/autopilot test executor.', method: 'POST', path: '/api/autopilots/run-tests', classification: 'write', risk: 'low', scope: 'platform', allowedAgents: DEVSTUDIO_AGENTS, allowedRoles: PRIVILEGED_ADMIN_ROLES, approvalRequired: false, idempotent: false, timeoutMs: 90_000, retryAttempts: 1, audit: true },
  { name: 'deployments.autopilot', description: 'Trigger the existing deployment autopilot after explicit human approval.', method: 'POST', path: '/api/autopilots/deploy', classification: 'write', risk: 'critical', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: ['super_admin'], approvalRequired: true, confirmationPhrase: 'CONFIRM DEPLOY', idempotent: false, timeoutMs: 120_000, retryAttempts: 1, audit: true },
  { name: 'migrations.run', description: 'Run a named migration after explicit human approval.', method: 'POST', path: '/api/admin/migrations/run', classification: 'write', risk: 'critical', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: ['super_admin'], approvalRequired: true, confirmationPhrase: 'CONFIRM MIGRATION', idempotent: false, timeoutMs: 120_000, retryAttempts: 1, audit: true },
  { name: 'migrations.applyAll', description: 'Apply all pending migrations after explicit human approval.', method: 'POST', path: '/api/admin/migrations/apply-all', classification: 'write', risk: 'critical', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: ['super_admin'], approvalRequired: true, confirmationPhrase: 'CONFIRM MIGRATION', idempotent: false, timeoutMs: 120_000, retryAttempts: 1, audit: true },
  { name: 'migrations.rollback', description: 'Run the configured migration rollback operation after explicit human approval.', method: 'POST', path: '/api/admin/migrations/rollback', classification: 'write', risk: 'critical', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: ['super_admin'], approvalRequired: true, confirmationPhrase: 'CONFIRM ROLLBACK', idempotent: false, timeoutMs: 120_000, retryAttempts: 1, audit: true },
  { name: 'devstudio.gitPush', description: 'Push approved Dev Studio changes through the canonical git endpoint.', method: 'POST', path: '/api/admin/dev-studio/git/push', classification: 'write', risk: 'critical', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: ['super_admin'], approvalRequired: true, confirmationPhrase: 'CONFIRM PUSH', idempotent: false, timeoutMs: 120_000, retryAttempts: 1, audit: true },
  { name: 'trials.manage', description: 'Start/manage an individual app trial through the canonical trial endpoint.', method: 'POST', path: '/api/apps/trial/start', classification: 'write', risk: 'medium', scope: 'user', allowedAgents: ['PARIS', 'LIZZY'], allowedRoles: ADMIN_ROLES, approvalRequired: false, idempotent: true, timeoutMs: 30_000, retryAttempts: 1, audit: true },
  { name: 'openhands.execute', description: 'Dispatch a privileged software-engineering task to OpenHands Cloud through the canonical Dev Studio runtime.', method: 'POST', path: '/api/admin/dev-studio/openhands/agent', classification: 'write', risk: 'high', scope: 'platform', allowedAgents: ['LIZZY'], allowedRoles: ['super_admin'], requiredInput: ['task'], approvalRequired: true, confirmationPhrase: 'CONFIRM OPENHANDS EXECUTION', idempotent: false, timeoutMs: 90_000, retryAttempts: 1, audit: true },
  { name: 'openhands.status', description: 'Refresh the status of an existing OpenHands engineering task without changing repository state.', method: 'GET', path: (input) => queryPath('/api/admin/dev-studio/openhands/agent', input, ['taskId','startTaskId','conversationId']), classification: 'read', risk: 'low', scope: 'platform', allowedAgents: ['LIZZY', 'ZORA'], allowedRoles: ['super_admin'], approvalRequired: false, idempotent: true, timeoutMs: 30_000, retryAttempts: 2, audit: true },
] as const;

const BY_NAME = new Map(AI_TOOL_REGISTRY.map((tool) => [tool.name, tool]));

export function getAITool(name: string): AIToolDefinition | null {
  return BY_NAME.get(name) ?? null;
}

export function listAIToolsForAgent(agent: AIAgentId): AIToolDefinition[] {
  return AI_TOOL_REGISTRY.filter((tool) => tool.allowedAgents.includes(agent));
}

export function getAIToolCatalogForPrompt(agent: AIAgentId): string {
  return listAIToolsForAgent(agent)
    .map((tool) => `${tool.name} — ${tool.description} [${tool.classification}/${tool.risk}${tool.approvalRequired ? '/approval-required' : ''}]`)
    .join('\n');
}
