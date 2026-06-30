import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  UserCheck,
  FileText,
  BookOpen,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ResendMagicLinkForm } from '@/components/auth/ResendMagicLinkForm';
import { ConversionPixel } from '@/components/analytics/ConversionPixel';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Funding sources that require Indiana Career Connect / WorkOne referral
const WORKFORCE_FUNDING = [
  'wioa',
  'workone',
  'workforce ready grant',
  'employindy',
  'impact',
  'dwd',
  'workforce',
  'fssa',
];
function needsCareerConnect(funding: string | null): boolean {
  if (!funding) return false;
  const f = funding.toLowerCase();
  return WORKFORCE_FUNDING.some((k) => f.includes(k));
}

export const metadata: Metadata = {
  title: 'Application Submitted',
  description: 'Your application has been successfully submitted.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/success',
  },
};

export const revalidate = 600;

const STUDENT_STEPS = [
  {
    icon: <Mail className="w-5 h-5 text-brand-blue-600" />,
    title: 'Check your email',
    description:
      "We sent a secure sign-in link to your email address. Use it to access your account, upload documents, and track your application. Check spam if you don't see it within a few minutes.",
  },
  {
    icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />,
    title: 'Log in and complete your profile',
    description:
      "Once you set your password, log in to your student dashboard. You'll be guided through your profile, agreements, and handbook.",
    link: '/login',
    linkLabel: 'Sign In',
  },
  {
    icon: <FileText className="w-5 h-5 text-brand-blue-600" />,
    title: 'Upload required documents',
    description:
      'Upload your government-issued photo ID and proof of residence. These are required before enrollment is activated.',
  },
  {
    icon: <BookOpen className="w-5 h-5 text-brand-blue-600" />,
    title: 'Complete orientation',
    description:
      'A short orientation (about 10 minutes) covers program expectations, your responsibilities, and what we handle for you.',
  },
];

const ROLE_CONFIG: Record<
  string,
  {
    title: string;
    message: string;
    steps: typeof STUDENT_STEPS;
    primaryLink: string;
    primaryLabel: string;
  }
> = {
  student: {
    title: 'Application Received',
    message:
      'Your application has been received. We sent a secure sign-in link to your email — use it to access your account and complete onboarding.',
    steps: STUDENT_STEPS,
    primaryLink: '/login?redirect=/onboarding/learner',
    primaryLabel: 'Sign In',
  },
  'program-holder': {
    title: 'Partnership Application Submitted',
    message:
      'Our team will review your organization details and contact you within 2 business days to discuss partnership options.',
    steps: [
      {
        icon: <Mail className="w-5 h-5 text-brand-blue-600" />,
        title: 'Check your email',
        description: 'We sent a confirmation with your reference number.',
      },
      {
        icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />,
        title: 'Team review',
        description:
          'Our partnerships team will review your submission and reach out to discuss licensing and platform access.',
      },
      {
        icon: <Calendar className="w-5 h-5 text-brand-blue-600" />,
        title: 'Schedule a call',
        description: 'You can also schedule a meeting with our team to discuss your program goals.',
        link: '/booking',
        linkLabel: 'Book a Meeting',
      },
    ],
    primaryLink: '/programs',
    primaryLabel: 'Browse Programs',
  },
  employer: {
    title: 'Employer Application Submitted',
    message:
      'Our employer relations team will review your submission and contact you within 2 business days.',
    steps: [
      {
        icon: <Mail className="w-5 h-5 text-brand-blue-600" />,
        title: 'Check your email',
        description: 'We sent a confirmation with your reference number.',
      },
      {
        icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />,
        title: 'Team review',
        description:
          'Our employer relations team will contact you to discuss hiring needs, WOTC credits, and OJT reimbursement.',
      },
      {
        icon: <Calendar className="w-5 h-5 text-brand-blue-600" />,
        title: 'Schedule a call',
        description: 'You can also schedule a meeting to discuss your workforce needs.',
        link: '/booking',
        linkLabel: 'Book a Meeting',
      },
    ],
    primaryLink: '/employer',
    primaryLabel: 'Employer Resources',
  },
  staff: {
    title: 'Staff Application Submitted',
    message:
      'HR will review your application. Qualified candidates will be contacted for interviews.',
    steps: [
      {
        icon: <Mail className="w-5 h-5 text-brand-blue-600" />,
        title: 'Check your email',
        description: 'We sent a confirmation with your reference number.',
      },
      {
        icon: <UserCheck className="w-5 h-5 text-brand-blue-600" />,
        title: 'HR review',
        description:
          'Our HR team will review your application and contact qualified candidates for interviews.',
      },
    ],
    primaryLink: '/',
    primaryLabel: 'Return Home',
  },
};

