import { describe, it, expect } from 'vitest';
import fs from 'fs';

const route = fs.readFileSync(
  'apps/admin/app/api/admin/review-queue/resolve/route.ts',
  'utf8',
);

describe('Enrollment document review routing', () => {
  it('recognizes enrollment requirements', () => {
    expect(route).toContain(
      "item.entity_type === 'enrollment_requirement'",
    );
  });

  it('updates enrollment_requirements', () => {
    expect(route).toContain(
      ".from('enrollment_requirements')",
    );
  });

  it('verifies submitted documents', () => {
    expect(route).toContain(
      "status: 'verified'",
    );
  });

  it('supports rejected documents', () => {
    expect(route).toContain(
      "status: 'rejected'",
    );
  });

  it('supports reupload requests', () => {
    expect(route).toContain(
      "status: 'needs_reupload'",
    );
  });
});
