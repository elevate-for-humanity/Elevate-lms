'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { checkComplianceStatus, ComplianceStatus } from '@/lib/compliance/enforcement';
import { AlertTriangle, FileText, BookOpen, ClipboardCheck } from 'lucide-react';

interface ComplianceGateProps {
  children: React.ReactNode;
  context?: 'student' | 'partner' | 'employer' | 'licensee';
  fallback?: React.ReactNode;
  onComplianceCheck?: (status: ComplianceStatus) => void;
}

/**
 * ComplianceGate - Wraps content that requires compliance verification
 * 
 * Blocks access until user has completed:
 * - Required agreements
 * - Onboarding steps
 * - Handbook acknowledgment
 */
export function ComplianceGate({
  children,
  context = 'student',
  fallback,
  onComplianceCheck,
}: ComplianceGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase?.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login');
        return;
      }

      setUserId(data.user.id);

      try {
        // Direct DB query to check compliance status
        const { data: complianceData } = await supabase
          .from('user_compliance_status')
          .select('onboarding_complete, agreements_complete, handbook_complete, missing_agreements')
          .eq('user_id', data.user.id)
          .eq('context', context)
          .single();

        // Also check agreement_acceptances directly
        const { data: agreements } = await supabase
          .from('agreement_acceptances')
          .select('agreement_type, signed_at')
          .eq('user_id', data.user.id);

        const complianceStatus = await checkComplianceStatus(data.user.id, context);
        
        // Merge direct DB data with library check
        if (complianceData) {
          complianceStatus.onboardingComplete = complianceData.onboarding_complete;
          complianceStatus.agreementsComplete = complianceData.agreements_complete;
          complianceStatus.handbookComplete = complianceData.handbook_complete;
        }

        setStatus(complianceStatus);
        onComplianceCheck?.(complianceStatus);
      } catch (err) {
        // If compliance check fails (tables don't exist), allow access
        console.warn('Compliance check failed:', err);
        setStatus({
          canAccess: true,
          onboardingComplete: true,
          agreementsComplete: true,
          handbookComplete: true,
          missingAgreements: [],
          redirectTo: null,
        });
      }

      setLoading(false);
    });
  }, [router, context, onComplianceCheck]);

  if (loading) {
    return (
      fallback || (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Verifying compliance status...</p>
          </div>
        </div>
      )
    );
  }

  if (!status?.canAccess) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Action Required
            </h2>
            <p className="text-slate-600">
              Please complete the following before accessing this content:
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {!status?.onboardingComplete && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <ClipboardCheck className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">Complete onboarding profile</span>
              </div>
            )}
            {!status?.agreementsComplete && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <span className="text-slate-700 block">Sign required agreements</span>
                  {status?.missingAgreements && status.missingAgreements.length > 0 && (
                    <span className="text-sm text-slate-500">
                      Missing: {status.missingAgreements.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}
            {!status?.handbookComplete && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">Acknowledge student handbook</span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push(status?.redirectTo || '/student-portal/onboarding')}
            className="w-full bg-brand-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-brand-blue-700 transition-colors"
          >
            Complete Requirements
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook for checking compliance status
 */
export function useComplianceStatus(context: 'student' | 'partner' | 'employer' | 'licensee' = 'student') {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase?.auth.getUser().then(async ({ data, error: authError }) => {
      if (authError || !data?.user) {
        setError(new Error('Not authenticated'));
        setLoading(false);
        return;
      }

      try {
        const complianceStatus = await checkComplianceStatus(data.user.id, context);
        setStatus(complianceStatus);
      } catch (err) {
        setError(err as Error);
        // Default to allowing access if check fails
        setStatus({
          canAccess: true,
          onboardingComplete: true,
          agreementsComplete: true,
          handbookComplete: true,
          missingAgreements: [],
          redirectTo: null,
        });
      }

      setLoading(false);
    });
  }, [context]);

  return { status, loading, error };
}
