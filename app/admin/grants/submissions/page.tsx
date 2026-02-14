/**
 * Grant Submissions Archive
 * Complete history of all submitted grants
 */

import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/authGuards';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { BarChart, Globe, Mail } from 'lucide-react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/grants/submissions',
  },
  title: 'Submissions | Elevate For Humanity',
  description:
    'Review and process grant application submissions.',
};

async function getSubmissionsData() {
  const { data: submissions } = await supabaseAdmin
    .from('grant_submissions')
    .select(
      `
      *,
      grant:grant_opportunities(title, agency, due_date),
      entity:entities(name),
      application:grant_applications(draft_title)
    `
    )
    .order('submitted_at', { ascending: false });

  return { submissions: submissions || [] };
}

function getStatusBadge(status: string) {
  const badges: Record<string, { color: string; text: string }> = {
    submitted: { color: 'bg-brand-blue-100 text-brand-blue-800', text: '🔵 Submitted' },
    confirmed: { color: 'bg-brand-blue-100 text-brand-blue-800', text: '🟣 Confirmed' },
    under_review: {
      color: 'bg-yellow-100 text-yellow-800',
      text: '🟡 Under Review',
    },
    awarded: { color: 'bg-brand-green-100 text-green-800', text: '🟢 Awarded' },
    rejected: { color: 'bg-red-100 text-red-800', text: '🔴 Rejected' },
    withdrawn: { color: 'bg-gray-100 text-black', text: '⚪ Withdrawn' },
  };

  const badge = badges[status] || badges.submitted;
  return (
    <span
      className={`px-3 py-2 rounded-full text-xs font-semibold ${badge.color}`}
    >
      {badge.text}
    </span>
  );
}

function getMethodBadge(method: string) {
  const badges: Record<string, { icon: string; text: string }> = {
    email: { icon: '<Mail className="w-5 h-5 inline-block" />', text: 'Email' },
    portal: {
      icon: '<Globe className="w-5 h-5 inline-block" />',
      text: 'Portal',
    },
    mail: { icon: '📮', text: 'Mail' },
    other: { icon: '📄', text: 'Other' },
  };

  const badge = badges[method] || badges.other;
  return (
    <span className="text-sm text-black">
      {badge.icon} {badge.text}
    </span>
  );
}

export default async function GrantSubmissionsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  await requireAdmin();

  const { submissions } = await getSubmissionsData();

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(
      (s: Record<string, any>) => s.status === 'submitted'
    ).length,
    underReview: submissions.filter(
      (s: Record<string, any>) => s.status === 'under_review'
    ).length,
    awarded: submissions.filter(
      (s: Record<string, any>) => s.status === 'awarded'
    ).length,
    rejected: submissions.filter(
      (s: Record<string, any>) => s.status === 'rejected'
    ).length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-white overflow-hidden">
          <Image
            src="/images/heroes-hq/funding-hero.jpg"
            alt="Grant Submissions"
            fill
            className="object-cover"
            quality={100}
            priority
            sizes="100vw"
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome</h1>
            <p className="text-base md:text-lg mb-8 text-gray-100">
              Transform your career with free training
            </p>
          </div>
        </section>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Grant Submissions Archive
              </h1>
              <p className="text-black">
                Complete history of all submitted grant applications
              </p>
            </div>
            <Link
              href="/admin/grants/workflow"
              className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 font-semibold"
            >
              ← Back to Workflow
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-black">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1">Submitted</p>
            <p className="text-3xl font-bold text-brand-blue-600">
              {stats.submitted}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1">Under Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.underReview}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1">Awarded</p>
            <p className="text-3xl font-bold text-brand-green-600">
              {stats.awarded}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-brand-orange-600">
              {stats.rejected}
            </p>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Grant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Confirmation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {submissions.map((submission: Record<string, any>) => (
                  <tr key={submission.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-black">
                          {submission.grant?.title || 'Unknown Grant'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {submission.grant?.agency || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-black">
                        {submission.entity?.name || 'Unknown Entity'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getMethodBadge(submission.method)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-black">
                          {new Date(
                            submission.submitted_at
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          by {submission.submitted_by}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {submission.confirmation_number ? (
                        <p className="text-sm font-mono text-black">
                          {submission.confirmation_number}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400">N/A</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/grants/submission/${submission.id}`}
                          className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                        >
                          View Details
                        </Link>
                        {submission.portal_url && (
                          <a
                            href={submission.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                          >
                            Portal →
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submissions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 text-4xl md:text-5xl lg:text-6xl">
                📋
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                No Submissions Yet
              </h3>
              <p className="text-black mb-6">
                Start by drafting and submitting your first grant application.
              </p>
              <Link
                href="/admin/grants/workflow"
                className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 font-semibold"
              >
                Go to Workflow
              </Link>
            </div>
          )}
        </div>

        {/* Export Options */}
        {submissions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-black mb-4">
              Export Options
            </h2>
            <div className="flex gap-4">
              <button className="bg-brand-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold" aria-label="Action button">
                <BarChart className="w-5 h-5 inline-block" /> Export to Excel
              </button>
              <button className="bg-brand-orange-600 text-white px-6 py-3 rounded-lg hover:bg-brand-orange-700 font-semibold" aria-label="Action button">
                📄 Export to PDF
              </button>
              <button className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 font-semibold" aria-label="Action button">
                <Mail className="w-5 h-5 inline-block" /> Email Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
