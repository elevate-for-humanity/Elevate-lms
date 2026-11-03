import { expect, it } from 'vitest';
import { hostShopPreviewMemberId } from '@/lib/partners/host-shop-preview-member';

it('uses the owner before an older administrator and keeps legacy links usable', () => {
  const supervisor = { user_id: 's', role: 'supervisor' };
  const admin = { user_id: 'a', role: 'partner_admin' };
  const owner = { user_id: 'o', role: 'owner' };
  expect(hostShopPreviewMemberId([supervisor, admin, owner])).toBe('o');
  expect(hostShopPreviewMemberId([supervisor, admin])).toBe('a');
  expect(hostShopPreviewMemberId([supervisor])).toBe('s');
  expect(hostShopPreviewMemberId([])).toBeNull();
});
