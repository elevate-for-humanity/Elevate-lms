import { describe, it, expect } from 'vitest';
import { mapAuthError } from '@/lib/auth/map-auth-error';

describe('mapAuthError', () => {
  it('maps Supabase rate limit to actionable copy', () => {
    expect(mapAuthError('Request rate limit reached')).toContain('Too many sign-in attempts');
  });

  it('maps invalid credentials', () => {
    expect(mapAuthError('Invalid login credentials')).toContain('Invalid email or password');
  });
});
