import { readFileSync } from 'node:fs';

const route = readFileSync(
  'apps/admin/app/api/admin/program-holders/reset-login/route.ts',
  'utf8',
);

describe('program-holder credential reset boundary', () => {
  it('uses the canonical credential verifier instead of importing Supabase directly', () => {
    expect(route).toContain("@/lib/supabase/credential-verifier");
    expect(route).not.toContain("from '@supabase/supabase-js'");
  });

  it('does not greet an unknown contact with a hard-coded person name', () => {
    expect(route).toContain("holder.contact_name || 'Program Holder'");
    expect(route).not.toContain("holder.contact_name || 'David'");
  });
});
