import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, User, BookOpen, DollarSign, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-900">{value || '—'}</p>
    </div>
  );
}

function fmtCents(cents: number | null) {
  if (!cents) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function EnrollmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: enrollment, error } = await db
    .from('program_enrollments')
    .select(`
      id, user_id, program_id, program_slug, full_name, email, phone,
      status, payment_status, amount_paid_cents, funding_source, funding_status,
      enrolled_at, created_at, completed_at, progress_percent,
      docs_verified, agreement_signed, cohort_id, source, notes
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !enrollment) notFound();

  // Resolve program title
  let programTitle: string | null = null;
  if (enrollment.program_id) {
    const { data: prog } = await db
      .from('programs')
      .select('title, name')
      .eq('id', enrollment.program_id)
      .maybeSingle();
    programTitle = prog?.title || prog?.name || enrollment.program_slug || null;
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-brand-blue-100 text-brand-blue-800',
    withdrawn: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Enrollments', href: '/admin/enrollments' },
            { label: enrollment.full_name || enrollment.email || id.slice(0, 8) },
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/enrollments" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {enrollment.full_name || enrollment.email || 'Unknown Learner'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {programTitle ?? enrollment.program_slug ?? 'Unknown Program'} ·{' '}
              Enrolled {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : '—'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[enrollment.status] ?? 'bg-slate-100 text-slate-700'}`}>
              {enrollment.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learner */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Learner
            </h2>
            <div className="space-y-4">
              <Field label="Name" value={enrollment.full_name} />
              <Field label="Email" value={enrollment.email} />
              <Field label="Phone" value={enrollment.phone} />
              {enrollment.user_id && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Profile</p>
                  <Link href={`/admin/students/${enrollment.user_id}`} className="text-sm text-brand-blue-600 hover:underline">
                    View student profile →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Program */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" /> Program
            </h2>
            <div className="space-y-4">
              <Field label="Program" value={programTitle} />
              <Field label="Slug" value={enrollment.program_slug} />
              <Field label="Progress" value={enrollment.progress_percent != null ? `${enrollment.progress_percent}%` : null} />
              <Field label="Completed" value={enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : null} />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" /> Payment & Funding
            </h2>
            <div className="space-y-4">
              <Field label="Payment Status" value={enrollment.payment_status} />
              <Field label="Amount Paid" value={fmtCents(enrollment.amount_paid_cents)} />
              <Field label="Funding Source" value={enrollment.funding_source} />
              <Field label="Funding Status" value={enrollment.funding_status} />
            </div>
          </div>

          {/* Dates & Compliance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Dates & Compliance
            </h2>
            <div className="space-y-4">
              <Field label="Created" value={new Date(enrollment.created_at).toLocaleString()} />
              <Field label="Enrolled" value={enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleString() : null} />
              <Field label="Docs Verified" value={enrollment.docs_verified ? 'Yes' : 'No'} />
              <Field label="Agreement Signed" value={enrollment.agreement_signed ? 'Yes' : 'No'} />
              <Field label="Source" value={enrollment.source} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {enrollment.user_id && (
            <Link
              href={`/admin/students/${enrollment.user_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              View Student Profile
            </Link>
          )}
          <Link
            href="/admin/enrollments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors ml-auto"
          >
            Back to Enrollments
          </Link>
        </div>
      </div>
    </div>
  );
}
