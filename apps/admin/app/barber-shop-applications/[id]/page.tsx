import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import BarberShopApplicationActions from './BarberShopApplicationActions';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Barbershop Application ${id.slice(0, 8)} | Admin` };
}

export default async function BarberShopApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: app } = await db
    .from('barbershop_partner_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!app) notFound();

  const fields: [string, unknown][] = [
    ['Shop Legal Name', app.shop_legal_name],
    ['DBA Name', app.shop_dba_name],
    ['Owner Name', app.owner_name],
    ['Contact Name', app.contact_name],
    ['Contact Email', app.contact_email],
    ['Contact Phone', app.contact_phone],
    ['Address', [app.shop_address, app.shop_city, app.shop_state, app.shop_zip].filter(Boolean).join(', ')],
    ['License Number', app.barber_license_number],
    ['License State', app.license_state],
    ['License Expiry', app.license_expiry],
    ['Number of Chairs', app.num_chairs],
    ['Apprentice Capacity', app.apprentice_capacity],
    ['Status', app.status],
    ['Submitted', app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'],
    ['Notes', app.notes],
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Barbershop Applications', href: '/admin/barber-shop-applications' },
          { label: app.shop_legal_name ?? id },
        ]} />

        <div className="flex items-center justify-between mt-6 mb-8">
          <div>
            <Link href="/admin/barber-shop-applications" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Applications
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{app.shop_legal_name}</h1>
            <p className="text-slate-500 text-sm mt-1">{app.contact_email}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            app.status === 'approved' ? 'bg-green-100 text-green-700' :
            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {app.status}
          </span>
        </div>

        {/* Application details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Application Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {fields.map(([label, value]) => value ? (
              <div key={label as string}>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label as string}</dt>
                <dd className="mt-1 text-sm text-slate-900">{String(value)}</dd>
              </div>
            ) : null)}
          </dl>
        </div>

        {/* Actions */}
        <BarberShopApplicationActions
          applicationId={id}
          currentStatus={app.status as string}
          currentNotes={app.notes as string ?? null}
        />
      </div>
    </div>
  );
}
