import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  PartyPopper,
CheckCircle, } from 'lucide-react';
import ConfettiWrapper from '@/components/ConfettiWrapper';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Enrollment Successful | Elevate for Humanity',
  description: 'Your enrollment was successful. Welcome to Elevate for Humanity!',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/enroll/success',
  },
};

export const dynamic = 'force-dynamic';

export default async function EnrollSuccessPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get next steps content
  const { data: nextSteps } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('page', 'enroll-success')
    .eq('section', 'next-steps')
    .order('order', { ascending: true });

  // Get contact info
  const { data: contactInfo } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'enrollment_contact')
    .single();

  const defaultNextSteps = [
    {
      step: 1,
      title: 'Start Your First Lesson',
      description: 'Your course is ready. Click below to begin learning immediately.',
    },
    {
      step: 2,
      title: 'Track Your Progress',
      description: 'See your completion percentage, deadlines, and announcements.',
    },
    {
      step: 3,
      title: 'Upload Required Items',
      description: 'Submit any additional documents needed for your program.',
    },
    {
      step: 4,
      title: 'Complete & Earn Certificate',
      description: 'When you complete the course requirements, your certificate is issued automatically.',
    },
  ];

  const displayNextSteps = nextSteps && nextSteps.length > 0 ? nextSteps : defaultNextSteps;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Enroll', href: '/enroll' }, { label: 'Success' }]} />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
      <ConfettiWrapper />
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green-600 rounded-full mb-6 animate-bounce">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">
            <PartyPopper className="w-8 h-8 inline-block mr-2" aria-hidden="true" />
            Access Unlocked!
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Go to Student Portal to start.
          </p>
          <p className="text-base text-gray-500">
            Our system has created your student access, assigned your course, and unlocked your learning dashboard. You don't have to wait for someone to manually add you.
          </p>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-black mb-6">
            Welcome to Your Student Portal
          </h2>

          <div className="space-y-6">
            {displayNextSteps.map((item: any, index: number) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step || index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-brand-blue-50 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Need Help?</h3>
          <div className="space-y-3">
            <a 
              href="/support" 
              className="flex items-center gap-3 text-gray-700 hover:text-brand-blue-600"
            >
              <span>Visit our Help Center →</span>
            </a>
            <a 
              href="mailto:info@elevateforhumanity.org" 
              className="flex items-center gap-3 text-gray-700 hover:text-brand-blue-600"
            >
              <Mail className="w-5 h-5" />
              <span>info@elevateforhumanity.org</span>
            </a>
          </div>
        </div>

        {/* Primary Action - Start Onboarding */}
        <div className="mb-6">
          <Link
            href="/student-portal/onboarding"
            className="block w-full bg-brand-green-600 text-white px-6 py-4 rounded-lg font-bold text-center text-lg hover:bg-brand-green-700 transition"
          >
            <ArrowRight className="w-5 h-5 inline-block mr-2" />
            Start Onboarding Now
          </Link>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-brand-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-brand-green-900">Check Your Email</p>
              <p className="text-sm text-brand-green-700">
                We&apos;ve sent a welcome letter to your email with important information about your program, 
                next steps, and how to get started.
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/learner/dashboard"
            className="flex-1 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-brand-blue-700 transition"
          >
            Student Dashboard
          </Link>
          <Link
            href="/account/billing"
            className="flex-1 border border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-lg font-semibold text-center hover:bg-brand-blue-50 transition"
          >
            View Payment Plan
          </Link>
        </div>

        {/* Schedule Orientation */}
        <div className="mt-8 text-center">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 text-brand-blue-600 font-medium hover:underline"
          >
            <Calendar className="w-5 h-5" />
            Schedule Your Orientation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
