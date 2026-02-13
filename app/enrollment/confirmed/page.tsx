export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Calendar, Building2, Award } from 'lucide-react';
import Link from 'next/link';

interface EnrollmentData {
  id: string;
  program_name: string;
  enrollment_state: string;
  enrollment_confirmed_at: string;
  start_date?: string;
}

function EnrollmentConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrollment() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const programId = searchParams.get('program_id');
      
      let query = supabase
        .from('program_enrollments')
        .select(`
          id,
          enrollment_state,
          enrollment_confirmed_at,
          training_programs(name)
        `)
        .eq('user_id', user.id);

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

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
      if (data.enrollment_state !== 'confirmed') {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!enrollment) return null;

  const confirmDate = enrollment.enrollment_confirmed_at 
    ? new Date(enrollment.enrollment_confirmed_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            You are now officially enrolled.
          </h1>
        </div>

        {/* Enrollment Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-semibold text-gray-900">{enrollment.program_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-green-600">Active Enrollment</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Confirmed Date</p>
                <p className="font-semibold text-gray-900">{confirmDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Sponsor</p>
                <p className="font-semibold text-gray-900">Elevate for Humanity (USDOL Registered)</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/enrollment/orientation"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors"
        >
          Start Orientation
        </Link>

        {/* Helper Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          This program is sponsor-managed. Orientation and required documents must be completed before course access is unlocked.
        </p>
      </div>
    </div>
  );
}

export default function EnrollmentConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <EnrollmentConfirmedContent />
    </Suspense>
  );
}
