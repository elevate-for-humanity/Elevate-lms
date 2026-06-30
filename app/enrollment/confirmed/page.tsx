'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Building2, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface EnrollmentData {
  id: string;
  program_name: string;
  enrollment_state: string;
  enrollment_confirmed_at: string;
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

      // Redirect based on state
      if (data.enrollment_state === 'orientation_complete') {
        router.push('/enrollment/documents');
        return;
      }
      if (data.enrollment_state === 'documents_complete' || data.enrollment_state === 'active') {
        router.push('/dashboard');
        return;
      }
      // Accept both 'approved' and 'confirmed' — approved students confirm here
      if (data.enrollment_state !== 'confirmed' && data.enrollment_state !== 'approved') {
        router.push('/programs');
        return;
      }

      setEnrollment({
        id: data.id,
        program_name: (data.training_programs as any)?.name || 'Your Program',
        enrollment_state: data.enrollment_state,
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

  const isApproved = enrollment.enrollment_state === 'approved';

  async function handleConfirm() {
    setConfirming(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('program_enrollments')
        .update({
          enrollment_state: 'confirmed',
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green-100 rounded-full mb-4">
            <Award aria-label="award" className="w-10 h-10 text-brand-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isApproved ? 'Confirm Your Enrollment' : 'Enrollment Confirmed'}
          </h1>
          {isApproved && (
            <p className="text-slate-700 mt-2">
              Your application has been approved. Review the details below and confirm to begin
              onboarding.
            </p>
          )}
        </div>

        {/* Enrollment Details Card */}
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
                  className={`font-semibold ${isApproved ? 'text-amber-600' : 'text-brand-green-600'}`}
                >
                  {isApproved ? 'Approved — Awaiting Confirmation' : 'Confirmed'}
                </p>
              </div>
            </div>

            {!isApproved && (
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

        {/* CTA Button */}
        {isApproved ? (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? 'Confirming...' : 'Confirm Enrollment & Start Onboarding'}
          </button>
        ) : (
          <Link
            href="/enrollment/orientation"
            className="flex items-center justify-center gap-2 w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            Start Orientation <ArrowRight className="w-5 h-5" />
          </Link>
        )}

        {/* Helper Text */}
        <p className="text-center text-sm text-slate-700 mt-4">
          This program is sponsor-managed. Orientation and required documents must be completed
          before course access is unlocked.
        </p>
      </div>
    </div>
  );
}

export default function EnrollmentConfirmedPage() {
  return (
          <EnrollmentConfirmedContent />
  );
}
