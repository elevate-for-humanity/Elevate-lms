import { NextRequest } from 'next/server';
import { expect, it, vi } from 'vitest';
import { GET } from '@/apps/admin/app/api/admin/dev-studio/conversations/route';

vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: async () => ({ id: 'owner' }) }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      let fields = '*';
      const filters: Record<string, string> = {};
      const query = {
        select(value: string) {
          fields = value;
          return query;
        },
        eq(key: string, value: string) {
          filters[key] = value;
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return query;
        },
        then(resolve: (result: unknown) => void) {
          const rows = [
            {
              id: 'owned',
              user_id: 'owner',
              title: 'Reviewed sample',
              updated_at: '2026-10-03',
              messages: ['owned message'],
            },
            {
              id: 'other',
              user_id: 'another-owner',
              title: 'Private',
              updated_at: '2026-10-03',
              messages: ['private message'],
            },
          ].filter((row) =>
            Object.entries(filters).every(([key, value]) => row[key as keyof typeof row] === value),
          );
          resolve({
            error: null,
            data:
              fields === '*'
                ? rows
                : rows.map(({ id, title, updated_at }) => ({ id, title, updated_at })),
          });
        },
      };
      return query;
    },
  }),
}));

it('lists only owned conversation metadata for the sidebar', async () => {
  const response = await GET(
    new NextRequest(
      'https://admin.elevateforhumanity.org/api/admin/dev-studio/conversations?summary=1',
    ),
  );
  expect(await response.json()).toEqual({
    conversations: [{ id: 'owned', title: 'Reviewed sample', updated_at: '2026-10-03' }],
  });
});
it('returns the selected owned conversation with its stored messages', async () => {
  const response = await GET(
    new NextRequest(
      'https://admin.elevateforhumanity.org/api/admin/dev-studio/conversations?id=owned',
    ),
  );
  expect((await response.json()).conversations[0].messages).toEqual(['owned message']);
});
it('cannot restore a conversation belonging to another account', async () => {
  const response = await GET(
    new NextRequest(
      'https://admin.elevateforhumanity.org/api/admin/dev-studio/conversations?id=other',
    ),
  );
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: 'Conversation not found' });
});
