import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Server, Code, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RedirectNotice } from '@/components/store/RedirectNotice';

export const metadata: Metadata = {
  title: 'Licenses | Elevate Store',
  description: 'Choose your license for the Elevate Workforce Operating System. Managed platform or enterprise source-use.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/licensing',
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
    ctaHref: '/store/licensing/managed',
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

      {/* Hero with platform screenshot */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Choose Your License
              </h1>
              <p className="mt-4 text-lg text-slate-800">
                Two ways to run the Workforce OS. Pick the model that fits your organization.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Not sure yet? <Link href="/store/trial" className="text-brand-red-600 hover:underline">Start a free 14-day trial</Link> or <Link href="/store/demos" className="text-brand-red-600 hover:underline">view the demo</Link> first.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-xl border border-slate-200">
              <Image
                src="/images/demos/admin-dashboard-thumb.jpg"
                alt="Elevate platform admin dashboard"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
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
                    ? 'bg-white text-slate-900 ring-2 ring-brand-red-600'
                    : 'bg-white border-2 border-slate-200'
                }`}
              >
                {lic.popular && (
                  <span className="inline-block self-start bg-brand-red-600 text-slate-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <lic.icon className={`w-8 h-8 ${lic.popular ? 'text-brand-red-400' : 'text-brand-red-600'}`} />
                  <h2 className={`text-2xl font-bold ${lic.popular ? 'text-slate-900' : 'text-slate-900'}`}>
                    {lic.name}
                  </h2>
                </div>

                <p className={`text-lg font-medium mb-2 ${lic.popular ? 'text-slate-900/90' : 'text-slate-800'}`}>
                  {lic.tagline}
                </p>

                <p className={`text-sm mb-4 ${lic.popular ? 'text-slate-900/70' : 'text-slate-600'}`}>
                  {lic.who}
                </p>

                <p className={`text-3xl font-black mb-6 ${lic.popular ? 'text-slate-900' : 'text-slate-900'}`}>
                  {lic.price}
                </p>

                <ul className="space-y-3 mb-8 flex-grow">
                  {lic.included.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className={lic.popular ? 'text-slate-900/90' : 'text-slate-800'}>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <Link
                    href={lic.ctaHref}
                    className={`block text-center px-6 py-3 rounded-lg font-bold transition-colors ${
                      lic.popular
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-white text-slate-900 hover:bg-white'
                    }`}
                  >
                    {lic.cta}
                  </Link>
                  <Link
                    href={lic.learnMore}
                    className={`block text-center text-sm font-medium ${
                      lic.popular ? 'text-slate-900/70 hover:text-slate-900' : 'text-slate-600 hover:text-slate-900'
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

      {/* FAQ */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Can I try the platform before buying?', a: 'Yes. Start a free 14-day trial with no credit card required, or take a guided demo tour to see each role in action.' },
              { q: 'What happens after I purchase a license?', a: 'Managed Platform: We set up your branded instance within 5 business days. Source-Use: Legal review and repository access within 2 weeks after agreement execution.' },
              { q: 'Can I cancel my managed platform subscription?', a: 'Yes. Monthly subscriptions can be cancelled with 30 days notice. Annual contracts are non-refundable but will not auto-renew unless requested.' },
              { q: 'Do I own the software?', a: 'No. All licenses grant access to use the platform. Ownership of software, IP, and infrastructure remains with Elevate for Humanity.' },
              { q: 'Is the platform FERPA and WIOA compliant?', a: 'Yes. The platform is built for workforce development and includes FERPA-compliant data handling, WIOA reporting templates, and WCAG 2.1 AA accessibility.' },
              { q: 'Can I use my own domain and branding?', a: 'Yes. All managed platform licenses include custom domain setup and full branding (logo, colors, email templates).' },
            ].map((faq) => (
              <details key={faq.q} className="group border border-slate-200 rounded-lg">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-slate-900 hover:bg-slate-50">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-600 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="px-5 pb-5 text-slate-700 text-sm">{faq.a}</p>
              </details>
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
            href="/store/licensing/managed"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-red-600 text-slate-900 font-bold rounded-lg hover:bg-brand-red-700 transition-colors"
          >
            Get Started with Managed Platform <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-sm text-slate-600">
            <Link href="/platform" className="text-slate-600 hover:underline">Learn how the platform works</Link>
            {' · '}
            <Link href="/contact?topic=licensing" className="text-slate-600 hover:underline">Licensing questions</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
