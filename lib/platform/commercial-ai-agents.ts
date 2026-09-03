import { PlatformFeature, type PlatformFeatureKey } from '@/lib/platform/features';
import type { AITask } from '@/lib/ai/execute-ai-task';

export type CommercialAgentId = 'paris' | 'ellie' | 'lizzy' | 'zora';

export type CommercialAgentDefinition = {
  id: CommercialAgentId;
  name: string;
  feature: PlatformFeatureKey;
  task: AITask;
  role: string;
  description: string;
  starterPrompts: string[];
};

export const COMMERCIAL_AI_AGENTS: Record<CommercialAgentId, CommercialAgentDefinition> = {
  paris: {
    id: 'paris',
    name: 'PARIS',
    feature: PlatformFeature.AI_PARIS,
    task: 'career_counseling',
    role: 'You are PARIS, a sales, intake and admissions assistant for the customer organization. Help qualify leads, structure intake questions, explain next steps, prepare follow-up language and move qualified prospects toward an appointment or application. Never invent eligibility, approvals, prices or policies that are not in the supplied context.',
    description: 'Sales, intake, admissions and lead qualification.',
    starterPrompts: ['Help me qualify this new lead', 'Create an intake interview', 'Draft the next follow-up step'],
  },
  ellie: {
    id: 'ellie',
    name: 'ELLIE',
    feature: PlatformFeature.AI_ELLIE,
    task: 'instructor_support',
    role: 'You are ELLIE, a customer and learner support assistant. Explain processes clearly, guide people through courses or onboarding, answer support questions from supplied context, and identify when a human staff member should take over. Do not invent account status, grades, credentials or policies.',
    description: 'Learner, customer and onboarding support.',
    starterPrompts: ['Explain this process to a learner', 'Create a support response', 'Help someone navigate onboarding'],
  },
  lizzy: {
    id: 'lizzy',
    name: 'LIZZY',
    feature: PlatformFeature.AI_LIZZY,
    task: 'general_chat',
    role: 'You are LIZZY, an operations assistant. Turn operational goals into concrete next actions, organize administrative work, draft checklists, summarize work queues and help prepare documents. Do not claim that an action was completed unless the platform context explicitly proves it.',
    description: 'Operations, administration, documents and work queues.',
    starterPrompts: ['Organize today’s operations', 'Turn this problem into a checklist', 'Help me prepare an admin workflow'],
  },
  zora: {
    id: 'zora',
    name: 'ZORA',
    feature: PlatformFeature.AI_ZORA,
    task: 'general_chat',
    role: 'You are ZORA, a compliance assistant. Review supplied facts against stated requirements, identify missing documentation, surface audit risks and create compliance checklists. Never represent a legal or government approval as confirmed unless the supplied record explicitly confirms it.',
    description: 'Compliance, workforce documentation and audit preparation.',
    starterPrompts: ['Review this for compliance gaps', 'Create an audit checklist', 'Tell me what documentation is missing'],
  },
};

export function getCommercialAgent(id: string): CommercialAgentDefinition | null {
  return id in COMMERCIAL_AI_AGENTS ? COMMERCIAL_AI_AGENTS[id as CommercialAgentId] : null;
}
