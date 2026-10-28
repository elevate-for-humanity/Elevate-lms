// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { ensureHostShopOwnerAccess } from '@/lib/partners/provision-host-shop-application';
import type { SupabaseClient } from '@supabase/supabase-js';
it.each(['employer', 'student', 'admin'])('preserves an existing %s identity while adding scoped shop membership', async (role) => {
 const update = vi.fn(); const upsert = vi.fn().mockResolvedValue({ error: null });
 const db = { from: (table: string) => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'existing-user', role }, error: null }), update, upsert };
  return query;
 } } as unknown as SupabaseClient;
 const result = await ensureHostShopOwnerAccess({ db, partnerId: 'shop-id', email: 'owner@example.com', contactName: 'Unverified Intake Name' });
 expect(result).toEqual({ userId: 'existing-user', isNewUser: false });
 expect(update).not.toHaveBeenCalled();
 expect(upsert).toHaveBeenCalledWith({ user_id: 'existing-user', partner_id: 'shop-id', role: 'partner_admin', status: 'active' }, { onConflict: 'user_id,partner_id' });
});
it('recovers an existing Auth account beyond the first page when its profile is missing', async () => {
 const insert = vi.fn().mockResolvedValue({ error: null });
 const upsert = vi.fn().mockResolvedValue({ error: null });
 const listUsers = vi.fn().mockImplementation(async ({ page }: { page: number }) => ({ data: { users: page === 1 ? Array.from({ length: 1000 }, (_, i) => ({ id: `other-${i}`, email: `other-${i}@example.com` })) : [{ id: 'existing-auth-user', email: 'owner@example.com' }] }, error: null }));
 const createUser = vi.fn();
 const db = { auth: { admin: { listUsers, createUser } }, from: () => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null, error: null }), insert, upsert };
  return query;
 } } as unknown as SupabaseClient;
 const result = await ensureHostShopOwnerAccess({ db, partnerId: 'shop-id', email: 'owner@example.com', contactName: 'Owner' });
 expect(result.userId).toBe('existing-auth-user');
 expect(listUsers).toHaveBeenCalledTimes(2); expect(createUser).not.toHaveBeenCalled();
 expect(insert).toHaveBeenCalledWith(expect.objectContaining({ id: 'existing-auth-user', role: 'partner' }));
});
