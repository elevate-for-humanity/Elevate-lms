import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export const metadata: Metadata = { title: 'Org Profile | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      {value ? (
        <p className="text-sm text-slate-900 font-medium">{value}</p>
      ) : (
        <p className="text-sm text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Not set</p>
      )}
    </div>
  );
}

export default async function OrgProfilePage() {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/submissions/org');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db
    .from('sos_organizations')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: orgProfile } = org
    ? await db.from('sos_organization_profiles').select('*').eq('organization_id', org.id).maybeSingle()
    : { data: null };

  const samOk = org?.sam_status === 'active';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Organization Profile</h1>
              <p className="text-slate-500 text-sm">Legal identity used in all submission packets</p>
            </div>
          </div>
          <Link href="/admin/submissions/org/edit" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            Edit
          </Link>
        </div>

        {!org ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="font-semibold text-amber-900 mb-1">No organization record found</p>
            <p className="text-sm text-amber-700 mb-4">Apply the Submissions OS migrations, then add your organization.</p>
            <Link href="/admin/submissions/org/edit" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition">
              Add Organization
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Identity */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Legal Identity</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Legal Name" value={org.legal_name} />
                <Field label="DBA Name" value={org.dba_name} />
                <Field label="EIN" value={org.ein} />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">UEI (SAM.gov)</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-900 font-medium">{org.uei || <span className="text-amber-600">Not set</span>}</p>
                    {org.uei && (
                      <a href={`https://sam.gov/entity/${org.uei}`} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:text-brand-blue-700">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">SAM Status</p>
                  {samOk ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Active
                      {org.sam_expiration && <span className="text-slate-400 font-normal ml-1">· expires {new Date(org.sam_expiration).toLocaleDateString()}</span>}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-amber-700 font-semibold">
                      <AlertTriangle className="w-4 h-4" /> {org.sam_status ?? 'Unknown'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Contact & Address</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Website" value={org.website} />
                <Field label="Phone" value={org.phone} />
                <Field label="General Email" value={org.general_email} />
                <Field label="Address" value={[org.address_line_1, org.address_line_2, org.city, org.state, org.zip].filter(Boolean).join(', ')} />
              </div>
            </div>

            {/* Signatory */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Authorized Signatory</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Name" value={org.authorized_signatory_name} />
                <Field label="Title" value={org.authorized_signatory_title} />
              </div>
            </div>

            {/* Org profile */}
            {orgProfile && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Organizational Profile</h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Years in Operation" value={orgProfile.years_in_operation?.toString()} />
                  <Field label="Staff Count" value={orgProfile.staff_count?.toString()} />
                  <Field label="Board Count" value={orgProfile.board_count?.toString()} />
                  <Field label="Counties Served" value={orgProfile.counties_served?.join(', ')} />
                  <Field label="Insurance Status" value={orgProfile.insurance_status} />
                  <Field label="Audit Status" value={orgProfile.audit_status} />
                </div>
                {orgProfile.mission_statement && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Mission Statement</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{orgProfile.mission_statement}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
