/**
 * AI Team Marketplace — productized operator personas (hire via add-ons / bundles).
 */

export type AiTeamAgentId =
  | 'marketing_manager'
  | 'sales_manager'
  | 'enrollment_specialist'
  | 'course_author'
  | 'developer'
  | 'compliance_officer';

export interface AiTeamAgent {
  id: AiTeamAgentId;
  name: string;
  tagline: string;
  priceMonthly: number;
  capabilities: string[];
  /** Maps to operator_tasks.task_type */
  taskType: string;
  featureCode: string;
  /** Agent illustration */
  image?: string;
}

export const AI_TEAM_AGENTS: AiTeamAgent[] = [
  {
    id: 'marketing_manager',
    name: 'AI Marketing Manager',
    tagline: 'SEO pages, blog drafts, and campaign copy',
    priceMonthly: 29,
    capabilities: ['Write landing pages', 'Draft blog posts', 'Optimize meta descriptions'],
    taskType: 'marketing_content',
    featureCode: 'ai_content',
    image: '/images/agents/marketing-manager.svg',
  },
  {
    id: 'sales_manager',
    name: 'AI Sales Manager',
    tagline: 'Lead follow-up scripts and CRM nurture sequences',
    priceMonthly: 29,
    capabilities: ['Qualify leads', 'Draft outreach', 'CRM task suggestions'],
    taskType: 'sales_outreach',
    featureCode: 'crm',
    image: '/images/agents/sales-manager.svg',
  },
  {
    id: 'enrollment_specialist',
    name: 'AI Enrollment Specialist',
    tagline: 'Intake forms, eligibility, and enrollment workflows',
    priceMonthly: 49,
    capabilities: ['Build intake flows', 'Enrollment reminders', 'Document checklists'],
    taskType: 'enrollment_workflow',
    featureCode: 'student_management',
    image: '/images/agents/enrollment-specialist.svg',
  },
  {
    id: 'course_author',
    name: 'AI Course Author',
    tagline: 'Modules, lessons, quizzes from your program outline',
    priceMonthly: 49,
    capabilities: ['Generate curriculum', 'Quiz questions', 'Certificate copy'],
    taskType: 'course_build',
    featureCode: 'lms',
    image: '/images/agents/course-author.svg',
  },
  {
    id: 'developer',
    name: 'AI Developer',
    tagline: 'Site tweaks, integrations, and deploy assistance',
    priceMonthly: 99,
    capabilities: ['Edit site config', 'Suggest API integrations', 'Deploy checklist'],
    taskType: 'code_change',
    featureCode: 'api_access',
    image: '/images/agents/developer.svg',
  },
  {
    id: 'compliance_officer',
    name: 'AI Compliance Officer',
    tagline: 'WIOA, grant, and audit-ready reporting drafts',
    priceMonthly: 79,
    capabilities: ['PIRL prep notes', 'Policy drafts', 'Audit reminders'],
    taskType: 'compliance_report',
    featureCode: 'workforce',
    image: '/images/agents/compliance-officer.svg',
  },
];

export function getAiTeamAgent(id: string): AiTeamAgent | undefined {
  return AI_TEAM_AGENTS.find((a) => a.id === id);
}
