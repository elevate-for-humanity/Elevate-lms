/**
 * Payment-denial enforcement: admin suspend lever.
 *
 * profiles.status alone does NOT block LMS access — no LMS guard reads it.
 * The admin "suspend user" endpoint must therefore also write the columns
 * the guards in lib/auth actually check (suspended / is_active). These
 * tests pin that mapping and the route wiring.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { resolveProfileAccessUpdate } from '@/lib/admin/profile-access';

const ROUTE_SRC = fs.readFileSync(
  path.resolve('apps/admin/app/api/admin/users/update-status/route.ts'),
  'utf-8',
);

describe('resolveProfileAccessUpdate', () => {
  it('suspending sets suspended=true and is_active=false', () => {
    expect(resolveProfileAccessUpdate('suspended')).toEqual({
      status: 'suspended',
      suspended: true,
      is_active: false,
    });
  });

  it('re-activating clears suspended and restores is_active', () => {
    expect(resolveProfileAccessUpdate('active')).toEqual({
      status: 'active',
      suspended: false,
      is_active: true,
    });
  });

  it('inactivating clears is_active without touching suspended', () => {
    const update = resolveProfileAccessUpdate('inactive');
    expect(update.status).toBe('inactive');
    expect(update.is_active).toBe(false);
    expect(update).not.toHaveProperty('suspended');
  });

  it('keeps the profiles.status write for every status', () => {
    for (const status of ['active', 'inactive', 'suspended'] as const) {
      expect(resolveProfileAccessUpdate(status).status).toBe(status);
    }
  });
});

describe('update-status route wiring', () => {
  it('writes the guard-read columns, not just profiles.status', () => {
    expect(ROUTE_SRC).toContain('resolveProfileAccessUpdate');
    expect(ROUTE_SRC).toContain("from('profiles')");
    // The update payload must come from the mapping, not a bare { status }.
    expect(ROUTE_SRC).toMatch(/\.update\(\{\s*\.\.\.resolveProfileAccessUpdate\(status\)/);
    expect(ROUTE_SRC).not.toMatch(/\.update\(\{\s*status,\s*updated_at/);
  });

  it('still accepts the suspended status value', () => {
    expect(ROUTE_SRC).toContain("'suspended'");
  });
});
