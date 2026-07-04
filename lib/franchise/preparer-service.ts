import { createAdminClient } from '@/lib/supabase/admin';

export interface Preparer {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

export interface PreparerStats {
  total_returns: number;
  completed_returns: number;
  pending_returns: number;
}

export interface CreatePreparerInput {
  name: string;
  email: string;
}

export const preparerService = {
  getPreparer: async (preparerId: string) => {
    const admin = createAdminClient();
    const { data } = await admin.from('preparers').select('*').eq('id', preparerId).single();
    return data;
  },
  listPreparers: async (options?: { officeId?: string; status?: string; limit?: number; offset?: number }) => {
    const admin = createAdminClient();
    let query = admin.from('preparers').select('*');
    if (options?.officeId) {
      query = query.eq('office_id', options.officeId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    const { data } = await query;
    return data || [];
  },
  createPreparer: async (input: CreatePreparerInput & { office_id?: string; ptin?: string; first_name?: string; last_name?: string }) => {
    const admin = createAdminClient();
    const { data, error } = await admin.from('preparers').insert(input).select().single();
    if (error) throw error;
    return data;
  },
  updatePreparer: async (preparerId: string, updates: Record<string, unknown>, _userId: string) => {
    const admin = createAdminClient();
    const { data, error } = await admin.from('preparers').update(updates).eq('id', preparerId).select().single();
    if (error) throw error;
    return data;
  },
  deactivatePreparer: async (preparerId: string, _userId: string) => {
    const admin = createAdminClient();
    const { data, error } = await admin.from('preparers').update({ is_active: false }).eq('id', preparerId).select().single();
    if (error) throw error;
    return data;
  },
  getPreparerStats: async (preparerId: string): Promise<PreparerStats> => {
    return { total_returns: 0, completed_returns: 0, pending_returns: 0 };
  },
};