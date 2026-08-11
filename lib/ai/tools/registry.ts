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

export const AI_TOOL_REGISTRY: readonly AIToolDefinition[] = [
  {
    name: 'applications.search',
    description: 'Read the current application queue and application records.',
    method: 'GET',
    path: '/api/admin/applications',
    classification: 'read',
    risk: 'low',
    scope: 'platform',
    allowedAgents: ['PARIS', 'LIZZY', 'ZORA'],
    allowedRoles: ADMIN_ROLES,
    approvalRequired: false,
    idempotent: true,
    timeoutMs: 15_000,
    retryAttempts: 2,
    audit: true,
  },
  {
    name: 'applications.approve',
    description: 'Approve a specific application after human confirmation.',
    method: 'POST',
    path: (input) => `/api/admin/applications/${encodeURIComponent(String(input.id ?? ''))}/approve`,
    classification: 'write',
    risk: 'high',
    scope: 'platform',
    allowedAgents: ['PARIS', 'LIZZY'],
    allowedRoles: PRIVILEGED_ADMIN_ROLES,
    requiredInput: ['id'],
    approvalRequired: true,
    confirmationPhrase: 'CONFIRM APPROVE APPLICATION',
    idempotent: true,
    timeoutMs: 20_000,
    retryAttempts: 1,
    audit: true,
  },
  {
    name: 'students.search',
    description: 'Read current student records available to the authenticated administrator.',
    method: 'GET',
    path: '/api/admin/students',
    classification: 'read',
    risk: 'medium',
    scope: 'platform',
    allowedAgents: ['ELLIE', 'LIZZY', 'ZORA'],
    allowedRoles: ADMIN_ROLES,
    approvalRequired: false,
    idempotent: true,
    timeoutMs: 15_000,
    retryAttempts: 2,
    audit: true,
  },
  {
    name: 'enrollments.search',
    description: 'Read active and historical enrollment records.',
    method: 'GET',
    path: '/api/admin/enrollments',
    classification: 'read',
    risk: 'medium',
    scope: 'platform',
    allowedAgents: ['PARIS', 'ELLIE', 'LIZZY', 'ZORA'],
    allowedRoles: ADMIN_ROLES,
    approvalRequired: false,
    idempotent: true,
    timeoutMs: 15_000,
    retryAttempts: 2,
    audit: true,
  },
  {
    name: 'enrollments.create',
    description: 'Create or confirm an enrollment using the canonical admin enrollment endpoint.',
    method: 'POST',
    path: '/api/admin/enrollments',
    classification: 'write',
    risk: 'high',
    scope: 'platform',
    allowedAgents: ['PARIS', 'LIZZY'],
    allowedRoles: PRIVILEGED_ADMIN_ROLES,
    requiredInput: ['user_id'],
    approvalRequired: true,
    confirmationPhrase: 'CONFIRM CREATE ENROLLMENT',
    idempotent: true,
    timeoutMs: 25_000,
    retryAttempts: 1,
    audit: true,
  },
  {
    name: 'programs.list',
    description: 'Read the canonical program registry available to Admin.',
    method: 'GET',
    path: '/api/admin/programs',
    classification: 'read',
    risk: 'low',
    scope: 'platform',
    allowedAgents: ['PARIS', 'ELLIE', 'LIZZY', 'ZORA'],
    allowedRoles: ADMIN_ROLES,
    approvalRequired: false,
    idempotent: true,
    timeoutMs: 15_000,
    retryAttempts: 2,
    audit: true,
  },
  {
    name: 'courses.generate',
    description: 'Generate a course through the canonical course-generation pipeline.',
    method: 'POST',
    path: '/api/admin/courses/generate',
    classification: 'write',
    risk: 'medium',
    scope: 'platform',
    allowedAgents: ['PARIS', 'LIZZY'],
    allowedRoles: PRIVILEGED_ADMIN_ROLES,
    approvalRequired: false,
    idempotent: false,
    timeoutMs: 90_000,
    retryAttempts: 1,
    audit: true,
  },
  {
    name: 'analytics.read',
    description: 'Read current administrative analytics.',
    method: 'GET',
    path: '/api/admin/analytics',
    classification: 'read',
    risk: 'low',
    scope: 'platform',
    allowedAgents: ['PARIS', 'LIZZY', 'ZORA'],
    allowedRoles: ADMIN_ROLES,
    approvalRequired: false,
    idempotent: true,
    timeoutMs: 15_000,
    retryAttempts: 2,
    audit: true,
  },
  {
    name: 'system.health',
    description: 'Read current platform health and integration status.',
    method: 'GET',
    path: '/api/admin/platform-health',
    classification: 'read',
    risk: 'low',
    scope: 'platform',
    allowedAgents: ['LIZZY', 'ZORA', 'PARIS'],
    allowedRoles: ADMIN_ROLES,
    approvalRequired: false,
    idempotent: true,
    timeoutMs: 20_000,
    retryAttempts: 2,
    audit: true,
  },
  {
    name: 'payouts.list',
    description: 'Read the current enrollment payout queue.',
    method: 'GET',
    path: '/api/admin/enrollments/payout-queue',
    classification: 'read',
    risk: 'medium',
    scope: 'platform',
    allowedAgents: ['LIZZY'],
    allowedRoles: PRIVILEGED_ADMIN_ROLES,
    approvalRequired: false,
    idempotent: true,
    timeoutMs: 15_000,
    retryAttempts: 2,
    audit: true,
  },
  {
    name: 'payouts.markPaid',
    description: 'Mark an enrollment payout as paid after explicit human confirmation.',
    method: 'POST',
    path: '/api/admin/enrollments/mark-payout-paid',
    classification: 'write',
    risk: 'critical',
    scope: 'platform',
    allowedAgents: ['LIZZY'],
    allowedRoles: PRIVILEGED_ADMIN_ROLES,
    requiredInput: ['enrollmentId'],
    approvalRequired: true,
    confirmationPhrase: 'CONFIRM PAYOUT PAID',
    idempotent: true,
    timeoutMs: 20_000,
    retryAttempts: 1,
    audit: true,
  },
  {
    name: 'certificates.issue',
    description: 'Issue certificates through the canonical bulk certificate endpoint.',
    method: 'POST',
    path: '/api/admin/certificates/bulk',
    classification: 'write',
    risk: 'high',
    scope: 'platform',
    allowedAgents: ['LIZZY', 'ZORA'],
    allowedRoles: PRIVILEGED_ADMIN_ROLES,
    approvalRequired: true,
    confirmationPhrase: 'CONFIRM ISSUE CERTIFICATE',
    idempotent: true,
    timeoutMs: 30_000,
    retryAttempts: 1,
    audit: true,
  },
  {
    name: 'communications.remind',
    description: 'Send a targeted learner/admin reminder through the canonical reminder endpoint.',
    method: 'POST',
    path: '/api/admin/send-reminder',
    classification: 'write',
    risk: 'medium',
    scope: 'user',
    allowedAgents: ['PARIS', 'ELLIE', 'LIZZY'],
    allowedRoles: ADMIN_ROLES,
    requiredInput: ['userId'],
    approvalRequired: false,
    idempotent: false,
    timeoutMs: 20_000,
    retryAttempts: 1,
    audit: true,
  },
  {
    name: 'workflows.runTests',
    description: 'Run the existing platform/autopilot test executor.',
    method: 'POST',
    path: '/api/autopilots/run-tests',
    classification: 'write',
    risk: 'low',
    scope: 'platform',
    allowedAgents: ['LIZZY', 'ZORA'],
    allowedRoles: PRIVILEGED_ADMIN_ROLES,
    approvalRequired: false,
    idempotent: false,
    timeoutMs: 90_000,
    retryAttempts: 1,
    audit: true,
  },
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
