import type { CredentialRegistryRecord } from './credential-registry';

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(list);
  if (typeof value !== 'string' || !value.trim()) return [];
  const text = value.trim();
  if (text.startsWith('{') && text.endsWith('}')) {
    return [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(match => match[1].replace(/\\"/g, '"'));
  }
  return text.split(/\n|\|/).map(item => item.trim()).filter(Boolean);
}
function text(value: unknown) { return list(value).join('\n'); }
function number(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}
/** Map supplied facts only. Course duration and credential identity remain course scoped. */
export function registryFacts(course: Record<string, any>, program: Record<string, any> = {}): Partial<CredentialRegistryRecord> {
  const facts: Partial<CredentialRegistryRecord> = {};
  const put = (key: keyof CredentialRegistryRecord, value: any) => {
    if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length)) Object.assign(facts, {[key]: value});
  };
  put('credentialName', course.title);
  put('description', course.description || course.short_description);
  put('durationHours', number(course.duration_hours));
  put('durationWeeks', number(course.duration_weeks));
  put('estimatedCost', number(course.tuition_cost));
  const config = program.lms_config || {};
  const path = config.public_page_path;
  if (typeof path === 'string' && /^\/programs\/[a-z0-9-/]+$/.test(path)) put('subjectWebpage', 'https://www.elevateforhumanity.org' + path);
  const delivery = String(program.delivery_method || program.delivery_mode || '').toLowerCase().replace(/[_-]/g, ' ');
  if (/hybrid|blended/.test(delivery)) put('deliveryType', 'Hybrid');
  else if (/online|remote|virtual/.test(delivery)) put('deliveryType', 'Online Only');
  else if (/in person|classroom|onsite|on site/.test(delivery)) put('deliveryType', 'In Person');
  // A linked state license is not the credential issued for an individual RTI course.
  const registry = course.metadata?.credential_registry || {};
  const type = String(registry.credentialType || '').toLowerCase();
  for (const candidate of ['Certificate', 'Certification', 'Diploma', 'Degree', 'Badge', 'License'] as const) {
    if (new RegExp('\\b' + candidate.toLowerCase() + '\\b').test(type)) put('credentialType', candidate);
  }
  put('entryRequirements', text(course.prerequisites) || text(program.prerequisites));
  put('competencies', list(course.learning_outcomes).length ? list(course.learning_outcomes) : list(program.what_you_learn));
  put('occupations', list(program.career_outcomes));
  put('financialAssistance', text(program.funding_tags) || text(program.funding_pathways));
  // Explicit record fields take precedence; never infer approval or credential ownership.
  for (const [key, value] of Object.entries(registry)) {
    if (['ctid','organizationCtid','credentialName','description','subjectWebpage','owningOrganization','offeredBy','assessmentRequirements','completionRequirements','approvalAgency','approvalIdentifier'].includes(key)) put(key as keyof CredentialRegistryRecord, value);
  }
  return facts;
}
