import 'server-only';

import { aiChat } from '@/lib/ai/ai-service';
import { getAgentRegistry } from '@/lib/ai/agent-registry';
import { AgentIntent, type AIAgent } from '@/lib/ai/types';
import { getWorkflowToolDefinition, WORKFLOW_TOOL_REGISTRY } from '@/lib/workflows/tool-registry';

export type PlanStep = {
  id: string;
  intent: AgentIntent;
  capability: string;
  agent: AIAgent;
  tool: string;
  dependencies: string[];
  approvalRequired: boolean;
  expectedOutput: string;
  verificationRule: string;
  maxAttempts: number;
};

export type ExecutionPlan = {
  goal: string;
  context: Record<string, unknown>;
  steps: PlanStep[];
  createdAt: string;
  source: 'ai' | 'deterministic';
};

const INTENTS = new Set(Object.values(AgentIntent));
const MAX_PLAN_STEPS = 20;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return asRecord(JSON.parse(cleaned));
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first < 0 || last <= first) return null;
    try {
      return asRecord(JSON.parse(cleaned.slice(first, last + 1)));
    } catch {
      return null;
    }
  }
}

function normalizeIntent(value: unknown): AgentIntent {
  const candidate = String(value ?? '').trim().toUpperCase();
  return INTENTS.has(candidate as AgentIntent) ? (candidate as AgentIntent) : AgentIntent.GENERAL;
}

function deterministicIntent(goal: string): AgentIntent {
  const text = goal.toLowerCase();
  if (/course|lesson|curriculum|module|assessment/.test(text)) return AgentIntent.COURSE_BUILDER;
  if (/enroll|enrollment|student intake/.test(text)) return AgentIntent.ENROLLMENT;
  if (/compliance|audit|wioa|credential|regulat/.test(text)) return AgentIntent.COMPLIANCE;
  if (/job|career|placement|employer/.test(text)) return AgentIntent.CAREER_PLACEMENT;
  if (/admission|application|eligib/.test(text)) return AgentIntent.ADMISSION;
  if (/student|learner|support|progress/.test(text)) return AgentIntent.STUDENT_SUPPORT;
  if (/operation|admin|queue|document|workflow/.test(text)) return AgentIntent.OPS;
  return AgentIntent.GENERAL;
}

function deterministicTool(intent: AgentIntent): string {
  switch (intent) {
    case AgentIntent.COMPLIANCE:
    case AgentIntent.COURSE_BUILDER:
    case AgentIntent.GENERAL:
      return 'ai_action';
    case AgentIntent.ADMISSION:
    case AgentIntent.ENROLLMENT:
    case AgentIntent.STUDENT_SUPPORT:
    case AgentIntent.CAREER_PLACEMENT:
    case AgentIntent.OPS:
      return 'emit_event';
    default:
      return 'ai_action';
  }
}

function validateAndNormalizeSteps(rawSteps: unknown[]): PlanStep[] {
  const registry = getAgentRegistry();
  const seen = new Set<string>();
  const steps: PlanStep[] = [];

  for (const [index, rawStep] of rawSteps.slice(0, MAX_PLAN_STEPS).entries()) {
    const record = asRecord(rawStep);
    if (!record) continue;

    const intent = normalizeIntent(record.intent);
    const tool = String(record.tool ?? deterministicTool(intent)).trim();
    const toolDef = getWorkflowToolDefinition(tool);
    if (!toolDef) continue;

    const id = String(record.id ?? `step-${index + 1}`).trim() || `step-${index + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const selected = registry.selectAgent(intent);
    const dependencies = Array.isArray(record.dependencies)
      ? record.dependencies.map(String).filter((dependency) => dependency !== id)
      : [];

    steps.push({
      id,
      intent,
      capability: String(record.capability ?? intent.toLowerCase()),
      agent: selected.type,
      tool,
      dependencies,
      approvalRequired: Boolean(record.approval_required ?? record.approvalRequired ?? toolDef.approvalRequired),
      expectedOutput: String(record.expected_output ?? record.expectedOutput ?? 'A verifiable structured result'),
      verificationRule: String(record.verification_rule ?? record.verificationRule ?? 'Result must exist and tool execution must succeed'),
      maxAttempts: Math.max(1, Math.min(Number(record.max_attempts ?? record.maxAttempts ?? toolDef.maxRetries) || 1, 5)),
    });
  }

  const ids = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    step.dependencies = step.dependencies.filter((dependency) => ids.has(dependency));
  }

  return steps;
}

function fallbackPlan(goal: string, context: Record<string, unknown>): ExecutionPlan {
  const intent = deterministicIntent(goal);
  const agent = getAgentRegistry().selectAgent(intent);
  const tool = deterministicTool(intent);
  const toolDef = WORKFLOW_TOOL_REGISTRY[tool];
  return {
    goal,
    context,
    createdAt: new Date().toISOString(),
    source: 'deterministic',
    steps: [
      {
        id: 'step-1',
        intent,
        capability: intent.toLowerCase(),
        agent: agent.type,
        tool,
        dependencies: [],
        approvalRequired: toolDef?.approvalRequired ?? false,
        expectedOutput: 'A verifiable result for the requested goal',
        verificationRule: 'Tool execution succeeds and returns a non-empty result',
        maxAttempts: toolDef?.maxRetries ?? 1,
      },
    ],
  };
}

export async function planAgentGoal(
  goal: string,
  context: Record<string, unknown> = {},
): Promise<ExecutionPlan> {
  const normalizedGoal = goal.trim();
  if (!normalizedGoal) throw new Error('Agent planner requires a non-empty goal');

  const toolSummary = Object.values(WORKFLOW_TOOL_REGISTRY).map((tool) => ({
    id: tool.id,
    risk: tool.risk,
    approval_required: tool.approvalRequired,
    description: tool.description,
  }));

  try {
    const response = await aiChat({
      messages: [
        {
          role: 'system',
          content: [
            'You are the planning layer for Elevate for Humanity.',
            'Return JSON only. Do not execute tools or propose shell commands, SQL, or arbitrary HTTP calls.',
            'Use only the supplied tool IDs and AgentIntent values.',
            'Prefer the fewest safe steps. Preserve human approval for high-impact actions.',
            'Schema: {"steps":[{"id":"step-1","intent":"OPS","capability":"...","tool":"emit_event","dependencies":[],"approval_required":false,"expected_output":"...","verification_rule":"...","max_attempts":2}]}',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            goal: normalizedGoal,
            context,
            allowed_intents: Object.values(AgentIntent),
            allowed_tools: toolSummary,
          }),
        },
      ],
      temperature: 0.1,
      maxTokens: 1800,
    });

    const parsed = parseJsonObject(response.content);
    const rawSteps = parsed && Array.isArray(parsed.steps) ? parsed.steps : [];
    const steps = validateAndNormalizeSteps(rawSteps);
    if (!steps.length) return fallbackPlan(normalizedGoal, context);

    return {
      goal: normalizedGoal,
      context,
      steps,
      createdAt: new Date().toISOString(),
      source: 'ai',
    };
  } catch {
    return fallbackPlan(normalizedGoal, context);
  }
}
