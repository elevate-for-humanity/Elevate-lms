'use server';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { redirect } from 'next/navigation';
export async function saveEmployerProfile(form: FormData) {
  const { user } = await requireRole(['employer', 'sponsor']);
  const db = await createClient();
  const employer = await getEmployerRecord(db, user.id);
  if (!employer) throw new Error('Employer account is not linked. Contact support.');
  const field = (key: string, max = 200) =>
    String(form.get(key) || '')
      .trim()
      .slice(0, max);
  const company = field('company_name');
  if (!company) throw new Error('Company name is required.');
  const website = field('website_url', 500);
  if (website && !/^https?:\/\//i.test(website))
    throw new Error('Website must begin with https:// or http://.');
  const { data, error } = await db
    .from('employers')
    .update({
      company_name: company,
      business_name: company,
      contact_name: field('contact_name'),
      phone: field('phone', 40),
      contact_phone: field('phone', 40),
      industry: field('industry'),
      company_size: field('company_size', 50),
      city: field('city'),
      state: field('state', 2).toUpperCase(),
      zip: field('zip', 12),
      website_url: website || null,
      description: field('description', 4000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', employer.id)
    .eq('owner_user_id', user.id)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new Error('Profile could not be saved. Please retry.');
  redirect('/employer/settings?saved=1');
}
