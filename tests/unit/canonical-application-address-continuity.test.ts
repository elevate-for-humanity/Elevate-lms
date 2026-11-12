import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const route = readFileSync(join(root, 'apps/marketing/app/api/applications/route.ts'), 'utf8');
const action = readFileSync(join(root, 'apps/marketing/app/apply/actions.ts'), 'utf8');
const form = readFileSync(join(root, 'apps/marketing/app/apply/student/StudentApplicationForm.tsx'), 'utf8');

describe('canonical application contact and identity continuity', () => {
  it('collects DOB and address in the existing student intake form', () => {
    expect(form).toContain('dateOfBirth: string');
    expect(form).toContain('address: string');
    expect(form).toContain('dateOfBirth: form.dateOfBirth');
    expect(form).toContain('address: form.address');
  });

  it('passes optional fields from compatibility actions through the canonical endpoint', () => {
    expect(action).toContain('dateOfBirth: data.dateOfBirth?.trim()');
    expect(action).toContain('address: data.address?.trim()');
    expect(action).toContain('city: data.city?.trim()');
    expect(action).toContain('state: data.state?.trim()');
  });

  it('persists DOB, address and state in the canonical insert payload', () => {
    const payloadStart = route.indexOf('const corePayload: Record<string, any> = {');
    const payloadEnd = route.indexOf('\n    };', payloadStart);
    expect(payloadStart).toBeGreaterThan(0);
    expect(payloadEnd).toBeGreaterThan(payloadStart);
    const payload = route.slice(payloadStart, payloadEnd);
    expect(payload).toContain('date_of_birth: body.dateOfBirth || null');
    expect(payload).toContain('address: body.address || null');
    expect(payload).toContain('state: body.state || null');
    expect(payload).toContain('source: body.source ||');
    expect(route).toContain(".from('applications').insert(corePayload)");
  });
});
