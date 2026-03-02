import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building, Briefcase, FileText, Shield, Upload, UserCheck,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employer Onboarding | Elevate For Humanity',
  description: 'Complete your employer onboarding process.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Building;
  href: string;
  status: 'complete' | 'current' | 'pending';
  required: boolean;
}

export default async function EmployerOnboardingPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const _admin = createAdminClient();
  const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/employer');

  // Try auto-activation before rendering (in case all docs are already uploaded)
  try {
    const { tryAutoActivate } = await import('@/lib/employer/check-onboarding-complete');
    const activated = await tryAutoActivate(db, user.id);
    if (activated) {
      redirect('/employer/dashboard');
    }
  } catch {
    // Non-fatal
  }

  // Get onboarding record
  const { data: onboarding } = await db
    .from('employer_onboarding')
    .select('*')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get uploaded documents
  const { data: documents } = await db
    .from('documents')
    .select('document_type, status')
    .eq('user_id', user.id);

  const docTypes = new Set((documents || []).map((d: any) => d.document_type));
  const verifiedDocs = new Set(
    (documents || []).filter((d: any) => d.status === 'approved').map((d: any) => d.document_type)
  );

  // Get agreement status
  const { data: agreements } = await db
    .from('license_agreement_acceptances')
    .select('agreement_type')
    .eq('user_id', user.id);

  const signedAgreements = new Set((agreements || []).map((a: any) => a.agreement_type));

  // Compute step statuses
  const hasHiringNeeds = !!onboarding?.hiring_needs;
  const hasMOU = signedAgreements.has('employer_agreement');
  const hasCOI = docTypes.has('other'); // Will be refined when DB supports coi_general_liability
  const hasBusinessDocs = docTypes.size >= 2; // At least business license + EIN
  const hasInsurance = hasCOI;
  const isApproved = onboarding?.status === 'approved' || onboarding?.status === 'active';

  function stepStatus(done: boolean, deps: boolean[]): 'complete' | 'current' | 'pending' {
    if (done) return 'complete';
    if (deps.every(Boolean)) return 'current';
    return 'pending';
  }

  const steps: OnboardingStep[] = [
    {
      id: 'hiring-needs',
      title: 'Hiring Needs',
      description: 'Tell us about your workforce needs, positions, and timeline',
      icon: Briefcase,
      href: '/onboarding/employer/hiring-needs',
      status: stepStatus(hasHiringNeeds, [true]),
      required: true,
    },
    {
      id: 'mou',
      title: 'Employer Partnership Agreement',
      description: 'Review and sign the Memorandum of Understanding',
      icon: FileText,
      href: '/onboarding/employer/agreement',
      status: stepStatus(hasMOU, [hasHiringNeeds]),
      required: true,
    },
    {
      id: 'insurance',
      title: 'Insurance Documentation',
      description: 'Upload General Liability COI and Workers\' Compensation proof',
      icon: Shield,
      href: '/employer/documents/upload',
      status: stepStatus(hasInsurance, [hasHiringNeeds]),
      required: true,
    },
    {
      id: 'business-docs',
      title: 'Business Verification',
      description: 'Business license, Tax ID (EIN), and worksite address',
      icon: Building,
      href: '/employer/documents/upload',
      status: stepStatus(hasBusinessDocs, [hasHiringNeeds]),
      required: true,
    },
    {
      id: 'supervisor',
      title: 'Supervisor Designation',
      description: 'Name the person who will oversee apprentices and trainees',
      icon: UserCheck,
      href: '/employer/settings',
      status: stepStatus(false, [hasHiringNeeds]),
      required: true,
    },
    {
      id: 'activation',
      title: 'Portal Activation',
      description: 'Full access to hours tracking, compliance, and hiring tools',
      icon: CheckCircle,
      href: '/employer/dashboard',
      status: stepStatus(isApproved, [hasMOU, hasInsurance, hasBusinessDocs]),
      required: false,
    },
  ];

  const completedCount = steps.filter(s => s.status === 'complete').length;
  const totalRequired = steps.filter(s => s.required).length;
  const requiredComplete = steps.filter(s => s.required && s.status === 'complete').length;
  const progressPercent = Math.round((requiredComplete / totalRequired) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding' }, { label: 'Employer' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employer Onboarding</h1>
        <p className="text-gray-600 mb-4">
          Complete all required steps to activate your employer portal.
        </p>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">{requiredComplete} of {totalRequired} required steps complete</span>
            <span className="font-medium text-gray-900">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Status banner */}
        {onboarding?.status === 'pending_review' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Application Under Review</p>
              <p className="text-sm text-yellow-700">Our team is reviewing your application. You&apos;ll receive an email when a decision is made (typically 2–3 business days).</p>
            </div>
          </div>
        )}

        {onboarding?.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Application Not Approved</p>
              {onboarding.notes && <p className="text-sm text-red-700 mt-1">{onboarding.notes}</p>}
              <p className="text-sm text-red-700 mt-1">Contact us at (317) 314-3757 if you have questions.</p>
            </div>
          </div>
        )}

        {isApproved && progressPercent === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Onboarding Complete</p>
              <p className="text-sm text-green-700">Your employer portal is fully activated.</p>
              <Link href="/employer/dashboard" className="text-sm font-medium text-green-800 underline mt-1 inline-block">
                Go to Dashboard →
              </Link>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="p-6 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'complete' ? 'bg-green-100' :
                  step.status === 'current' ? 'bg-brand-blue-100' :
                  'bg-gray-100'
                }`}>
                  {step.status === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step.status === 'current' ? (
                    <Icon className="w-5 h-5 text-brand-blue-600" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    {step.required && step.status !== 'complete' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Required</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {step.status === 'current' && (
                  <Link
                    href={step.href}
                    className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-medium whitespace-nowrap"
                  >
                    {step.id === 'mou' ? 'Review & Sign' : 'Continue'}
                  </Link>
                )}
                {step.status === 'complete' && (
                  <span className="text-sm text-green-600 font-medium">Done</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Required documents reference */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-brand-blue-600" />
            Required Documents Checklist
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { label: 'Employer Partnership Agreement (MOU)', done: hasMOU },
              { label: 'General Liability COI ($1M/$2M)', done: false },
              { label: 'Workers\' Compensation Proof', done: false },
              { label: 'Business License or Registration', done: false },
              { label: 'Tax ID (EIN) Verification', done: false },
              { label: 'Supervisor Designation Form', done: false },
            ].map((doc) => (
              <div key={doc.label} className="flex items-center gap-2 text-sm">
                {doc.done ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span className={doc.done ? 'text-green-800' : 'text-gray-700'}>{doc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
