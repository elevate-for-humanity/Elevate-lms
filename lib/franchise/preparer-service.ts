import { createAdminClient } from '@/lib/supabase/admin';

export interface Preparer { id: string; name: string; email: string; efin: string; office_id: string; is_active: boolean; }

export const preparerService = {
  getPreparer: async (preparerId: string) => {
    const admin = createAdminClient();
    const { data } = await admin.from('preparers').select('*').eq('id', preparerId).single();
    return data;
  },
  listPreparers: async (officeId?: string) => {
    const admin = createAdminClient();
    let query = admin.from('preparers').select('*');
    if (officeId) query = query.eq('office_id', officeId);
    const { data } = await query;
    return data || [];
  },
  createPreparer: async (preparer: Partial<Preparer>) => {
    const admin = createAdminClient();
    const { data, error } = await admin.from('preparers').insert(preparer).select().single();
    if (error) throw error;
    return data;
  },
  updatePreparer: async (preparerId: string, updates: Record<string, unknown>, _userId?: string) => {
    const admin = createAdminClient();
    const { data, error } = await admin.from('preparers').update(updates).eq('id', preparerId).select().single();
    if (error) throw error;
    return data;
  },
  deactivatePreparer: async (preparerId: string, _userId?: string) => {
    const admin = createAdminClient();
    const { data, error } = await admin.from('preparers').update({ is_active: false }).eq('id', preparerId).select().single();
    if (error) throw error;
    return data;
  },
  getPreparerStats: async (preparerId: string) => {
    return { totalReturns: 0, totalFees: 0, thisYear: 0 };
  },
};