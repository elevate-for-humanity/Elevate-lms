import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  DollarSign,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/onboarding',
  },
  title: 'Program Holder Onboarding | Elevate For Humanity',
  description:
    'Complete training and orientation for program holders to manage students and access the platform.',
};

export default async function ProgramHolderOnboarding() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch onboarding resources
  const { data: resources } = await db
    .from('onboarding_resources')
    .select('*')
    .eq('role', 'program_holder')
    .order('order_index');
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Program Holder', href: '/program-holder/dashboard' },
          { label: 'Onboarding' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] w-full overflow-hidden bg-white">
        <Image
          src="/images/pages/programs-hero-new-2.jpg"
          alt="Program holder training"
          fill
          className="object-cover"
          priority
          quality={95}
          sizes="100vw"
        />
      </section>

      {/* Title Section */}
      <section className="py-12 sm:py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-4">
            Program Holder Onboarding
          </h1>
          <p className="text-base md:text-lg sm:text-xl text-black mb-6">
            Welcome! This guide will help you understand your role, navigate the
            platform, and manage your students effectively.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/program-holder/dashboard"
              className="bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-800 text-lg transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/program-holder/onboarding"
              className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-white border-2 border-slate-300 text-lg transition-all"
            >
              Apply as Program Holder
            </Link>
          </div>
        </div>
      </section>

      {/* What is a Program Holder */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
            What is a Program Holder?
          </h2>
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <p className="text-lg text-black mb-4">
              A <strong>Program Holder</strong> is an organization or entity
              that partners with Elevate for Humanity to deliver workforce
              training programs to students. As a program holder, you are
              responsible for:
            </p>
            <ul className="space-y-3 text-black">
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Enrolling students</strong> in approved training
                  programs
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Tracking student progress</strong> through the
                  platform
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>
                  <strong>Providing support</strong> to students during their
                  training
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
                  <strong>Maintaining compliance</strong> with program
                  requirements
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
            Getting Started
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-blue-700">1</span>
              </div>
              <h3 className="text-lg font-bold mb-3">Apply</h3>
              <p className="text-black mb-4">
                Submit your program holder application with organization details
                and program interests.
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
                Our team will review your application and contact you within 2-3
                business days.
              </p>
              <span className="text-slate-500 text-sm">
                Approval typically takes 2-3 days
              </span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-blue-700">3</span>
              </div>
              <h3 className="text-lg font-bold mb-3">Access Dashboard</h3>
              <p className="text-black mb-4">
                Once approved, log in to your dashboard and start
                enrolling students.
              </p>
              <Link
                href="/login"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                Log In →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-green-700">4</span>
              </div>
              <h3 className="text-lg font-bold mb-3">Set Up Payroll</h3>
              <p className="text-black mb-4">
                Connect your bank account or Elevate Pay Card, submit your W-9,
                and configure payroll for your staff.
              </p>
              <Link
                href="/program-holder/payroll"
                className="text-brand-green-700 font-semibold hover:underline"
              >
                Payroll Setup →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Navigation */}
      <section className="py-16 bg-white">
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
                View all your enrolled students, track their progress, and
                manage enrollments. You can see completion rates, active
                courses, and student status at a glance.
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
                Access detailed reports on student outcomes, completion rates,
                and program performance. Generate reports for compliance and
                funding requirements.
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
                Send messages to students, receive notifications about progress,
                and communicate with Elevate staff for support.
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
                Browse available training programs, view curriculum details, and
                enroll students in approved programs or need assistance.
              </p>
              <ul className="space-y-2 text-sm text-black">
                <li>• View all available programs</li>
                <li>• See program requirements</li>
                <li>• Check funding eligibility</li>
                <li>• Enroll students directly</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-brand-green-700" size={24} />
                </div>
                <h3 className="text-lg font-bold">Payroll &amp; Payouts</h3>
              </div>
              <p className="text-black mb-4">
                Set up your payout method, run bi-weekly payroll for your staff,
                and view your earnings history — all from your dashboard.
              </p>
              <ul className="space-y-2 text-sm text-black">
                <li>• Connect bank account or pay card</li>
                <li>• Submit W-9 for tax compliance</li>
                <li>• Run payroll for your team</li>
                <li>• View pay stubs and YTD earnings</li>
              </ul>
              <Link
                href="/program-holder/payroll"
                className="inline-block mt-4 text-brand-green-700 font-semibold hover:underline text-sm"
              >
                Set Up Payroll →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
            Your Responsibilities
          </h2>
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">Student Support</h3>
                <p className="text-black">
                  Provide guidance and support to students throughout their
                  training. This includes answering questions, helping with
                  technical issues, and ensuring students stay engaged with
                  their coursework.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Progress Monitoring</h3>
                <p className="text-black">
                  Regularly check student progress through the dashboard.
                  Identify students who may be falling behind and provide
                  additional support or intervention as needed.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">
                  Compliance & Reporting
                </h3>
                <p className="text-black">
                  Maintain accurate records of student enrollments, progress,
                  and completions. Submit required reports on time and ensure
                  all documentation meets state and federal requirements.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Communication</h3>
                <p className="text-black">
                  Maintain regular communication with students and Elevate
                  staff. Respond to messages within 24-48 hours and keep
                  students informed of important updates or changes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Quality Assurance</h3>
                <p className="text-black">
                  Ensure students are receiving quality training and support.
                  Report any issues or concerns to Elevate staff immediately and
                  work collaboratively to resolve problems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
            Resources & Support
          </h2>
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
                Complete documentation on using the platform, managing students,
                and accessing features.
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
                Step-by-step video guides showing how to use key features and
                manage students.
              </p>
              <span className="text-brand-blue-700 font-semibold">
                Watch Videos →
              </span>
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
                Contact our support team for help with technical issues,
                questions, or concerns.
              </p>
              <span className="text-brand-blue-700 font-semibold">
                Contact Support →
              </span>
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
              <h3 className="text-lg font-bold mb-2">
                How do I enroll a new student?
              </h3>
              <p className="text-black">
                From your dashboard, click "Enroll Student" and enter their
                information. Select the program they'll be enrolled in, and
                submit. The student will receive an email with login
                instructions.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">
                How do I track student progress?
              </h3>
              <p className="text-black">
                Go to your dashboard and click on any student's name to view
                their detailed progress. You'll see courses completed, current
                progress, grades, and time spent in training.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">
                What reports do I need to submit?
              </h3>
              <p className="text-black">
                Monthly progress reports are required, showing student
                enrollments, completions, and outcomes. These can be generated
                automatically from your dashboard under "Reports."
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-2">
                Who do I contact for technical support?
              </h3>
              <p className="text-black">
                Email{' '}
                <a
                  href="/contact"
                  className="text-brand-blue-700 font-semibold hover:underline"
                >
                  our contact form
                </a>{' '}
                or call{' '}
                <a
                  href="/support"
                  className="text-brand-blue-700 font-semibold hover:underline"
                >
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
                Yes! Students can be enrolled in multiple programs
                simultaneously. Each enrollment is tracked separately in your
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need Help?
          </h2>
          <p className="text-base md:text-lg text-brand-blue-100 mb-8">
            Apply now to become a program holder and start enrolling students in
            life-changing training programs or need assistance.
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
