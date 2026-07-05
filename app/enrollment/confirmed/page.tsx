'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Building2, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  canShowConfirmedPage,
  getEnrollmentRoute,
  hasLmsAccess,
  normalizeEnrollmentState,
} from '@/lib/enrollment/enrollment-flow';

interface EnrollmentData {
  id: string;
  program_name: string;
  enrollment_state: string;
  enrollment_confirmed_at: string | null;
  start_date?: string;
}

function EnrollmentConfirmedContent() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function fetchEnrollment() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      const programId = searchParams.get('program_id');

      let query = supabase
        .from('program_enrollments')
        .select(
          `
          id,
          enrollment_state,
          enrollment_confirmed_at,
          programs(title),
          training_programs(name)
        `,
        )
        .eq('user_id', user.id);

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        router.push('/programs');
        return;
      }

      const state = normalizeEnrollmentState(data.enrollment_state) ?? data.enrollment_state;

      if (hasLmsAccess(state)) {
        router.push('/learner/dashboard');
        return;
      }

      const targetRoute = getEnrollmentRoute(state);
      if (targetRoute !== '/enrollment/confirmed' && targetRoute !== '/programs') {
        router.push(targetRoute);
        return;
      }

      if (!canShowConfirmedPage(state)) {
        router.push('/programs');
        return;
      }

      setEnrollment({
        id: data.id,
        program_name: (data.programs as { title?: string } | null)?.title || (data.training_programs as { name?: string } | null)?.name || 'Your Program',
        enrollment_state: state,
        enrollment_confirmed_at: data.enrollment_confirmed_at,
      });
      setLoading(false);
    }

    fetchEnrollment();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  if (!enrollment) return null;

  const normalizedState = normalizeEnrollmentState(enrollment.enrollment_state);
  const needsConfirm = normalizedState === 'onboarding';
  const awaitingReview =
    normalizedState === 'applied' ||
    normalizedState === 'waitlisted' ||
    normalizedState === 'pending_funding_verification';
  const needsPayment = normalizedState === 'payment_required';

  async function handleConfirm() {
    setConfirming(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('program_enrollments')
        .update({
          enrollment_state: 'orientation',
          enrollment_confirmed_at: new Date().toISOString(),
          next_required_action: 'COMPLETE_ORIENTATION',
        })
        .eq('id', enrollment!.id);

      if (error) throw error;
      router.push('/enrollment/orientation');
    } catch {
      setConfirming(false);
    }
  }

  const confirmDate = enrollment.enrollment_confirmed_at
    ? new Date(enrollment.enrollment_confirmed_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green-100 rounded-full mb-4">
            <Award aria-label="award" className="w-10 h-10 text-brand-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {needsConfirm
              ? 'Confirm Your Enrollment'
              : awaitingReview
                ? 'Application Received'
                : needsPayment
                  ? 'Payment Required'
                  : 'Enrollment Confirmed'}
          </h1>
          {needsConfirm && (
            <p className="text-slate-700 mt-2">
              Your enrollment is ready. Review the details below and confirm to begin onboarding.
            </p>
          )}
          {awaitingReview && (
            <p className="text-slate-700 mt-2">
              We received your application. Our team will notify you when you can continue to
              orientation.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Award aria-label="award" className="w-5 h-5 text-brand-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-slate-700">Program</p>
                <p className="font-semibold text-slate-900">{enrollment.program_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-brand-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-slate-700">Status</p>
                <p
                  className={`font-semibold ${needsConfirm || needsPayment ? 'text-amber-600' : 'text-brand-green-600'}`}
                >
                  {needsConfirm && 'Ready — Awaiting Confirmation'}
                  {awaitingReview && 'Under Review'}
                  {needsPayment && 'Payment Required'}
                  {!needsConfirm && !awaitingReview && !needsPayment && 'Confirmed'}
                </p>
              </div>
            </div>

            {!needsConfirm && !awaitingReview && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-brand-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-700">Confirmed Date</p>
                  <p className="font-semibold text-slate-900">{confirmDate}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-brand-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-slate-700">Sponsor</p>
                <p className="font-semibold text-slate-900">
                  {PLATFORM_DEFAULTS.orgName} (USDOL Registered)
                </p>
              </div>
            </div>
          </div>
        </div>

        {needsConfirm ? (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? 'Confirming...' : 'Confirm Enrollment & Start Onboarding'}
          </button>
        ) : needsPayment ? (
          <Link
            href="/apply"
            className="flex items-center justify-center gap-2 w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            Complete Payment <ArrowRight className="w-5 h-5" />
          </Link>
        ) : awaitingReview ? (
          <Link
            href="/learner/dashboard"
            className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-center font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <Link
            href="/enrollment/orientation"
            className="flex items-center justify-center gap-2 w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            Start Orientation <ArrowRight className="w-5 h-5" />
          </Link>
        )}

        <p className="text-center text-sm text-slate-700 mt-4">
          This program is sponsor-managed. Orientation and required documents must be completed
          before course access is unlocked.
        </p>
      </div>
    </div>
  );
}

export default function EnrollmentConfirmedPage() {
  return <EnrollmentConfirmedContent />;
}
