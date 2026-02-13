import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail, Phone, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Application Submitted | Elevate for Humanity',
  description: 'Your application has been successfully submitted.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/success',
  },
};

export const dynamic = 'force-dynamic';

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; ref?: string }>;
}) {
  const params = await searchParams;
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
  const role = params.role || 'student';
  const referenceNumber = params.ref || null;

  // Get next steps content from database
  const { data: nextStepsContent } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('page', 'apply-success')
    .eq('section', role)
    .order('order', { ascending: true });

  // Get contact info
  const { data: contactInfo } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'enrollment_contact')
    .single();

  const roleMessages: Record<string, any> = {
    student: {
      title: 'Student Application Submitted!',
      message:
        "We've received your application and will review it within 1-2 business days.",
      nextSteps: nextStepsContent?.map((c: any) => c.content) || [
        'Check your email for a confirmation message',
        'A team member will contact you to discuss program options',
        "We'll help you explore funding options like WIOA, WRG, and apprenticeships",
        "Once approved, you'll receive access to your student dashboard",
      ],
      dashboardLink: '/lms/dashboard',
      dashboardText: 'Student Dashboard',
    },
    'program-holder': {
      title: 'Partnership Application Submitted!',
      message:
        "Thank you for your interest in partnering with us. We'll review your application and contact you soon.",
      nextSteps: [
        'Our team will review your organization details',
        "We'll schedule a call to discuss partnership opportunities",
        'You will receive information about licensing options',
        'Access to partner portal upon approval',
      ],
      dashboardLink: '/partner/dashboard',
      dashboardText: 'Partner Dashboard',
    },
    employer: {
      title: 'Employer Application Submitted!',
      message:
        "Thank you for your interest in hiring our graduates. We'll be in touch soon.",
      nextSteps: [
        'Our employer relations team will review your submission',
        "We'll contact you to discuss your hiring needs",
        'You will receive access to candidate profiles',
        'Schedule interviews with qualified graduates',
      ],
      dashboardLink: '/employer/dashboard',
      dashboardText: 'Employer Dashboard',
    },
    staff: {
      title: 'Staff Application Submitted!',
      message:
        "Thank you for your interest in joining our team. We'll review your application.",
      nextSteps: [
        'HR will review your application',
        'Qualified candidates will be contacted for interviews',
        'Background check will be conducted for selected candidates',
        'Onboarding begins upon offer acceptance',
      ],
      dashboardLink: '/careers',
      dashboardText: 'View Open Positions',
    },
  };

  const currentRole = roleMessages[role] || roleMessages.student;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Success' }]} />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {currentRole.title}
          </h1>
          <p className="text-lg text-gray-600">{currentRole.message}</p>
          {referenceNumber && (
            <div className="mt-4 inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="text-sm text-green-700">Confirmation ID: </span>
              <span className="font-mono font-bold text-green-900">{referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
          <h2 className="text-xl font-bold mb-6">What Happens Next</h2>
          <ol className="space-y-4">
            {currentRole.nextSteps.map((step: string, index: number) => (
              <li key={index} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-700 pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Questions? Contact Us</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/support"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Mail className="w-5 h-5" />
              elevate4humanityedu@gmail.com
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={currentRole.dashboardLink}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-blue-700 transition inline-flex items-center justify-center gap-2"
          >
            {currentRole.dashboardText}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-50 transition"
          >
            Return Home
          </Link>
        </div>

        {/* Schedule Call */}
        <div className="mt-8 text-center">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
          >
            <Calendar className="w-5 h-5" />
            Schedule a call with our team
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
