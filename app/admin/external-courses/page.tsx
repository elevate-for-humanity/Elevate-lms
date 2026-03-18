import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExternalCourseStripeTable from './ExternalCourseStripeTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'External Courses — Stripe Pricing' };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/admin/external-courses');
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }
  return user;
}

export default async function ExternalCoursesAdminPage() {
  await requireAdmin();

  const db = createAdminClient();

  const { data: items } = await db
    .from('program_external_courses')
    .select(`
      id,
      partner_name,
      title,
      is_required,
      cost_cents,
      payer_rule,
      stripe_product_id,
      stripe_price_id,
      is_active,
      programs ( id, title, slug )
    `)
    .eq('is_active', true)
    .order('partner_name')
    .order('title');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">External Courses — Stripe Pricing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Set cost and payer rule for each partner course, then sync to Stripe.
          Rows with no cost_cents show no payment button to learners.
        </p>
      </div>

      <ExternalCourseStripeTable items={items ?? []} />
    </div>
  );
}
