import { createAdminClient } from '@/lib/supabase/admin';

export const preparerService = {
  getPreparer: async (preparerId: string) => {
    const admin = createAdminClient();
    const { data } = await admin.from('preparers').select('*').eq('id', preparerId).single();
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
};