import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
import { GET } from '../../apps/lms/app/enrollment/training-registration/route';

describe('school registration behind the production proxy', () => {
  it('uses the public login rather than the internal Next server origin', async () => {
    const id = 'fb36dbf1-db3c-4d34-adf9-3f98f397d371';
    const response = await GET(new NextRequest(`https://0.0.0.0:3000/enrollment/training-registration?enrollment_id=${id}`));
    const location = new URL(response.headers.get('location')!);
    expect(response.status).toBe(307);
    expect(location.origin).toBe('https://app.elevateforhumanity.org');
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('redirect')).toBe(`/enrollment/training-registration?enrollment_id=${id}`);
  });
});
