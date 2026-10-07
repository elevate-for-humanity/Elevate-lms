import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();
const canonicalPath = path.join(root, 'apps/marketing/app/api/webhooks/stripe/route.ts');
const lmsAdapterPath = path.join(root, 'apps/lms/app/api/webhooks/stripe/route.ts');
const retiredSingular = path.join(root, 'app/api/license/webhook/route.ts');
const retiredPlural = path.join(root, 'app/api/licenses/webhook/route.ts');

describe('Retired Stripe webhook ownership', () => {
  it('cannot create license mutations through retired Marketing or LMS webhook routes', () => {
    expect(fs.existsSync(canonicalPath)).toBe(false);
    expect(fs.existsSync(lmsAdapterPath)).toBe(false);
  });

  it('does not retain retired license webhook aliases', () => {
    expect(fs.existsSync(retiredSingular)).toBe(false);
    expect(fs.existsSync(retiredPlural)).toBe(false);
  });
});
