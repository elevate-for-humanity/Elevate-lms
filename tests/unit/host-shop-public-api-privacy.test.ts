import { NextRequest } from 'next/server';
import { expect, it, vi } from 'vitest';

vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/programs/host-shops', () => ({
  getApprovedShops: async () => [{
    id: 'approved-shop',
    name: 'Approved Shop',
    address: '1 Main St',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46201',
    phone: '3175550100',
    email: 'private-application-contact@example.test',
    supervisor: 'Private Supervisor',
    programs: ['barber-apprenticeship'],
    badge: 'partner',
  }],
}));

import { GET } from '@/apps/marketing/app/api/programs/host-shops/route';

it('omits operational application contacts from the public host-shop API', async () => {
  const response = await GET(new NextRequest('https://www.elevateforhumanity.org/api/programs/host-shops'));
  const body = await response.json();

  expect(body.shops).toEqual([expect.objectContaining({ id: 'approved-shop' })]);
  expect(body.shops[0]).not.toHaveProperty('email');
  expect(body.shops[0]).not.toHaveProperty('supervisor');
});
