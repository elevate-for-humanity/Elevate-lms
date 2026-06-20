import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, Mail, Phone, MapPin, Briefcase, Users, Edit3, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return {
    title: 'Employer | Admin | Elevate For Humanity',
  };
}

export default async function EmployerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: employer } = await db
    .from('employers')
    .select(
      'id, name, industry, city, state, status, contact_email, contact_phone, website, created_at, address',
    )
    .eq('id', id)
    .maybeSingle();

  if (!employer) notFound();

  const [{ data: jobs, count: jobCount }, { data: apprentices, count: apprenticeCount }] =
    await Promise.all([
      db
        .from('job_postings')
        .select('id, title, status, created_at', { count: 'exact' })
        .eq('employer_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
      db
        .from('student_enrollments')
        .select('id, student_id, status', { count: 'exact' })
        .eq('employer_id', id)
        .limit(1),
    ]);

  const jobRows = jobs ?? [];

  const QUICK_LINKS = [
    { label: 'Proposal', href: `/admin/employers/${id}/proposal` },
    { label: 'Onboarding', href: `/admin/employers/${id}/onboarding` },
    { label: 'Job Postings', href: `/admin/jobs?employer=${id}` },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              <Link href="/admin/employers" className="hover:text-blue-600">
                Employers
              </Link>{' '}
              / {employer.name}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-slate-500" /> {employer.name}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {employer.industry} · {employer.city}, {employer.state}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                {l.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open Jobs', value: jobRows.filter((j) => j.status === 'open').length },
            { label: 'Total Jobs', value: jobCount ?? 0 },
            { label: 'Apprentices', value: apprenticeCount ?? 0 },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-200 p-5 text-center"
            >
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Employer Details</h2>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-slate-400 text-xs">Status</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employer.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {employer.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                <a href={`mailto:${employer.contact_email}`} className="hover:text-blue-600">
                  {employer.contact_email ?? '—'}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </dt>
              <dd className="font-medium text-slate-900 mt-0.5">{employer.contact_phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {employer.city}, {employer.state}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Industry</dt>
              <dd className="font-medium text-slate-900 mt-0.5">{employer.industry ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Member Since</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {new Date(employer.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Job postings */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" /> Job Postings ({jobCount ?? 0})
            </h2>
            <Link
              href={`/admin/jobs/new?employer=${id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              + Post Job
            </Link>
          </div>
          {jobRows.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No job postings yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobRows.map((j) => (
                <div
                  key={j.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-900">{j.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(j.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        j.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {j.status}
                    </span>
                    <Link
                      href={`/admin/jobs/${j.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
