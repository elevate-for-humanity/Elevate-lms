import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { AcknowledgeButton } from './AcknowledgeButton';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Users,
  BarChart,
  MessageSquare,
  Video,
  FileText,
  HelpCircle,
  CheckCircle,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/onboarding',
  },
  title: 'Program Holder Onboarding',
  description:
    'Complete training and orientation for program holders to manage students and access the platform.',
};

export default async function ProgramHolderOnboarding() {
  const { user } = await requireRole(['program_holder', 'admin', 'super_admin', 'staff']);
  const supabase = await createClient();
  const db = await requireAdminClient();

  // Fetch all onboarding state in parallel
  const [profileRes, acksRes, mouSigRes, payrollRes, w9Res] = await Promise.all([
    db
      .from('profiles')
      .select('program_holder_id, full_name, phone, address, city, state, zip')
      .eq('id', user.id)
      .maybeSingle(),
    db.from('program_holder_acknowledgements').select('document_type').eq('user_id', user.id),
    db.from('mou_signatures').select('id, signed_at').eq('user_id', user.id).maybeSingle(),
    db.from('payroll_profiles').select('id, status, bank_name, tax_id_uploaded').eq('user_id', user.id).maybeSingle(),
    db.from('w9_submissions').select('id, verified').eq('user_id', user.id).maybeSingle(),
  ]);

  const holderId = profileRes.data?.program_holder_id ?? null;
  const profile = profileRes.data;

  let holder: any = null;
  if (holderId) {
    const { data } = await db
      .from('program_holders')
      .select('mou_signed, mou_status, hvac_license_url, payout_status, organization_name')
      .eq('id', holderId)
      .maybeSingle();
    holder = data;
  }

  const acks = acksRes.data ?? [];
  const handbookDone = acks.some((a: any) => a.document_type === 'handbook');
  const rightsDone = acks.some((a: any) => a.document_type === 'rights');

  // Digital MOU signature required (paper-only doesn't count)
  const mouDigitallySigned = !!mouSigRes.data;

  // Profile completeness
  const addressComplete = !!(profile?.address && profile?.city && profile?.state && profile?.zip);

  // HVAC license
  const hvacLicenseDone = !!holder?.hvac_license_url;

  // W-9
  const w9Done = !!w9Res.data;

  // Payroll — bank details entered
  const payrollDone = !!(payrollRes.data?.bank_name || payrollRes.data?.status === 'ACTIVE');

  const steps = [
    {
      id: 'mou',
      label: 'Sign the MOU digitally',
      detail: 'The Memorandum of Understanding must be signed online — a paper copy is not sufficient.',
      href: '/program-holder/mou',
      done: mouDigitallySigned,
      required: true,
    },
    {
      id: 'profile',
      label: 'Complete your profile',
      detail: 'Add your business address, city, state, and ZIP code.',
      href: '/program-holder/profile',
      done: addressComplete,
      required: true,
    },
    {
      id: 'hvac_license',
      label: 'Upload HVAC instructor license',
      detail: 'Required for HVAC co-delivery. Upload your Indiana trade license or EPA 608 certification.',
      href: '/program-holder/documents?type=hvac_license',
      done: hvacLicenseDone,
      required: true,
    },
    {
      id: 'w9',
      label: 'Submit W-9 tax form',
      detail: 'Required by the IRS before any payments can be issued. Download, complete, and upload.',
      href: '/onboarding/payroll-setup',
      done: w9Done,
      required: true,
    },
    {
      id: 'payroll',
      label: 'Set up payroll & direct deposit',
      detail: 'Enter your bank account details to receive your 50% revenue share payments.',
      href: '/onboarding/payroll-setup',
      done: payrollDone,
      required: true,
    },
    {
      id: 'handbook',
      label: 'Acknowledge the Program Holder Handbook',
      detail: 'Policies, rules, and platform requirements.',
      href: '/program-holder/handbook',
      done: handbookDone,
      required: true,
    },
    {
      id: 'rights',
      label: 'Acknowledge Rights & Responsibilities',
      detail: 'What you are entitled to and what is required of you.',
      href: '/program-holder/rights-responsibilities',
      done: rightsDone,
      required: false,
    },
  ];

  const requiredSteps = steps.filter((s) => s.required);
  const completedCount = requiredSteps.filter((s) => s.done).length;
  const allDone = requiredSteps.every((s) => s.done);
  const nextStep = steps.find((s) => !s.done);
  const pct = Math.round((completedCount / requiredSteps.length) * 100);

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Program Holder', href: '/program-holder/dashboard' },
          { label: 'Onboarding' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/programs-hero-new-2.webp"
          alt="Program holder training"
          fill
          className="object-cover"
          priority
          quality={95}
          sizes="100vw" placeholder="empty"
        />
      </section>

      {/* Title Section */}
      <section className="py-12 sm:py-16 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4">
            Program Holder Onboarding
          </h1>
          <p className="text-base md:text-lg sm:text-xl text-slate-700 mb-6">
            Complete the steps below to activate your portal and receive payments. Once all required steps are done you&apos;ll
            receive a welcome email and full dashboard access.
          </p>
          <div className="flex flex-wrap gap-4">
            {allDone ? (
              <Link
                href="/program-holder/dashboard"
                className="bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-800 text-lg transition-all"
              >
                Go to Dashboard
              </Link>
            ) : nextStep ? (
              <Link
                href={nextStep.href}
                className="inline-flex items-center gap-2 bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-800 text-lg transition-all"
              >
                Continue: {nextStep.label}
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Onboarding Checklist */}
      <section className="py-10 border-b bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600">
              Required Steps
            </p>
            <span className="text-xs font-bold text-slate-600">{completedCount}/{requiredSteps.length} complete</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-brand-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {allDone ? (
            <div className="mb-6 flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 rounded-xl px-5 py-4">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-brand-green-800">
                All steps complete — your portal is fully activated.
              </p>
            </div>
          ) : (
            <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <Circle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Action required.</strong> Complete all required steps below before your first payment can be issued.
              </p>
            </div>
          )}

          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={step.id}>
                <Link
                  href={step.done ? '#' : step.href}
                  className={`flex items-start gap-4 rounded-xl border p-5 transition-colors ${
                    step.done
                      ? 'bg-white border-brand-green-200 cursor-default'
                      : 'bg-white border-slate-200 hover:border-brand-blue-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {step.done ? (
                      <CheckCircle className="w-5 h-5 text-brand-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {i + 1}. {step.label}
                      </p>
                      {!step.done && step.required && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">Required</span>
                      )}
                      {step.done && (
                        <span className="text-xs font-bold text-brand-green-700 bg-brand-green-50 border border-brand-green-200 rounded-full px-2 py-0.5">Done</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                  </div>
                  {!step.done && (
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What is a Program Holder */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
            What is a Program Holder?
          </h2>
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <p className="text-lg text-black mb-4">
              A <strong>Program Holder</strong> is an organization or entity that partners with
              {PLATFORM_DEFAULTS.orgName} to deliver workforce training programs to students. As a program
              holder, you are responsible for:
            </p>
            <ul className="space-y-3 text-black">
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Enrolling students</strong> in approved training programs
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Tracking student progress</strong> through the platform
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Providing support</strong> to students during their training
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Reporting outcomes</strong> and completion data
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Maintaining compliance</strong> with program requirements
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">Getting Started</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-blue-700">1</span>
              </div>
              <h3 className="text-lg font-bold mb-3">Apply</h3>
              <p className="text-black mb-4">
                Submit your program holder application with organization details and program
                interests.
              </p>
              <Link
                href="/program-holder/onboarding"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                Apply Now →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-blue-700">2</span>
              </div>
              <h3 className="text-lg font-bold mb-3">Get Approved</h3>
              <p className="text-black mb-4">
                Our team will review your application and contact you within 2-3 business days.
              </p>
              <span className="text-slate-500 text-sm">Approval typically takes 2-3 days</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-blue-700">3</span>
              </div>
              <h3 className="text-lg font-bold mb-3">Access Dashboard</h3>
              <p className="text-black mb-4">
                Once approved, log in to your dashboard and start enrolling students.
              </p>
              <Link href="/login" className="text-brand-blue-700 font-semibold hover:underline">
                Log In →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Navigation */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
            Navigating Your Dashboard
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-brand-blue-700" size={24} />
                </div>
                <h3 className="text-lg font-bold">Student Management</h3>
              </div>
              <p className="text-black mb-4">
                View all your enrolled students, track their progress, and manage enrollments. You
                can see completion rates, active courses, and student status at a glance.
              </p>
              <ul className="space-y-2 text-sm text-black">
                <li>• View student list with status</li>
                <li>• Enroll new students in programs</li>
                <li>• Track individual progress</li>
                <li>• Export student data</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart className="text-brand-blue-700" size={24} />
                </div>
                <h3 className="text-lg font-bold">Reports & Analytics</h3>
              </div>
              <p className="text-black mb-4">
                Access detailed reports on student outcomes, completion rates, and program
                performance. Generate reports for compliance and funding requirements.
              </p>
              <ul className="space-y-2 text-sm text-black">
                <li>• Completion rate reports</li>
                <li>• Student outcome tracking</li>
                <li>• Compliance documentation</li>
                <li>• Export to PDF/Excel</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-brand-blue-700" size={24} />
                </div>
                <h3 className="text-lg font-bold">Communication</h3>
              </div>
              <p className="text-black mb-4">
                Send messages to students, receive notifications about progress, and communicate
                with Elevate staff for support.
              </p>
              <ul className="space-y-2 text-sm text-black">
                <li>• Message individual students</li>
                <li>• Broadcast announcements</li>
                <li>• Receive progress notifications</li>
                <li>• Contact support team</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-brand-blue-700" size={24} />
                </div>
                <h3 className="text-lg font-bold">Program Access</h3>
              </div>
              <p className="text-black mb-4">
                Browse available training programs, view curriculum details, and enroll students in
                approved programs or need assistance.
              </p>
              <ul className="space-y-2 text-sm text-black">
                <li>• View all available programs</li>
                <li>• See program requirements</li>
                <li>• Check funding eligibility</li>
                <li>• Enroll students directly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">Your Responsibilities</h2>
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">Student Support</h3>
                <p className="text-black">
                  Provide guidance and support to students throughout their training. This includes
                  answering questions, helping with technical issues, and ensuring students stay
                  engaged with their coursework.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Progress Monitoring</h3>
                <p className="text-black">
                  Regularly check student progress through the dashboard. Identify students who may
                  be falling behind and provide additional support or intervention as needed.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Compliance & Reporting</h3>
                <p className="text-black">
                  Maintain accurate records of student enrollments, progress, and completions.
                  Submit required reports on time and ensure all documentation meets state and
                  federal requirements.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Communication</h3>
                <p className="text-black">
                  Maintain regular communication with students and Elevate staff. Respond to
                  messages within 24-48 hours and keep students informed of important updates or
                  changes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Quality Assurance</h3>
                <p className="text-black">
                  Ensure students are receiving quality training and support. Report any issues or
                  concerns to Elevate staff immediately and work collaboratively to resolve
                  problems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">Resources & Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/docs/program-holder-guide"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="text-brand-blue-700" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">User Guide</h3>
              <p className="text-black mb-4">
                Complete documentation on using the platform, managing students, and accessing
                features.
              </p>
              <span className="text-brand-blue-700 font-semibold">View Guide →</span>
            </Link>

            <Link
              href="/program-holder/training"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex-items-center justify-center mb-4">
                <Video className="text-brand-blue-700" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Video Tutorials</h3>
              <p className="text-black mb-4">
                Step-by-step video guides showing how to use key features and manage students.
              </p>
              <span className="text-brand-blue-700 font-semibold">Watch Videos →</span>
            </Link>

            <Link
              href="/support"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <HelpCircle className="text-brand-blue-700" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Get Support</h3>
              <p className="text-black mb-4">
                Contact our support team for help with technical issues, questions, or concerns.
              </p>
              <span className="text-brand-blue-700 font-semibold">Contact Support →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">How do I enroll a new student?</h3>
              <p className="text-black">
                From your dashboard, click "Enroll Student" and enter their information. Select the
                program they'll be enrolled in, and submit. The student will receive an email with
                login instructions.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">How do I track student progress?</h3>
              <p className="text-black">
                Go to your dashboard and click on any student's name to view their detailed
                progress. You'll see courses completed, current progress, grades, and time spent in
                training.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">What reports do I need to submit?</h3>
              <p className="text-black">
                Monthly progress reports are required, showing student enrollments, completions, and
                outcomes. These can be generated automatically from your dashboard under "Reports."
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">Who do I contact for technical support?</h3>
              <p className="text-black">
                Email{' '}
                <a href="/contact" className="text-brand-blue-700 font-semibold hover:underline">
                  our contact form
                </a>{' '}
                or call{' '}
                <a href="/support" className="text-brand-blue-700 font-semibold hover:underline">
                  support center
                </a>{' '}
                for immediate assistance.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">
                Can I enroll students in multiple programs?
              </h3>
              <p className="text-black">
                Yes! Students can be enrolled in multiple programs simultaneously. Each enrollment
                is tracked separately in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-base md:text-lg text-white mb-8">
            Apply now to become a program holder and start enrolling students in life-changing
            training programs or need assistance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/program-holder/onboarding"
              className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg transition-all"
            >
              Apply Now
            </Link>
            <Link
              href="/support"
              className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
