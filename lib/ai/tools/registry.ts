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
  },
};

export function getAIToolDefinition(name: string): AIToolDefinition | null {
  return AI_TOOL_REGISTRY[name] ?? null;
}

export function listAIToolsForAgent(agent: ElevateAgent): AIToolDefinition[] {
  return Object.values(AI_TOOL_REGISTRY).filter((tool) => tool.allowedAgents.includes(agent));
}
