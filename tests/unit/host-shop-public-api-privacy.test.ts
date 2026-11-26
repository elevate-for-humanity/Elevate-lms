import { readFileSync } from 'node:fs';
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
    internalMemo: 'Private operational metadata',
    programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    website: 'https://shop.example.test',
    badge: 'partner',
  }],
}));

import { GET } from '@/apps/marketing/app/api/programs/host-shops/route';

it('omits operational application contacts from the public host-shop API', async () => {
  const response = await GET(new NextRequest('https://www.elevateforhumanity.org/api/programs/host-shops'));
  const body = await response.json();

  expect(body.shops).toEqual([{
    id: 'approved-shop',
    name: 'Approved Shop',
    address: '1 Main St',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46201',
    phone: '3175550100',
    programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    badge: 'partner',
    website: 'https://shop.example.test',
  }]);
  expect(body.shops[0]).not.toHaveProperty('email');
  expect(body.shops[0]).not.toHaveProperty('supervisor');
  expect(body.shops[0]).not.toHaveProperty('internalMemo');
});

it('never renders operational contact fields in the public profile source', () => {
  const source = readFileSync(
    new URL('../../apps/marketing/app/host-shops/[slug]/page.tsx', import.meta.url),
    'utf8',
  );
  expect(source).not.toMatch(/\b(?:approved|shop)\.(?:email|supervisor)\b/);
});
