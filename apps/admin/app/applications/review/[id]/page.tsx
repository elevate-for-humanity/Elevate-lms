import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Hash, BookOpen, Tag } from 'lucide-react';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/utils/withTimeout';
import ApplicationActions from './ApplicationActions';
import EditApplicationForm from './EditApplicationForm';
import { resolveProgram } from '@/lib/programs/resolve';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Application | Elevate For Humanity',
  description: 'Review and approve or reject an application',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  under_review: 'Under Review',
  pending_admin_review: 'Pending Review',
  enrolled: 'Enrolled',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  submitted: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  approved: 'bg-brand-green-100 text-brand-green-800 border-brand-green-300',
  rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
  in_review: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  under_review: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  pending_admin_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  enrolled: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  revoked: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
};

type ReviewApplication = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  zip?: string | null;
  status?: string | null;
  program_interest?: string | null;
  program_id?: string | null;
  program_slug?: string | null;
  source?: string | null;
  support_notes?: string | null;
  review_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  revoked_at?: string | null;
  payment_status?: string | null;
  _source?: 'apprenticeship_intake';
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReviewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isUuid = UUID_RE.test(id);
  const isLegacyIntakeId = id.startsWith('intake-');
  const db = await requireAdminClient();

  let application: ReviewApplication | null = null;

  if (isUuid) {
    const lookup = await withTimeout(
      db.from('applications').select('*').eq('id', id).maybeSingle(),
      8000,
      'applications lookup',
    ).catch((error) => {
      logger.error('[application-review] applications lookup failed', error instanceof Error ? error : undefined, { id });
      return { data: null, error } as const;
    });
    if (!lookup.error && lookup.data) application = lookup.data as ReviewApplication;
  }

  if (!application && isLegacyIntakeId) {
    const intakeId = id.replace(/^intake-/, '');
    const { data } = await db
      .from('apprenticeship_intake')
      .select('*')
      .eq('id', intakeId)
      .maybeSingle();
    if (data) application = { ...(data as ReviewApplication), _source: 'apprenticeship_intake' };
  }

  if (!application) notFound();

  const status = application.revoked_at ? 'revoked' : application.status || 'pending';
  const resolvedProgram = await resolveProgram(
    db,
    application.program_id || application.program_slug || application.program_interest || '',
  );
  const displayName =
    application.full_name ||
    [application.first_name, application.last_name].filter(Boolean).join(' ') ||
    'Applicant';
  const applicantEmail = application.email || '';
  const programInterest = resolvedProgram?.title || application.program_interest || application.program_slug || 'Not selected';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/dashboard' },
            { label: 'Applications', href: '/applications' },
            { label: displayName },
          ]}
        />

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative min-h-[230px] overflow-hidden bg-slate-900 px-6 py-8 sm:px-8">
            <Image
              src="/images/pages/admin-applications-hero.webp"
              alt="Admissions team reviewing applications"
              fill
              priority
              className="object-cover opacity-35" sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-brand-blue-900/45" />
            <div className="relative z-10 max-w-3xl">
              <Link href="/applications" className="inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to applications
              </Link>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColors[status] || 'border-slate-300 bg-slate-100 text-slate-800'}`}>
                  {statusLabels[status] || status}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">Application #{application.id}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">{displayName}</h1>
              <p className="mt-2 text-sm font-medium text-slate-100 sm:text-base">
                Review the applicant record, verify program fit and funding information, then record the next decision.
              </p>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-black text-slate-950">Applicant details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    [Mail, 'Email', applicantEmail || 'Not provided'],
                    [Phone, 'Phone', application.phone || 'Not provided'],
                    [MapPin, 'Location', [application.city, application.zip].filter(Boolean).join(' ') || 'Not provided'],
                    [Calendar, 'Submitted', application.created_at ? new Date(application.created_at).toLocaleString() : 'Not available'],
                    [BookOpen, 'Program', programInterest],
                    [Tag, 'Source', application.source || 'Application form'],
                  ].map(([Icon, label, value]) => {
                    const ItemIcon = Icon as typeof Mail;
                    return (
                      <div key={String(label)} className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                          <ItemIcon className="h-4 w-4" /> {String(label)}
                        </div>
                        <div className="mt-2 break-words text-sm font-bold text-slate-900">{String(value)}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {(application.support_notes || application.review_notes) && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h2 className="text-sm font-black uppercase tracking-wide text-amber-950">Review notes</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-amber-950">
                    {application.review_notes || application.support_notes}
                  </p>
                </section>
              )}

              <EditApplicationForm
                applicationId={application.id}
                currentStatus={status}
                currentNotes={application.review_notes || application.support_notes || null}
              />
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-5">
                <h2 className="text-base font-black text-brand-blue-950">Reviewer direction</h2>
                <ol className="mt-3 space-y-3 text-sm font-medium text-brand-blue-950">
                  <li>1. Confirm the applicant identity and contact information.</li>
                  <li>2. Verify the selected program and required eligibility documents.</li>
                  <li>3. Record funding or self-pay status without promising approval.</li>
                  <li>4. Approve, reject, or leave the application in review with clear notes.</li>
                </ol>
              </div>
              <ApplicationActions
                applicationId={application.id}
                currentStatus={status}
                programId={resolvedProgram?.id || application.program_id || null}
                programInterest={programInterest}
                applicantEmail={applicantEmail}
                applicantName={displayName}
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  <Hash className="h-4 w-4" /> Record ID
                </div>
                <p className="mt-2 break-all text-xs font-semibold text-slate-700">{application.id}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}