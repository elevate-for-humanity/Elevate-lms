import type { AgenticTargetType, AgenticWorkerDefinition } from './types';

const WORKERS: AgenticWorkerDefinition[] = [
  {
    name: 'application-interview',
    capabilities: ['question_selection', 'answer_mapping', 'application_progress', 'locale_guidance'],
    targetTypes: ['application'],
    costClass: 'low',
  },
  {
    name: 'application-documents',
    capabilities: ['document_requirements', 'upload_routing', 'review_routing'],
    targetTypes: ['application'],
    costClass: 'low',
    approvalRequired: true,
  },
  {
    name: 'funding-guidance',
    capabilities: ['funding_pathway', 'referral_tracking', 'funding_disclosures'],
    targetTypes: ['application', 'store_workspace'],
    costClass: 'low',
  },
  {
    name: 'apprenticeship-intake',
    capabilities: ['host_shop', 'transfer_hours', 'ojl_rti_intake', 'sponsor_review'],
    targetTypes: ['application', 'apprenticeship'],
    costClass: 'low',
    approvalRequired: true,
  },
  {
    name: 'admissions-qa',
    capabilities: ['completeness', 'conflict_detection', 'human_review_routing'],
    targetTypes: ['application'],
    costClass: 'low',
    approvalRequired: true,
  },
  {
    name: 'enrollment',
    capabilities: ['canonical_enrollment_link', 'lms_access'],
    targetTypes: ['application'],
    costClass: 'low',
    approvalRequired: true,
  },
  {
    name: 'course-architect',
    capabilities: ['course_blueprint', 'module_structure', 'lesson_structure', 'objectives'],
    targetTypes: ['course', 'program'],
    costClass: 'medium',
  },
  {
    name: 'instructional-designer',
    capabilities: ['assessments', 'scenarios', 'activities', 'knowledge_checks'],
    targetTypes: ['course'],
    costClass: 'medium',
  },
  {
    name: 'visual-designer',
    capabilities: ['layout', 'design_tokens', 'component_selection'],
    targetTypes: ['website', 'course', 'store_workspace', 'dev_studio', 'marketing_campaign'],
    costClass: 'low',
  },
  {
    name: 'media-director',
    capabilities: ['existing_assets', 'stock_assets', 'image_generation', 'diagram', 'animation', 'video_generation'],
    targetTypes: ['website', 'course', 'store_workspace', 'marketing_campaign'],
    costClass: 'medium',
  },
  {
    name: 'website-builder',
    capabilities: ['page_composition', 'site_configuration', 'preview', 'publish'],
    targetTypes: ['website', 'store_workspace'],
    costClass: 'medium',
  },
  {
    name: 'workflow-builder',
    capabilities: ['forms', 'crm_workflows', 'automation', 'approval_flow'],
    targetTypes: ['workflow', 'store_workspace', 'dev_studio'],
    costClass: 'medium',
  },
  {
    name: 'translation',
    capabilities: ['localize_content', 'locale_preview', 'translation_status'],
    targetTypes: ['website', 'course', 'application', 'store_workspace'],
    costClass: 'medium',
  },
  {
    name: 'compliance-qa',
    capabilities: ['accessibility', 'claims_review', 'completion_validation', 'security_checks'],
    targetTypes: ['website', 'course', 'program', 'workflow', 'store_workspace', 'dev_studio', 'marketing_campaign'],
    costClass: 'low',
    approvalRequired: true,
  },
  {
    name: 'publisher',
    capabilities: ['canonical_persist', 'publish'],
    targetTypes: ['website', 'course', 'program', 'workflow', 'store_workspace', 'dev_studio', 'marketing_campaign'],
    costClass: 'low',
    approvalRequired: true,
  },
];

const WORKER_MAP = new Map(WORKERS.map((worker) => [worker.name, worker]));

export function listAgenticWorkers(): AgenticWorkerDefinition[] {
  return WORKERS.map((worker) => ({ ...worker, capabilities: [...worker.capabilities], targetTypes: [...worker.targetTypes] }));
}

export function getAgenticWorker(name: string): AgenticWorkerDefinition | null {
  const worker = WORKER_MAP.get(name);
  return worker ? { ...worker, capabilities: [...worker.capabilities], targetTypes: [...worker.targetTypes] } : null;
}

export function workersForTarget(targetType: AgenticTargetType): AgenticWorkerDefinition[] {
  return listAgenticWorkers().filter((worker) => worker.targetTypes.includes(targetType));
}

export function workerCanHandle(name: string, targetType: AgenticTargetType, capability?: string): boolean {
  const worker = WORKER_MAP.get(name);
  if (!worker || !worker.targetTypes.includes(targetType)) return false;
  return capability ? worker.capabilities.includes(capability) : true;
}
