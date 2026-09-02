import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

describe('apprentice self-service portal contracts', () => {
  it('sends the handbook action accepted by the API', () => {
    const client = source('apps/lms/app/apprentice/handbook/AcknowledgeHandbookButton.tsx');
    expect(client).toContain("action: 'acknowledge'");
    expect(client).toContain("handbookVersion: '2025.1'");
  });

  it('reads protected document configuration through the authenticated server route', () => {
    const route = source('apps/lms/app/api/apprentice/documents/route.ts');
    expect(route).toMatch(/db\s*\.from\('apprentice_document_types'\)/);
    expect(route).toContain('resolveEnrollment(db, user.id, programSlug)');
    expect(route).toMatch(/db\.storage\s*\.from\('documents'\)\s*\.upload/);
  });

  it('resolves billing ownership through either canonical learner identity column', () => {
    for (const path of [
      'apps/lms/app/api/billing/setup/route.ts',
      'apps/lms/app/api/billing/portal/route.ts',
    ]) {
      expect(source(path)).toContain('.or(`user_id.eq.${user.id},student_id.eq.${user.id}`)');
    }
  });
});
