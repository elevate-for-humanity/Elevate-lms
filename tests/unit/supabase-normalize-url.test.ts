import { describe, expect, it } from 'vitest';
import {
  applyNormalizedSupabaseUrlToEnv,
  normalizeSupabaseProjectUrl,
} from '@/lib/supabase/normalize-url';

describe('normalizeSupabaseProjectUrl', () => {
  it('fixes db. hostname misconfig', () => {
    expect(
      normalizeSupabaseProjectUrl('db.cuxzzpsyufcewtmicszk.supabase.co'),
    ).toBe('https://cuxzzpsyufcewtmicszk.supabase.co');
  });

  it('adds https when missing', () => {
    expect(normalizeSupabaseProjectUrl('cuxzzpsyufcewtmicszk.supabase.co')).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co',
    );
  });

  it('preserves valid https URL', () => {
    expect(
      normalizeSupabaseProjectUrl('https://cuxzzpsyufcewtmicszk.supabase.co'),
    ).toBe('https://cuxzzpsyufcewtmicszk.supabase.co');
  });
});

describe('applyNormalizedSupabaseUrlToEnv', () => {
  it('rewrites NEXT_PUBLIC_SUPABASE_URL in process.env', () => {
    const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'db.cuxzzpsyufcewtmicszk.supabase.co';
    applyNormalizedSupabaseUrlToEnv();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co',
    );
    process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
  });
});
