import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();
const canonicalPath = path.join(root, 'apps/marketing/app/api/webhooks/stripe/route.ts');
const lmsAdapterPath = path.join(root, 'apps/lms/app/api/webhooks/stripe/route.ts');
const retiredSingular = path.join(root, 'app/api/license/webhook/route.ts');
const retiredPlural = path.join(root, 'app/api/licenses/webhook/route.ts');

describe('Canonical Stripe webhook ownership', () => {
  it('does not retain Stripe writers or forward Stripe through the generic provider adapter', () => {
    expect(fs.existsSync(canonicalPath)).toBe(false);
    expect(fs.existsSync(lmsAdapterPath)).toBe(false);
    for (const app of ['marketing', 'lms']) {
      const generic = fs.readFileSync(path.join(root, `apps/${app}/app/api/webhooks/[provider]/route.ts`), 'utf8');
      const targets = generic.slice(generic.indexOf('const PROVIDER_TARGETS'), generic.indexOf('const FORWARDED'));
      expect(targets).not.toMatch(/stripe/i);
    }
  });

  it('does not retain retired license webhook aliases', () => {
    expect(fs.existsSync(retiredSingular)).toBe(false);
    expect(fs.existsSync(retiredPlural)).toBe(false);
  });
});
