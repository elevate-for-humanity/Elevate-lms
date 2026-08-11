export type AIToolRisk = 'low' | 'medium' | 'high' | 'critical';
export type AIToolMode = 'read' | 'write';
export type ElevateAgent = 'PARIS' | 'ELLIE' | 'LIZZY' | 'ZORA' | 'ROUTER';

export type AIToolDefinition = {
  name: string;
  description: string;
  mode: AIToolMode;
  risk: AIToolRisk;
  requiresApproval: boolean;
  requiredRoles: string[];
  allowedAgents: ElevateAgent[];
  timeoutMs: number;
  inputSchema: Record<string, unknown>;
};

export const AI_TOOL_REGISTRY: Record<string, AIToolDefinition> = {
  'applications.search': {
    name: 'applications.search',
    description: 'Search admissions applications by status, program, email, or applicant name.',
    mode: 'read',
    risk: 'low',
    requiresApproval: false,
    requiredRoles: ['admin', 'super_admin', 'staff'],
    allowedAgents: ['PARIS', 'LIZZY', 'ZORA', 'ROUTER'],
    timeoutMs: 10000,
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        program: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  'applications.read': {
    name: 'applications.read',
    description: 'Read one application and its review/funding fields by application ID.',
    mode: 'read',
    risk: 'medium',
    requiresApproval: false,
    requiredRoles: ['admin', 'super_admin', 'staff'],
    allowedAgents: ['PARIS', 'LIZZY', 'ZORA', 'ROUTER'],
    timeoutMs: 10000,
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  'applications.updateStatus': {
    name: 'applications.updateStatus',
    description: 'Change an application status after a human administrator approves the action.',
    mode: 'write',
    risk: 'high',
    requiresApproval: true,
    requiredRoles: ['admin', 'super_admin'],
    allowedAgents: ['PARIS', 'ZORA', 'ROUTER'],
    timeoutMs: 10000,
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: {
          type: 'string',
          enum: ['pending', 'submitted', 'in_review', 'under_review', 'pending_admin_review', 'approved', 'rejected', 'enrolled'],
        },
        reviewNotes: { type: 'string' },
      },
      required: ['id', 'status'],
      additionalProperties: false,
    },
  },
  'programs.search': {
    name: 'programs.search',
    description: 'Search active programs and return identifiers, status, category, and publication state.',
    mode: 'read',
    risk: 'low',
    requiresApproval: false,
    requiredRoles: ['admin', 'super_admin', 'staff', 'instructor'],
    allowedAgents: ['PARIS', 'ELLIE', 'LIZZY', 'ZORA', 'ROUTER'],
    timeoutMs: 10000,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  'enrollments.search': {
    name: 'enrollments.search',
    description: 'Search current program enrollments by status, program, student, or funding source.',
    mode: 'read',
    risk: 'medium',
    requiresApproval: false,
    requiredRoles: ['admin', 'super_admin', 'staff'],
    allowedAgents: ['PARIS', 'ELLIE', 'LIZZY', 'ZORA', 'ROUTER'],
    timeoutMs: 10000,
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        program: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  'operations.alerts': {
    name: 'operations.alerts',
    description: 'Read recent operational alerts that require administrator attention.',
    mode: 'read',
    risk: 'low',
    requiresApproval: false,
    requiredRoles: ['admin', 'super_admin', 'staff'],
    allowedAgents: ['PARIS', 'LIZZY', 'ZORA', 'ROUTER'],
    timeoutMs: 10000,
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } },
      additionalProperties: false,
    },
  },
};

export function getAIToolDefinition(name: string): AIToolDefinition | null {
  return AI_TOOL_REGISTRY[name] ?? null;
}

export function listAIToolsForAgent(agent: ElevateAgent): AIToolDefinition[] {
  return Object.values(AI_TOOL_REGISTRY).filter((tool) => tool.allowedAgents.includes(agent));
}
