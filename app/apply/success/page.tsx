import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, Phone, Calendar, CheckCircle, KeyRound, UserCheck, FileText, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Application Submitted | Elevate for Humanity',
  description: 'Your application has been successfully submitted.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/success',
  },
};

export const dynamic = 'force-dynamic';

const STUDENT_STEPS = [
  {
    icon: <Mail className="w-5 h-5 text-brand-blue-600" />,
    title: 'Check your email',
    description: 'We sent a confirmation with your reference number and onboarding instructions. Check spam if you don\'t see it within a few minutes.',
  },
  {
    icon: <KeyRound className="w-5 h-5 text-brand-blue-600" />,
    title: 'Set your password',
    description: 'We created your student account. Go to the password reset page and enter the email you applied with to set your password.',
    link: '/forgot-password',
    linkLabel: 'Set Password',
  },
  {
    icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />,
    title: 'Log in and complete your profile',
    description: 'Once you set your password, log in to your student dashboard. You\'ll be guided through your profile, agreements, and handbook.',
    link: '/login',
    linkLabel: 'Sign In',
  },
  {
    icon: <FileText className="w-5 h-5 text-brand-blue-600" />,
    title: 'Upload required documents',
    description: 'Upload your government-issued photo ID and proof of residence. These are required before enrollment is activated.',
  },
  {
    icon: <BookOpen className="w-5 h-5 text-brand-blue-600" />,
    title: 'Complete orientation',
    description: 'A short orientation (about 10 minutes) covers program expectations, your responsibilities, and what we handle for you.',
  },
];

const ROLE_CONFIG: Record<string, {
  title: string;
  message: string;
  steps: typeof STUDENT_STEPS;
  primaryLink: string;
  primaryLabel: string;
}> = {
  student: {
    title: 'Application Received',
    message: 'Your application has been received and your account is ready. Complete the onboarding steps below to get enrolled.',
    steps: STUDENT_STEPS,
    primaryLink: '/forgot-password',
    primaryLabel: 'Set Your Password',
  },
  'program-holder': {
    title: 'Partnership Application Submitted',
    message: 'Our team will review your organization details and contact you within 2 business days to discuss partnership options.',
    steps: [
      { icon: <Mail className="w-5 h-5 text-brand-blue-600" />, title: 'Check your email', description: 'We sent a confirmation with your reference number.' },
      { icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />, title: 'Team review', description: 'Our partnerships team will review your submission and reach out to discuss licensing and platform access.' },
      { icon: <Calendar className="w-5 h-5 text-brand-blue-600" />, title: 'Schedule a call', description: 'You can also schedule a meeting with our team to discuss your program goals.', link: '/booking', linkLabel: 'Book a Meeting' },
    ],
    primaryLink: '/programs',
    primaryLabel: 'Browse Programs',
  },
  employer: {
    title: 'Employer Application Submitted',
    message: 'Our employer relations team will review your submission and contact you within 2 business days.',
    steps: [
      { icon: <Mail className="w-5 h-5 text-brand-blue-600" />, title: 'Check your email', description: 'We sent a confirmation with your reference number.' },
      { icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />, title: 'Team review', description: 'Our employer relations team will contact you to discuss hiring needs, WOTC credits, and OJT reimbursement.' },
      { icon: <Calendar className="w-5 h-5 text-brand-blue-600" />, title: 'Schedule a call', description: 'You can also schedule a meeting to discuss your workforce needs.', link: '/booking', linkLabel: 'Book a Meeting' },
    ],
    primaryLink: '/employer',
    primaryLabel: 'Employer Resources',
  },
  staff: {
    title: 'Staff Application Submitted',
    message: 'HR will review your application. Qualified candidates will be contacted for interviews.',
    steps: [
      { icon: <Mail className="w-5 h-5 text-brand-blue-600" />, title: 'Check your email', description: 'We sent a confirmation with your reference number.' },
      { icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />, title: 'HR review', description: 'Our HR team will review your application and contact qualified candidates for interviews.' },
    ],
    primaryLink: '/',
    primaryLabel: 'Return Home',
  },
};

const ENROLLED_CONFIG = {
  title: "Application Submitted!",
  message: "Your account has been created. We sent you an email with a one-click login link — open it to start your onboarding.",
  steps: [
    { icon: <Mail className="w-5 h-5 text-brand-blue-600" />, title: 'Check your email now', description: 'Look for an email from Elevate for Humanity. It contains a magic login link — click "Start My Onboarding" to sign in instantly. No password needed. Check your spam folder if you don\'t see it within a few minutes.' },
    { icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />, title: 'Complete your onboarding steps', description: 'After clicking the link, you\'ll land on your onboarding page. Fill in your profile, upload your ID, confirm funding, and complete a short orientation.' },
    { icon: <BookOpen className="w-5 h-5 text-brand-blue-600" />, title: 'Get enrolled and start learning', description: 'Once all onboarding steps are done, you\'re automatically enrolled and your courses unlock in the student dashboard.' },
  ],
  primaryLink: '/login',
  primaryLabel: 'Or Sign In With Password',
};

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; ref?: string; enrolled?: string }>;
}) {
  const params = await searchParams;
  const role = params.role || 'student';
  const referenceNumber = params.ref || null;
  const isEnrolled = params.enrolled === 'true';
  const config = isEnrolled ? ENROLLED_CONFIG : (ROLE_CONFIG[role] || ROLE_CONFIG.student);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Success' }]} />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-brand-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title}
            </h1>
            <p className="text-lg text-gray-600">{config.message}</p>
            {referenceNumber && (
              <div className="mt-4 inline-block bg-brand-green-50 border border-brand-green-200 rounded-lg px-4 py-2">
                <span className="text-sm text-brand-green-700">Reference: </span>
                <span className="font-mono font-bold text-brand-green-900">{referenceNumber}</span>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold mb-6">{isEnrolled ? 'Next Steps' : 'Complete Your Onboarding'}</h2>
            <ol className="space-y-5">
              {config.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-brand-blue-700 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                    {'link' in step && step.link && (
                      <Link
                        href={step.link}
                        className="inline-flex items-center gap-1.5 text-brand-blue-600 hover:text-brand-blue-800 font-medium text-sm mt-2"
                      >
                        {step.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Timeline Notice */}
          {role === 'student' && !isEnrolled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-amber-900 mb-1">WorkOne / Funding Verification</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                If you&apos;re applying for WIOA or Workforce Ready Grant funding, we&apos;ll coordinate with WorkOne on your behalf.
                This process typically takes 3-5 business days. You can begin onboarding while funding is being verified.
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-brand-blue-50 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-brand-blue-900 mb-3">Questions?</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/support"
                className="flex items-center gap-2 text-brand-blue-600 hover:underline text-sm"
              >
                <Phone className="w-4 h-4" />
                Get Help Online
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 text-brand-blue-600 hover:underline text-sm"
              >
                <Mail className="w-4 h-4" />
                Contact Us
              </Link>
              <Link
                href="/booking"
                className="flex items-center gap-2 text-brand-blue-600 hover:underline text-sm"
              >
                <Calendar className="w-4 h-4" />
                Schedule a Meeting
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={config.primaryLink}
              className="flex-1 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-brand-blue-700 transition inline-flex items-center justify-center gap-2"
            >
              {config.primaryLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-50 transition"
            >
              Return Home
            </Link>
          </div>

          {/* Track Application */}
          <div className="mt-6 text-center">
            <Link
              href="/apply/track"
              className="text-brand-blue-600 hover:underline text-sm font-medium"
            >
              Track your application status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
