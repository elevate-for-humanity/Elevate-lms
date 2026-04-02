import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Award, Download, Calendar, Clock, ExternalLink,
  FileText, AlertCircle, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { getLearnerCredentialLifecycle } from '@/lib/services/credential-pipeline';
import { getNextAction } from '@/lib/domain/credentials';
import type { CredentialLifecycleState } from '@/lib/domain/credentials';

export const metadata: Metadata = {
  title: 'My Credentials | LMS',
  description: 'Track your credential progress, exam status, and certificates.',
};

export const dynamic = 'force-dynamic';

const STATE_STYLES: Record<CredentialLifecycleState, { label: string; color: string }> = {
  not_eligible:                    { label: 'Not Eligible',     color: 'bg-white text-gray-600' },
  eligible:                        { label: 'Eligible',         color: 'bg-brand-blue-100 text-brand-blue-700' },
  payment_required:                { label: 'Payment Required', color: 'bg-yellow-100 text-yellow-700' },
  payment_pending:                 { label: 'Funding Pending',  color: 'bg-orange-100 text-orange-700' },
  payment_approved:                { label: 'Approved',         color: 'bg-brand-green-100 text-brand-green-700' },
  scheduled:                       { label: 'Exam Scheduled',   color: 'bg-brand-blue-100 text-brand-blue-700' },
  attempted:                       { label: 'Exam Submitted',   color: 'bg-purple-100 text-purple-700' },
  passed:                          { label: 'Passed',           color: 'bg-brand-green-100 text-brand-green-700' },
  failed:                          { label: 'Not Passed',       color: 'bg-red-100 text-red-700' },
  credential_pending_verification: { label: 'Verifying',        color: 'bg-orange-100 text-orange-700' },
  credential_verified:             { label: 'Verified',         color: 'bg-brand-green-100 text-brand-green-700' },
  certificate_issued:              { label: 'Complete',         color: 'bg-brand-green-100 text-brand-green-700' },
};

