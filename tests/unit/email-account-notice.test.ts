import { expect, it, vi } from 'vitest';
import { EmailAccountNotice } from '@/components/communications/EmailAccountNotice';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: vi.fn() }));

it('keeps the optional notice from breaking the dashboard when its database is unavailable', async () => {
  vi.mocked(requireAdminClient).mockRejectedValueOnce(new Error('Database unavailable'));
  await expect(EmailAccountNotice({ href: '/phone/email', userId: 'admin', personalOnly: true }))
    .resolves.toBeNull();
  expect(createClient).not.toHaveBeenCalled();
});
