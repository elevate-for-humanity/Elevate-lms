import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Mail, Phone, Calendar,
  MapPin, Clock, FileText, CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import WorkOneChecklist from '@/components/workone/WorkOneChecklist';

export const metadata: Metadata = {
  title: 'Complete WorkOne Intake | Elevate for Humanity',
  description: 'Your application is on hold while we wait for your WorkOne eligibility confirmation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/pending-workone',
  },
};

export const revalidate = 3600;

const WORKONE_STEPS = [
  {
    icon: <MapPin className="w-5 h-5 text-brand-blue-600" />,
    title: 'Find your nearest WorkOne center',
    description:
      'Visit the Indiana DWD WorkOne locator to find the center closest to you. Walk-ins are welcome at most locations.',
    link: 'https://www.in.gov/dwd/workone/workone-locations/',
    linkLabel: 'Find a WorkOne location',
    external: true,
  },
  {
    icon: <Calendar className="w-5 h-5 text-brand-blue-600" />,
    title: 'Complete your WorkOne intake appointment',
    description:
      'Tell the WorkOne counselor you are enrolling in training with Elevate for Humanity and need a WIOA or Workforce Ready Grant eligibility determination. Bring a photo ID and proof of income.',
    link: null,
    linkLabel: null,
    external: false,
  },
  {
    icon: <FileText className="w-5 h-5 text-brand-blue-600" />,
    title: 'Get your approval letter or authorization code',
    description:
      'WorkOne will issue a letter or authorization code confirming your eligibility. Keep a copy — you will need it to complete your Elevate enrollment.',
    link: null,
    linkLabel: null,
    external: false,
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-brand-blue-600" />,
    title: 'Contact Elevate to confirm and activate your enrollment',
    description:
      'Once you have your WorkOne approval, call or email us. We will update your application and activate your enrollment immediately.',
    link: 'tel:3173143757',
    linkLabel: 'Call (317) 314-3757',
    external: false,
  },
];

const BRING_LIST = [
  "Government-issued photo ID (driver's license, state ID, or passport)",
  'Proof of Indiana residency (utility bill, lease, or bank statement)',
  'Proof of income or unemployment (pay stubs, tax return, or termination letter)',
  'Social Security card or number',
  'Your Elevate for Humanity program name and reference number',
];

export default function PendingWorkOnePage({
  searchParams,
}: {
  searchParams?: { ref?: string; funding?: string };
}) {
  const referenceNumber = searchParams?.ref ?? null;
  const fundingSource   = searchParams?.funding ?? 'workone';

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Apply', href: '/apply' },
              { label: 'WorkOne Intake Required' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            One More Step Before Enrollment
          </h1>
          <p className="text-lg text-black leading-relaxed">
            Your application is received and your account is ready.
            Because you selected WorkOne / WIOA funding, you must complete
            a <strong>WorkOne intake appointment</strong> before your enrollment
            can be activated. WorkOne — not Elevate — determines your eligibility.
          </p>
          {referenceNumber && (
            <div className="mt-4 inline-block bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <span className="text-sm text-amber-700">Your reference number: </span>
              <span className="font-mono font-bold text-amber-900">{referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Important notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Important:</strong> Elevate cannot approve WIOA or Workforce Ready Grant
            funding on your behalf. WorkOne is the state agency that makes this determination.
            Your spot in the program is held for <strong>30 days</strong> while you complete
            this step. If you need more time, contact us.
          </p>
        </div>

        {/* ── Checklist ── */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Track your progress</h2>
          <p className="text-sm text-black mb-4">
            Check off each step as you complete it. Add notes like appointment dates,
            advisor names, and authorization codes so nothing gets lost.
          </p>
          <WorkOneChecklist pendingWorkone={true} fundingSource={fundingSource} />
        </div>

        {/* What to bring */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">What to bring to WorkOne</h2>
          <ul className="space-y-2">
            {BRING_LIST.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps reference */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">What to do next</h2>
          <ol className="space-y-6">
            {WORKONE_STEPS.map((step, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-brand-blue-700 font-bold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    {step.icon}
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-black text-sm leading-relaxed">{step.description}</p>
                  {step.link && step.linkLabel && (
                    <Link
                      href={step.link}
                      target={step.external ? '_blank' : undefined}
                      rel={step.external ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-1.5 text-brand-blue-600 hover:text-brand-blue-800 font-medium text-sm mt-2"
                    >
                      {step.linkLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Contact */}
        <div className="bg-brand-blue-50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-brand-blue-900 mb-3">
            Already have your WorkOne approval? Contact us now.
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="tel:3173143757"
              className="flex items-center gap-2 text-brand-blue-600 hover:underline text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </Link>
            <Link
              href="mailto:elevate4humanityedu@gmail.com"
              className="flex items-center gap-2 text-brand-blue-600 hover:underline text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              elevate4humanityedu@gmail.com
            </Link>
            <Link
              href="/booking"
              className="flex items-center gap-2 text-brand-blue-600 hover:underline text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              Schedule a meeting
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="https://www.in.gov/dwd/workone/workone-locations/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-brand-blue-700 transition inline-flex items-center justify-center gap-2"
          >
            Find a WorkOne Location
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-50 transition"
          >
            Log In to Your Account
          </Link>
        </div>

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
  );
}
