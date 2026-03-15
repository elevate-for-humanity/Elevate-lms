import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignMOUForm } from './SignMOUForm';
import { FileText, Shield } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign MOU | Elevate For Humanity',
  description:
    'Review and digitally sign your Program Partner Memorandum of Understanding.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/sign-mou',
  },
};

export default async function SignMOUPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Sign Mou" }]} />
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

  return (
    <div className="min-h-screen   ">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Sign Mou" }]} />
        </div>
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <InstitutionalHeader
            documentType="Memorandum of Understanding"
            title="Program Partner Agreement"
            subtitle="Review and digitally sign your partnership agreement."
            noDivider
          />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <Shield className="text-brand-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-black text-sm">
              Legally Binding
            </h3>
            <p className="text-xs text-black mt-1">
              Digital signatures have the same legal effect as handwritten
              signatures
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <h3 className="font-semibold text-black text-sm">
              Secure Process
            </h3>
            <p className="text-xs text-black mt-1">
              Your signature is encrypted and stored securely
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <FileText className="text-brand-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-black text-sm">
              Instant Processing
            </h3>
            <p className="text-xs text-black mt-1">
              Receive confirmation immediately upon signing
            </p>
          </div>
        </div>

        {/* MOU Document */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            Program Partner Memorandum of Understanding
          </h2>

          <div className="prose prose-slate max-w-none space-y-4 text-sm">
            <p>
              This Memorandum of Understanding ("MOU") is entered into between{' '}
              <strong>Elevate for Humanity</strong> ("EFH") and the Program
              Partner identified below.
            </p>

            <h3 className="text-lg font-semibold text-black mt-6 mb-3">
              Purpose
            </h3>
            <p>
              This MOU establishes a partnership to provide workforce
              development training and apprenticeship opportunities to eligible
              participants through WIOA-funded programs.
            </p>

            <h3 className="text-lg font-semibold text-black mt-6 mb-3">
              Program Partner Responsibilities
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide on-the-job training and mentorship to apprentices</li>
              <li>Maintain a safe and compliant work environment</li>
              <li>Track and report apprentice hours and progress</li>
              <li>Comply with all applicable labor laws and regulations</li>
              <li>Participate in program evaluations and reporting</li>
            </ul>

            <h3 className="text-lg font-semibold text-black mt-6 mb-3">
              EFH Responsibilities
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide classroom instruction and curriculum</li>
              <li>Recruit and screen qualified apprentices</li>
              <li>Provide ongoing support and case management</li>
              <li>Handle WIOA compliance and reporting</li>
              <li>Facilitate wage reimbursement (if applicable)</li>
            </ul>

            <h3 className="text-lg font-semibold text-black mt-6 mb-3">
              Term
            </h3>
            <p>
              This MOU shall remain in effect for one (1) year from the date of
              execution and may be renewed by mutual agreement of both parties.
            </p>

            <h3 className="text-lg font-semibold text-black mt-6 mb-3">
              Termination
            </h3>
            <p>
              Either party may terminate this MOU with thirty (30) days written
              notice to the other party.
            </p>
          </div>
        </div>

        {/* Signature Form */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-black mb-6">
            Sign Agreement
          </h2>
          <SignMOUForm />
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-black">
            Questions?{' '}
            <Link
              href="/contact"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              Contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
