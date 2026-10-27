import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('document upload notification route contract', () => {
  it('routes staff reviewers to the canonical Admin document queue', () => {
    const source = readFileSync('lib/notifications/email.ts', 'utf8');

    expect(source).toContain("adminUrl('/documents/review')");
    expect(source).not.toContain(
      "'Open the administrative document-review queue to review the submission.',\n    ));",
    );
  });
});
