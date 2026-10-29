import { createClient } from '@supabase/supabase-js';
import { beforeEach, expect, it, vi } from 'vitest';
import { AWARD_DEFINITION, PUBLIC_AWARD_DEFINITION, awardBadgeImage } from '@/lib/credentials/award-definition';

const state = vi.hoisted(() => ({ db: null as any, requests: [] as URL[] }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => state.db }));
import { GET } from '@/apps/marketing/app/api/credentials/[verificationCode]/route';

beforeEach(() => {
  state.requests = [];
  state.db = createClient('https://fixture.supabase.co', 'fixture-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      const url = new URL(String(input)); state.requests.push(url);
      const select = url.searchParams.get('select') ?? '';
      if (!select.includes('credentials:credential_registry') || /partner_id|badge_image_url/.test(select))
        return new Response(JSON.stringify({ code: 'PGRST200', message: 'Unsupported legacy definition join' }), { status: 400 });
      const row = { id: 'award', verification_code: 'public-code', status: 'active', expires_at: null,
        revoked_at: null, open_badge_status: 'not_issued', badge_url: null,
        credentials: { name: 'Verified skill', description: 'Actual recorded qualification', issuer_type: 'elevate_issued' } };
      return new Response(JSON.stringify(url.searchParams.has('verification_code') ? row : [row]), { headers: { 'content-type': 'application/json' } });
    } },
  });
});

it.each([AWARD_DEFINITION, PUBLIC_AWARD_DEFINITION])('reads award definitions using available canonical fields (%s)', async projection => {
  const result = await state.db.from('learner_credentials').select(`id,${projection}`).eq('learner_id', 'selected-learner');
  expect(result.error).toBeNull();
  expect(result.data[0].credentials.name).toBe('Verified skill');
  expect(state.requests[0].searchParams.get('learner_id')).toBe('eq.selected-learner');
});

it('verifies a public code through the actual route without asserting an unsigned badge is cryptographically verifiable', async () => {
  const response = await GET(new Request('https://www.elevateforhumanity.org/api/credentials/public-code'),
    { params: Promise.resolve({ verificationCode: 'public-code' }) });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ credential: 'Verified skill', status: 'active', verifiableCredentialAvailable: false });
  expect(state.requests[0].searchParams.get('verification_code')).toBe('eq.public-code');
  expect(state.requests[0].searchParams.get('select')).not.toContain('learner_id');
});

it('only reads a nonempty badge image from the registry metadata', () => {
  expect(awardBadgeImage({ metadata: { badge_image_url: 'https://images.example.test/badge.png' } })).toBe('https://images.example.test/badge.png');
  for (const metadata of [null, [], 'image', { badge_image_url: 123 }, { badge_image_url: ' ' }])
    expect(awardBadgeImage({ metadata })).toBeNull();
});
