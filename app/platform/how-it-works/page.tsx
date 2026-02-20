
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play, CreditCard, Rocket, Settings, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'How the Platform Works | Elevate for Humanity',
  description:
    'From demo to live workspace in minutes. No calls, no scheduling — see how the Elevate Workforce OS works, then start using it.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/how-it-works',
  },
};

const steps = [
  {
    number: 1,
    title: 'See the demo',
    description:
      'Walk through guided tours of the admin dashboard, employer portal, and workforce program tools. No account needed. No data entered. Just see how it works.',
    icon: Play,
    href: '/store/demo',
    cta: 'Start a tour',
  },
  {
    number: 2,
    title: 'Choose a license',
    description:
      'Two options: Managed Platform (we host and operate it) or Enterprise Source-Use (you deploy it internally). Most organizations start with Managed.',
    icon: CreditCard,
    href: '/store/licenses',
    cta: 'Compare licenses',
  },
  {
    number: 3,
    title: 'Start a trial or purchase',
    description:
      'Start a free 14-day trial with your own subdomain and admin dashboard. Or go directly to checkout if you already know what you need. No credit card required for trial.',
    icon: Rocket,
    href: '/store/trial',
    cta: 'Start 14-day trial',
  },
  {
    number: 4,
    title: 'Configure your workspace',
    description:
      'Set up your organization profile, import programs, invite your team, and configure compliance settings. Your workspace is private until you launch.',
    icon: Settings,
    href: null,
    cta: null,
  },
  {
    number: 5,
    title: 'Launch and operate',
    description:
      'Enroll learners, track progress, run compliance reports, and manage employer partnerships. Upgrade or extend your license at any time from your admin dashboard.',
    icon: BarChart3,
    href: null,
    cta: null,
  },
];

export default function PlatformHowItWorksPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Platform', href: '/platform' },
              { label: 'How It Works' },
            ]}
          />
        </div>
      </div>

      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-black text-slate-900 mb-4 text-center">
            How the platform works
          </h1>
          <p className="text-lg text-slate-600 text-center mb-12">
            From first look to live workspace. No calls, no scheduling, no waiting.
          </p>

          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 pb-8 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className="w-5 h-5 text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
                  </div>
                  <p className="text-slate-600 mb-3">{step.description}</p>
                  {step.href && step.cta && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-red-600 hover:underline"
                    >
                      {step.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-slate-50 rounded-xl p-6 text-center">
            <h3 className="font-bold text-slate-900 mb-2">Questions?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Most questions are answered by walking through the demo. For licensing,
              compliance, or procurement questions:
            </p>
            <Link
              href="/contact"
              className="text-sm font-semibold text-brand-red-600 hover:underline"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