const ENROLLED_CONFIG = {
  title: "You're Approved — Let's Get Started!",
  message:
    'Your enrollment has been approved. Create your account now to access your courses and complete onboarding.',
  steps: [
    {
      icon: <UserCheck className="w-5 h-5 text-brand-green-600" />,
      title: 'Create your account',
      description:
        'Click "Create My Account" below to set your password and activate your student profile. This takes less than 2 minutes.',
      link: '/signup?redirect=/onboarding/learner',
      linkLabel: 'Create My Account →',
    },
    {
      icon: <FileText className="w-5 h-5 text-brand-blue-600" />,
      title: 'Complete onboarding',
      description:
        'Upload your government-issued ID, sign your enrollment agreement, and complete a short 10-minute orientation module.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-brand-blue-600" />,
      title: 'Start your courses',
      description:
        'Once onboarding is complete your courses unlock immediately in your student dashboard.',
    },
    {
      icon: <Mail className="w-5 h-5 text-slate-400" />,
      title: 'Check your email too',
      description:
        'We also sent a one-click login link to your email. Either method works — whichever is faster for you.',
    },
  ],
  primaryLink: '/signup?redirect=/onboarding/learner',
  primaryLabel: 'Create My Account',
};

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    ref?: string;
    enrolled?: string;
    pw?: string;
    funding?: string;
    program?: string;
  }>;
}) {
  const params = await searchParams;
  const role = params.role || 'student';
  const referenceNumber = params.ref || null;
  const isEnrolled = params.enrolled === 'true';
  const funding = params.funding ?? null;
  const showCareerConnect = needsCareerConnect(funding);
  // pw=1 means the student set a password on the application form — skip the "set password" step
  const hasPassword = params.pw === '1';

  let config = isEnrolled ? ENROLLED_CONFIG : ROLE_CONFIG[role] || ROLE_CONFIG.student;

  // Replace "Set your password" step with "Log in directly" when password was set on the form
  if (!isEnrolled && role === 'student' && hasPassword) {
    config = {
      ...config,
      steps: config.steps.map((step) =>
        step.title === 'Set your password'
          ? {
              ...step,
              title: 'Log in to your account',
              description:
                'Use the email and password you just created to sign in and start your onboarding.',
              link: '/login?redirect=/onboarding/learner',
              linkLabel: 'Sign In Now',
            }
          : step,
      ),
      primaryLink: '/login?redirect=/onboarding/learner',
      primaryLabel: 'Sign In Now',
    };
  }

  return (
    <div className="min-h-screen bg-white">
      <ConversionPixel type="ENROLL" />
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
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
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{config.title}</h1>
            <p className="text-lg text-black">{config.message}</p>
            {referenceNumber && (
              <div className="mt-4 inline-block bg-brand-green-50 border border-brand-green-200 rounded-lg px-4 py-2">
                <span className="text-sm text-brand-green-700">Reference: </span>
                <span className="font-mono font-bold text-brand-green-900">{referenceNumber}</span>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold mb-6">
              {isEnrolled ? 'Next Steps' : 'Complete Your Onboarding'}
            </h2>
            <ol className="space-y-5">
              {config.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-brand-blue-700 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    </div>
                    <p className="text-black text-sm leading-relaxed">{step.description}</p>
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

          {/* Indiana Career Connect — shown when student selected workforce funding */}
          {role === 'student' && !isEnrolled && showCareerConnect && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3 mb-3">
                <DollarSign className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 text-base">
                    Action Required — Register on Indiana Career Connect
                  </h3>
                  <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                    You selected a workforce funding source ({funding}). To receive WIOA, Workforce
                    Ready Grant, or WorkOne funding, you{' '}
                    <strong>must be registered on Indiana Career Connect</strong> and have an active
                    case with your local WorkOne office before enrollment can be finalized.
                  </p>
                </div>
              </div>
              <ol className="space-y-2 text-sm text-amber-900 mb-4 ml-9">
                <li className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0">1.</span> Create or log in to your
                  Indiana Career Connect account
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0">2.</span> Complete your profile and
                  upload your résumé
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0">3.</span> Contact your local WorkOne
                  office and mention {PLATFORM_DEFAULTS.orgName}
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0">4.</span> Ask your case manager to
                  approve Elevate training under your IEP/ITA
                </li>
              </ol>
              <div className="flex flex-col sm:flex-row gap-3 ml-9">
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Go to Indiana Career Connect <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://www.workone.in.gov/find-a-workone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-amber-400 text-amber-800 hover:bg-amber-100 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Find My WorkOne Office <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Generic funding notice for non-workforce-funded students */}
          {role === 'student' && !isEnrolled && !showCareerConnect && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-slate-800 mb-1">Funding Verification</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you plan to use WIOA, WorkOne, or Workforce Ready Grant funding, you must
                register on{' '}
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-600 underline font-semibold"
                >
                  Indiana Career Connect
                </a>{' '}
                and have written approval from your funding agency before enrollment is finalized.
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
                {PLATFORM_DEFAULTS.supportPhone}
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

          {/* Enrolled — prominent account creation CTA */}
          {isEnrolled && (
            <div className="bg-brand-green-50 border-2 border-brand-green-400 rounded-xl p-6 mb-4 text-center">
              <CheckCircle className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-brand-green-900 mb-1">
                Your enrollment is confirmed
              </h3>
              <p className="text-brand-green-800 text-sm mb-4">
                Create your account to unlock your courses and start learning today.
              </p>
              <Link
                href="/signup?redirect=/onboarding/learner"
                className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold px-8 py-3 rounded-xl text-base transition-colors shadow-sm"
              >
                Create My Account <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-brand-green-700 mt-3">
                Already have an account?{' '}
                <Link
                  href="/login?redirect=/onboarding/learner"
                  className="underline font-semibold"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {!isEnrolled && (
              <Link
                href={config.primaryLink}
                className="flex-1 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-brand-blue-700 transition inline-flex items-center justify-center gap-2"
              >
                {config.primaryLabel}
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <Link
              href="/"
              className={`${isEnrolled ? 'flex-1' : 'flex-1'} border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold text-center hover:bg-slate-50 transition`}
            >
              Return Home
            </Link>
          </div>

          {/* Resend sign-in link — shown for student and enrolled paths */}
          {(role === 'student' || isEnrolled) && (
            <div className="mt-2 border-t pt-6">
              <p className="text-sm text-slate-500 mb-1">
                Didn&apos;t receive the sign-in email? Check spam, or request another link:
              </p>
              <ResendMagicLinkForm next="/onboarding/learner" label="Resend sign-in link" />
            </div>
          )}

          {/* Track Application */}
          <div className="mt-6 text-center space-y-2">
            <Link
              href="/apply/track"
              className="text-brand-blue-600 hover:underline text-sm font-medium block"
            >
              Track your application status
            </Link>
            <Link
              href="/onboarding/learner"
              className="text-brand-blue-600 hover:underline text-sm font-medium block"
            >
              Already have an account? Go to onboarding →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