export default async function CertificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/certification');

  const [certsRes, attemptsRes, inProgressRes, availableRes] = await Promise.all([
    supabase
      .from('certificates')
      .select('id, title, issued_at, expires_at, certificate_url, credential_id, course:courses(id, course_name)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),

    supabase
      .from('credential_attempts')
      .select('id, credential_id, program_id, attempt_number, attempted_at, passed, credentials(name, abbreviation, issuing_authority)')
      .eq('learner_id', user.id)
      .order('attempted_at', { ascending: false }),

    supabase
      .from('program_enrollments')
      .select('id, progress, course:courses(id, title, certification_name)')
      .eq('user_id', user.id)
      .lt('progress', 100)
      .not('course.certification_name', 'is', null),

    supabase
      .from('training_courses')
      .select('id, title, certification_name, certification_body')
      .not('certification_name', 'is', null)
      .eq('is_active', true)
      .limit(6),
  ]);

  const certificates = certsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];
  const inProgress = inProgressRes.data ?? [];
  const availableCerts = availableRes.data ?? [];

  // Resolve lifecycle state for each attempt
  const attemptLifecycles = await Promise.all(
    attempts.map(async (attempt: any) => {
      const { state, funding } = await getLearnerCredentialLifecycle(
        user.id,
        attempt.credential_id,
        attempt.program_id ?? null
      );
      return { attempt, state, funding };
    })
  );

  const activeCount = attemptLifecycles.filter(
    l => l.state !== 'certificate_issued' && l.state !== 'not_eligible'
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Credentials</h1>
        <p className="text-gray-600 mt-1">Track your credential progress, exam status, and certificates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{certificates.length}</div>
          <div className="text-gray-600 text-sm">Earned</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <Clock className="w-8 h-8 text-brand-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{activeCount + inProgress.length}</div>
          <div className="text-gray-600 text-sm">In Progress</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <FileText className="w-8 h-8 text-brand-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{availableCerts.length}</div>
          <div className="text-gray-600 text-sm">Available</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Active credential pipeline */}
          {attemptLifecycles.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Credential Pipeline</h2>
              <div className="space-y-4">
                {attemptLifecycles.map(({ attempt, state, funding }) => {
                  const style = STATE_STYLES[state];
                  const action = getNextAction(state);
                  const isSponsoredPending = funding.fundingSource !== 'self_pay' && funding.fundingStatus === 'pending';
                  const isSponsoredApproved = funding.fundingSource !== 'self_pay' && funding.fundingStatus === 'approved';

                  const ctaHref = (() => {
                    if (state === 'payment_required' && !isSponsoredPending) return `/lms/payments/checkout?attemptId=${attempt.id}`;
                    if (state === 'payment_approved' || state === 'eligible') return '/lms/certification/schedule';
                    if (state === 'passed') return '/lms/certification/upload';
                    if (state === 'not_eligible') return '/lms/courses';
                    return null;
                  })();

                  return (
                    <div key={attempt.id} className="border rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {attempt.credentials?.name ?? 'Credential'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {attempt.credentials?.issuing_authority} · Attempt #{attempt.attempt_number}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${style.color}`}>
                          {style.label}
                        </span>
                      </div>

                      {state !== 'certificate_issued' && (
                        <div className={`rounded-lg border p-3 flex items-start gap-3 ${
                          state === 'failed' ? 'bg-red-50 border-red-200' :
                          isSponsoredPending ? 'bg-orange-50 border-orange-200' :
                          'bg-brand-blue-50 border-brand-blue-200'
                        }`}>
                          <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            state === 'failed' ? 'text-red-500' :
                            isSponsoredPending ? 'text-orange-500' :
                            'text-brand-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{action}</p>
                            {isSponsoredPending && (
                              <p className="text-xs text-orange-600 mt-0.5">Questions? Call (317) 314-3757.</p>
                            )}
                            {isSponsoredApproved && state === 'payment_approved' && (
                              <p className="text-xs text-brand-green-700 mt-0.5 font-medium">
                                Your exam fee is covered — no payment required.
                              </p>
                            )}
                          </div>
                          {ctaHref && !isSponsoredPending && (
                            <Link href={ctaHref} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-700 hover:text-brand-blue-900 flex-shrink-0">
                              Go <ArrowRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Earned certificates */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Earned Certificates</h2>
            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cert.title}</h3>
                        {cert.course && <p className="text-sm text-gray-500">{cert.course.course_name}</p>}
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(cert.issued_at).toLocaleDateString()}
                          </span>
                          {cert.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Expires {new Date(cert.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {cert.certificate_url && (
                      <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-brand-blue-600 text-sm font-medium hover:underline flex-shrink-0">
                        <Download className="w-4 h-4" /> Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-3">No certificates earned yet</p>
                <Link href="/lms/courses" className="text-brand-blue-600 font-medium hover:underline">
                  Browse courses to earn certificates
                </Link>
              </div>
            )}
          </div>

          {/* In-progress enrollments */}
          {inProgress.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Training In Progress</h2>
              <div className="space-y-3">
                {inProgress.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-brand-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.course?.certification_name}</h3>
                      <p className="text-xs text-gray-500 truncate">{item.course?.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{item.progress}%</span>
                    </div>
                    <Link href={`/lms/courses/${item.course?.id}`} className="text-brand-blue-600 text-sm font-medium flex-shrink-0">
                      Continue
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Available Certifications</h2>
            {availableCerts.length > 0 ? (
              <div className="space-y-3">
                {availableCerts.map((cert: any) => (
                  <Link key={cert.id} href={`/lms/courses/${cert.id}`}
                    className="block p-3 border rounded-lg hover:border-brand-blue-300 transition">
                    <h3 className="font-medium text-sm">{cert.certification_name}</h3>
                    <p className="text-xs text-gray-500">{cert.certification_body}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No certifications available</p>
            )}
            <Link href="/programs" className="block text-center text-brand-blue-600 text-sm font-medium mt-4 hover:underline">
              View All Programs
            </Link>
          </div>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-brand-blue-600" />
              <h3 className="font-semibold text-brand-blue-900">Verify a Certificate</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Employers can verify certificates using the credential ID.</p>
            <Link href="/verify" className="flex items-center gap-1 text-brand-blue-600 text-sm font-medium hover:underline">
              Verification Portal <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">Questions about your exam, funding, or credentials?</p>
            <a href="tel:+13173143757"
              className="block text-center bg-brand-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
              Call (317) 314-3757
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
