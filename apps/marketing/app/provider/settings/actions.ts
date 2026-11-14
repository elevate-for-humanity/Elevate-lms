'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProviderPortal } from '@/lib/auth/provider-access';
import { requireAdminClient } from '@/lib/supabase/admin';

const optionalText = (max: number) => z.string().trim().max(max).nullable();
const profileValues = z.object({
  name: z.string().trim().min(1).max(200),
  tagline: optionalText(500),
  support_email: z.string().email().max(254).nullable(),
  website: z.string().url().refine(value => /^https?:\/\//i.test(value)).nullable(),
  phone: optionalText(40), address: optionalText(200), city: optionalText(100),
  state: optionalText(100), zip: optionalText(20),
  logo_url: z.string().url().refine(value => /^https?:\/\//i.test(value)).nullable(),
});

export async function saveProviderOrganization(tenantId: string, orgId: string | null, input: unknown) {
  if (!z.string().uuid().safeParse(tenantId).success || (orgId && !z.string().uuid().safeParse(orgId).success)) throw new Error('Invalid organization selection.');
  const access = await requireProviderPortal(tenantId);
  if (access.tenantId !== tenantId || access.platformWide) throw new Error('Organization access denied.');
  const values = profileValues.parse(input);
  // RLS deliberately does not grant arbitrary organization updates to members.
  // This scoped action permits only these profile fields after portal authorization.
  const db = await requireAdminClient();
  if (orgId) {
    const { data, error } = await db.from('organizations').update(values)
      .eq('id', orgId).eq('tenant_id', access.tenantId).select('id').maybeSingle();
    if (error) throw new Error('Organization profile could not be saved.');
    if (!data) throw new Error('Organization was not found in your tenant.');
  } else {
    const { data: existing, error: lookupError } = await db.from('organizations').select('id')
      .eq('tenant_id', access.tenantId).limit(1).maybeSingle();
    if (lookupError) throw new Error('Organization could not be verified.');
    if (existing) throw new Error('An organization already exists. Reload settings before saving.');
    const slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const { error } = await db.from('organizations').insert({ ...values, tenant_id: access.tenantId,
      slug: `${slug || 'provider'}-${tenantId.slice(0, 8)}`, status: 'active', type: 'training_provider' });
    if (error) throw new Error('Organization profile could not be created.');
  }
  revalidatePath('/provider/settings');
}
