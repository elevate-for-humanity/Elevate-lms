import { describe, expect, it } from 'vitest';
import {
  EMPTY_CREDENTIAL_REGISTRY_RECORD,
  toCredentialRegistryCsv,
  validateCredentialRegistryRecord,
} from '@/lib/course-builder/credential-registry';

const complete = {
  ...EMPTY_CREDENTIAL_REGISTRY_RECORD,
  credentialName: 'HVAC Technician Certificate',
  credentialType: 'Certificate' as const,
  description: 'A workforce training credential covering safe HVAC installation, service, diagnostics, and documented hands-on competencies.',
  subjectWebpage: 'https://www.elevateforhumanity.org/programs/hvac-technician',
  deliveryType: 'Hybrid' as const,
  durationHours: 160,
  entryRequirements: 'Applicants must be at least 18 and meet published enrollment requirements.',
  assessmentRequirements: 'Learners complete written examinations and observed practical assessments.',
  completionRequirements: 'Complete all required hours, competencies, assessments, and attendance requirements.',
  competencies: ['HVAC safety', 'System diagnostics'],
  occupations: ['Heating, Air Conditioning, and Refrigeration Mechanics and Installers'],
};

describe('Credential Registry builder contract', () => {
  it('reports missing publishing data', () => {
    const result = validateCredentialRegistryRecord(EMPTY_CREDENTIAL_REGISTRY_RECORD);
    expect(result.ready).toBe(false);
    expect(result.missing).toContain('Credential name');
    expect(result.missing).toContain('Skills and competencies');
  });

  it('marks a complete record ready', () => {
    expect(validateCredentialRegistryRecord(complete).ready).toBe(true);
  });

  it('exports quoted CSV and pipe-delimited lists', () => {
    const csv = toCredentialRegistryCsv([complete]);
    expect(csv).toContain('"Credential Name"');
    expect(csv).toContain('"HVAC safety|System diagnostics"');
  });
});
