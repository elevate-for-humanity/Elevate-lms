import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EmployerProposalPreview } from '@/components/admin/EmployerProposalPreview';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Employer Proposal | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'View and manage employer partnership proposals.',
};

export default async function EmployerProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'super_admin']);
  const { id } = await params;

  const adminClient = await requireAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  const { data: row } = await db
    .from('employers')
    .select('id, name, contact_name, contact_email, contact_phone, city, state, website, notes')
    .eq('id', id)
    .maybeSingle();

  if (!row) notFound();

  // Map DB row to the Employer shape expected by EmployerProposalPreview
  const employer = {
    id: row.id,
    name: row.name ?? 'Unknown Employer',
    contactName: row.contact_name ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    website: row.website ?? undefined,
    notes: row.notes ?? undefined,
    interestedPrograms: [],
    tags: [] as any[],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-slate-600">
            <li>
              <Link href="/admin" className="hover:text-slate-900">
                Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/admin/employers" className="hover:text-slate-900">
                Employers
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/admin/employers/${id}`} className="hover:text-slate-900">
                {employer.name}
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Proposal</li>
          </ol>
        </nav>
        <EmployerProposalPreview employer={employer} />
      </div>
    </div>
  );
}
