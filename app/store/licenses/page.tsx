import { Metadata } from 'next';
import Link from 'next/link';
import { Server, Code, ArrowRight, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RedirectNotice } from '@/components/store/RedirectNotice';

export const metadata: Metadata = {
  title: 'Licenses | Elevate Store',
  description: 'Choose your license for the Elevate Workforce Operating System. Managed platform or enterprise source-use.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/licenses',
  },
};

const licenses = [
  {
    name: 'Managed Platform',
    icon: Server,
    tagline: 'We operate it. You use it.',
    who: 'Training providers, workforce boards, and nonprofits that want zero engineering burden.',
    price: 'From $1,500/mo',
    included: [
      'Full platform access (all portals)',
      'Hosting, backups, SSL, CDN',
      '99.9% uptime SLA',
      'Compliance reporting (WIOA/DWD)',
      'Security patches and updates',
      'Dedicated support',
    ],
    cta: 'Get Started',
    ctaHref: '/store/licenses/managed-platform',
    learnMore: '/platform/managed',
    popular: true,
  },
  {
    name: 'Enterprise Source-Use',
    icon: Code,
    tagline: 'You deploy. You operate. We support.',
    who: 'Large enterprises with dedicated technical teams requiring internal deployment.',
    price: 'Custom pricing',
    included: [
      'Full source code access (restricted license)',
      'Deployment documentation',
      'Security configuration templates',
      '40 hours implementation support',
      'Annual security updates',
      'Quarterly compliance reviews',
    ],
    cta: 'Talk to Licensing',
    ctaHref: '/contact?topic=enterprise',
    learnMore: '/platform/enterprise',
    popular: false,
  },
];

export default function StoreLicensesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs + framing */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Store', href: '/store' },
            { label: 'Licenses' }
          ]} />
          <p className="text-sm text-slate-600 mt-1">
            Licensing for the <a href="/platform" className="text-brand-red-600 font-medium hover:underline">Elevate Workforce Operating System</a>.
            {' '}<a href="/platform/how-it-works" className="hover:underline">How it works →</a>
          </p>
        </div>
      </div>
      <RedirectNotice />

      {/* Header */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Choose Your License
          </h1>
          <p className="mt-4 text-lg text-slate-800 max-w-2xl mx-auto">
            Two ways to run the Workforce OS. Pick the model that fits your organization.
          </p>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
            If you&apos;ve completed the demo, this is the next step: choose how you want to run the platform.
            Not sure yet? <Link href="/store/trial" className="text-brand-red-600 hover:underline">Start a free 14-day trial</Link> first.
          </p>
        </div>
      </section>

      {/* License comparison */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {licenses.map((lic) => (
              <div
                key={lic.name}
                className={`rounded-2xl p-8 flex flex-col ${
                  lic.popular
                    ? 'bg-slate-900 text-white ring-2 ring-brand-red-600'
                    : 'bg-white border-2 border-slate-200'
                }`}
              >
                {lic.popular && (
                  <span className="inline-block self-start bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <lic.icon className={`w-8 h-8 ${lic.popular ? 'text-brand-red-400' : 'text-brand-red-600'}`} />
                  <h2 className={`text-2xl font-bold ${lic.popular ? 'text-white' : 'text-slate-900'}`}>
                    {lic.name}
                  </h2>
                </div>

                <p className={`text-lg font-medium mb-2 ${lic.popular ? 'text-white/90' : 'text-slate-800'}`}>
                  {lic.tagline}
                </p>

                <p className={`text-sm mb-4 ${lic.popular ? 'text-white/70' : 'text-slate-600'}`}>
                  {lic.who}
                </p>

                <p className={`text-3xl font-black mb-6 ${lic.popular ? 'text-white' : 'text-slate-900'}`}>
                  {lic.price}
                </p>

                <ul className="space-y-3 mb-8 flex-grow">
                  {lic.included.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${lic.popular ? 'text-brand-red-400' : 'text-brand-red-600'}`} />
                      <span className={lic.popular ? 'text-white/90' : 'text-slate-800'}>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <Link
                    href={lic.ctaHref}
                    className={`block text-center px-6 py-3 rounded-lg font-bold transition-colors ${
                      lic.popular
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {lic.cta}
                  </Link>
                  <Link
                    href={lic.learnMore}
                    className={`block text-center text-sm font-medium ${
                      lic.popular ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Learn more about {lic.name} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Not sure? */}
      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Not sure which license fits?</h2>
          <p className="text-slate-800 mb-6">
            Most organizations start with Managed Platform. If you have a dedicated engineering team and need internal deployment, Enterprise Source-Use may be right.
          </p>
          <Link
            href="/store/licenses/managed-platform"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors"
          >
            Get Started with Managed Platform <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            <Link href="/platform" className="text-slate-600 hover:underline">Learn how the platform works</Link>
            {' · '}
            <Link href="/contact?topic=licensing" className="text-slate-600 hover:underline">Licensing questions</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
