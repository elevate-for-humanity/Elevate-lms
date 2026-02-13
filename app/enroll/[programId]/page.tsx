export const dynamic = 'force-dynamic';

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import {

  BookOpen,
  Key,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Apprenticeship programs require approval flow, not direct enrollment
const APPRENTICESHIP_SLUGS = ['barber', 'barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship'];

interface Program {
  id: string;
  name: string;
  slug?: string;
  description: string;
  duration_weeks: number;
  requires_license: boolean;
  is_free: boolean;
  price: number | null;
  total_cost: number | null;
  funding_eligible: boolean;
  category?: string;
}

export default function EnrollPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState('');
  const [eligibility, setEligibility] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      // Try slug first (public-friendly), fall back to UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(programId);
      const column = isUUID ? 'id' : 'slug';

      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq(column, programId)
        .single();

      if (error) throw error;
      
      // Apprenticeships require approval flow - redirect to application
      const isApprenticeship = data?.category?.toLowerCase().includes('apprenticeship') ||
        (data?.slug && APPRENTICESHIP_SLUGS.includes(data.slug)) ||
        data?.name?.toLowerCase().includes('apprenticeship');
      
      if (isApprenticeship) {
        // Use slug (not UUID) so /apply can resolve via program-registry
        const identifier = data?.slug || programId;
        router.replace(`/apply?program=${identifier}`);
        return;
      }
      
      setProgram(data);

      await checkEligibility();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const {
        data: { user },
      } = await supabase?.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase?.rpc('can_user_enroll', {
        p_user_id: user.id,
        p_program_id: programId,
        p_license_key: licenseKey || null,
      });

      if (error) throw error;
      setEligibility(data);
    } catch (error) { /* Error handled silently */ 
      console.error('Eligibility check error:', error);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    setMessage('');

    try {
      const {
        data: { user },
      } = await supabase?.auth.getUser();
      if (!user) {
        setMessage('Please sign in to enroll');
        router.push(`/login?redirect=/enroll/${programId}`);
        return;
      }

      if (program?.requires_license && !licenseKey) {
        setMessage('This program requires a license key');
        setEnrolling(false);
        return;
      }

      // Programs are free if: is_free=true OR funding_eligible (WIOA/WRG covers cost)
      const isFreeProgram = program && (program.is_free === true || program.funding_eligible);
      const isPaid = !isFreeProgram && (program?.price || program?.total_cost);

      if (isPaid) {
        // Use canonical program enrollment checkout
        const response = await fetch('/api/programs/enroll/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: program?.id || programId,
            funding_source: 'self_pay',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to start checkout');
        }

        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } else {
        // Funded enrollment - still use canonical checkout with funding_source
        const fundingSource = program?.funding_eligible ? 'wioa' : 'self_pay';
        const response = await fetch('/api/programs/enroll/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: program?.id || programId,
            funding_source: fundingSource,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // If checkout fails for free programs, fall back to direct enrollment
          const applyResponse = await fetch('/api/enroll/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: user.user_metadata?.first_name || '',
              lastName: user.user_metadata?.last_name || '',
              email: user.email,
              preferredProgramId: programId,
              licenseKey: licenseKey || null,
            }),
          });

          const applyData = await applyResponse.json();

          if (!applyResponse.ok) {
            throw new Error(applyData.message || 'Enrollment failed');
          }

          setMessage(applyData.message || 'Enrollment successful! Redirecting...');
          setTimeout(() => {
            router.push('/enroll/success');
          }, 2000);
          return;
        }

        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }


    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Loading program details...</p>
          <span className="sr-only">Loading program information, please wait</span>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Program Not Found
          </h2>
          <p className="text-gray-600">
            The program you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Enroll', href: '/enroll' }, { label: program?.name || 'Program' }]} />
        </div>
      </div>

      <div className="py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-slate-700 px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12" />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {program.name}
                  </h1>
                  {program.is_free === true ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                      FREE
                    </span>
                  ) : program.funding_eligible ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                      FREE with WIOA/WRG
                    </span>
                  ) : (program.price || program.total_cost) ? (
                    <span className="px-3 py-1 bg-white/20 text-white text-sm font-bold rounded-full">
                      ${(program.price || program.total_cost || 0).toLocaleString()}
                    </span>
                  ) : null}
                </div>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">
                  Duration: {program.duration_weeks} weeks
                </p>
              </div>
            </div>
            <p className="text-base sm:text-lg text-blue-50">
              {program.description}
            </p>
            {program.funding_eligible && (program.price || program.total_cost) && (
              <p className="text-sm text-blue-200 mt-2">
                Self-pay option: ${(program.price || program.total_cost || 0).toLocaleString()}
              </p>
            )}
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {message && (
              <div
                className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-3 text-sm sm:text-base ${
                  message.includes('Error')
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : message.includes('successful')
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {message.includes('Error') ? (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                )}
                <span>{message}</span>
              </div>
            )}

            {eligibility && !eligibility.can_enroll && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 text-sm sm:text-base">
                    Cannot Enroll
                  </p>
                  <p className="text-yellow-800 text-xs sm:text-sm mt-1">
                    {eligibility.reason}
                  </p>
                </div>
              </div>
            )}

            {program.requires_license && (
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Key *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => {
                      setLicenseKey(e.target.value);
                      if (e.target.value) checkEligibility();
                    }}
                    placeholder="Enter your license key"
                    className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  This program requires a valid license key to enroll
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
                What You'll Get:
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Full access to course materials
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Interactive lessons and assessments
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Certificate upon completion
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Instructor support
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleEnroll}
                disabled={enrolling || (eligibility && !eligibility.can_enroll)}
                className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {enrolling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {program?.is_free === true || program?.funding_eligible
                      ? 'Complete Enrollment'
                      : (program?.price || program?.total_cost)
                        ? 'Enroll Now (Secure Checkout)'
                        : 'Complete Enrollment'}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
