import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { Building2, Mail, Phone, MapPin, Globe, Users, Briefcase, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Company Profile | Employer Portal',
  description: 'View your company profile, workforce stats, and contact details.',
  robots: { index: false, follow: false },
};

export default async function EmployerCompanyPage() {
  const { user } = await requireRole(['employer', 'sponsor', 'admin']);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, phone, company_name, city, state, verified')
    .eq('id', user.id)
    .maybeSingle();

  const employer = await getEmployerRecord(supabase, user.id);

  const { data: jobs } = employer
    ? await supabase
        .from('job_postings')
        .select('id')
        .eq('employer_id', employer.id)
    : { data: [] };
  const jobIds = (jobs ?? []).map((job: any) => job.id);

  const [{ count: apprenticeshipsCount }, { count: applicationsCount }] = await Promise.all([
    employer
      ? supabase
          .from('apprenticeships')
          .select('*', { head: true, count: 'exact' })
          .eq('employer_id', employer.id)
      : Promise.resolve({ count: 0 }),
    jobIds.length
      ? supabase
          .from('job_applications')
          .select('*', { head: true, count: 'exact' })
          .in('job_posting_id', jobIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const companyName = employer?.company_name || employer?.business_name || profile?.company_name || 'Not set';
  const primaryLocation = [employer?.city || profile?.city, employer?.state || profile?.state]
    .filter(Boolean)
    .join(', ');
  const fullLocation = [employer?.city, employer?.state, employer?.zip].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">Employer Portal</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Company Profile</h1>
            <p className="text-slate-600 mt-1">Operational snapshot and organization details used across employer workflows.</p>
          </div>
          <Link
            href="/employer/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Edit Settings
          </Link>
        </div>

        {!employer && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">Employer profile required</p>
            <p className="text-sm mt-1">Complete employer onboarding to activate company operations.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Kpi label="Open + Draft Jobs" value={jobs?.length || 0} icon={<Briefcase className="w-5 h-5 text-brand-blue-600" />} />
          <Kpi label="Applications" value={applicationsCount || 0} icon={<Users className="w-5 h-5 text-brand-green-600" />} />
          <Kpi label="Apprenticeships" value={apprenticeshipsCount || 0} icon={<GraduationCap aria-label="graduationcap" className="w-5 h-5 text-brand-orange-600" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Building2 className="w-5 h-5 text-brand-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Organization Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Field label="Company Name" value={companyName} />
              <Field label="Industry" value={employer?.industry || 'Not set'} />
              <Field label="Company Size" value={employer?.company_size || 'Not set'} />
              <Field label="Website" value={employer?.website_url || 'Not set'} />
              <Field label="Primary Location" value={primaryLocation || 'Not set'} />
              <Field label="Verification" value={employer?.approved || profile?.verified ? 'Verified' : 'Pending verification'} />
            </div>
            {employer?.description && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-1">Company Description</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{employer.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Primary Contact</h3>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>{profile?.full_name || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{profile?.email || user.email || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{profile?.phone || employer?.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{fullLocation || 'Address not set'}</span>
                </div>
                {employer?.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <a href={employer.website_url} target="_blank" rel="noreferrer" className="text-brand-blue-700 hover:underline">
                      {employer.website_url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/employer/jobs" className="block text-sm text-brand-blue-700 hover:underline">
                  Manage job postings
                </Link>
                <Link href="/employer/applications" className="block text-sm text-brand-blue-700 hover:underline">
                  Review applicant queue
                </Link>
                <Link href="/employer/apprenticeships" className="block text-sm text-brand-blue-700 hover:underline">
                  View apprenticeship programs
                </Link>
                <Link href="/employer/settings" className="block text-sm text-brand-blue-700 hover:underline">
                  Update profile settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-1">{value}</p>
    </div>
  );
}
