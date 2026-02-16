import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Upload,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verification | Program Holder Portal',
  description: 'Complete your program holder verification',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/verification',
  },
};

export default async function VerificationPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Verification" }]} />
        </div>
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

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') {
    redirect('/');
  }

  // Fetch program holder data
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch uploaded documents
  const { data: documents } = await supabase
    .from('program_holder_documents')
    .select('*')
    .eq('user_id', user.id);

  // Check verification requirements
  const requirements = [
    {
      id: 'license',
      label: 'Business License',
      description: 'Current business license or registration',
      required: true,
      completed: documents?.some(
        (d) => d.document_type === 'license' && d.status === 'approved'
      ),
    },
    {
      id: 'insurance',
      label: 'Liability Insurance',
      description: 'Proof of general liability insurance',
      required: true,
      completed: documents?.some(
        (d) => d.document_type === 'insurance' && d.status === 'approved'
      ),
    },
    {
      id: 'accreditation',
      label: 'Accreditation',
      description: 'Relevant accreditation or certification documents',
      required: false,
      completed: documents?.some(
        (d) => d.document_type === 'accreditation' && d.status === 'approved'
      ),
    },
    {
      id: 'background',
      label: 'Background Check',
      description: 'Background check authorization and results',
      required: true,
      completed: documents?.some(
        (d) => d.document_type === 'background_check' && d.status === 'approved'
      ),
    },
  ];

  const requiredCompleted = requirements.filter(
    (r) => r.required && r.completed
  ).length;
  const requiredTotal = requirements.filter((r) => r.required).length;
  const isVerified = programHolder?.status === 'approved';
  const verificationProgress = (requiredCompleted / requiredTotal) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Verification" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/efh/hero/hero-main-clean.jpg"
          alt="Verification"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Program Holder Verification
          </h1>
          <p className="text-lg text-gray-100">
            Complete your verification to start accepting students
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Status Banner */}
            {isVerified ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
                <div className="flex items-start">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-1">
                      Verification Complete
                    </h3>
                    <p className="text-green-800">
                      Your program holder account has been verified and
                      approved.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-brand-blue-50 border-l-4 border-brand-blue-500 p-6 mb-8">
                <div className="flex items-start">
                  <AlertCircle className="h-10 w-10 text-brand-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-brand-blue-900 mb-1">
                      Verification In Progress
                    </h3>
                    <p className="text-brand-blue-800 mb-2">
                      Complete all required steps to get verified.
                    </p>
                    <div className="w-full bg-brand-blue-200 rounded-full h-2 mt-3">
                      <div
                        className="bg-brand-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${verificationProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-brand-blue-700 mt-2">
                      {requiredCompleted} of {requiredTotal} required items
                      completed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Checklist */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                Verification Requirements
              </h2>

              <div className="space-y-4">
                {requirements.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-start p-4 rounded-lg border-2 ${
                      req.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {req.completed ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <FileText className="h-10 w-10 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-black">
                          {req.label}
                        </h3>
                        {req.required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-black mt-1">
                        {req.description}
                      </p>
                      {req.completed && (
                        <p className="text-sm text-green-700 font-medium mt-2">
                          • Document approved
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/program-holder/documents"
                  className="inline-flex items-center justify-center px-6 py-3 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Documents
                </Link>
                <Link
                  href="/program-holder/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-black font-semibold rounded-lg border-2 border-slate-300 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-brand-blue-900 mb-2">
                Need Help?
              </h3>
              <p className="text-brand-blue-800 mb-4">
                Contact our team for assistance with the verification process.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:elevate4humanityedu@gmail.com"
                  className="inline-flex items-center text-brand-blue-900 hover:text-brand-blue-700 font-medium"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </a>
                <a
                  href="/support"
                  className="inline-flex items-center text-brand-blue-900 hover:text-brand-blue-700 font-medium"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
