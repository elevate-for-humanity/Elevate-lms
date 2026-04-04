import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Licensing Guide | Elevate LMS',
  description:
    'How the Elevate LMS platform license works — tiers, provisioning, billing, enforcement, and what you own versus what you access.',
  robots: { index: true, follow: true },
};

const MASTER_STATEMENT =
  'All platform products are licensed access to systems operated by Elevate for Humanity. Ownership of software, infrastructure, and intellectual property is not transferred.';

const STEPS = [
  {
    num: '1',
    color: 'bg-brand-blue-600',
    title: 'Choose Your License Type',
    image: '/images/pages/admin-licensing-hero.jpg',
    imageAlt: 'License tier comparison — managed vs source-use',
    content: null, // rendered inline below
  },
  {
    num: '2',
    color: 'bg-brand-blue-600',
    title: 'Complete Checkout',
    image: '/images/pages/platform-page-3.jpg',
    imageAlt: 'Stripe checkout for managed platform license',
    content: (
      <>
        <p className="text-slate-600 mt-3 mb-4">
          Managed licenses use self-service checkout. Pay the setup fee and first month via Stripe.
          No sales call required — a link is sent to your email automatically after payment.
        </p>
        <ul className="space-y-2">
          {['Enter your organization details', 'Accept the license agreement', 'Complete payment via Stripe'].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '3',
    color: 'bg-brand-blue-600',
    title: 'Tenant Provisioning',
    image: '/images/pages/admin-partners-hero.jpg',
    imageAlt: 'Admin dashboard showing tenant provisioning and organization setup',
    content: (
      <>
        <p className="text-slate-600 mt-3 mb-4">
          After payment, your dedicated organization space is provisioned within 24 hours. You receive:
        </p>
        <ul className="space-y-2">
          {[
            'Admin account credentials',
            'Organization subdomain (yourorg.elevateforhumanity.org)',
            'Onboarding checklist and setup guide',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '4',
    color: 'bg-brand-blue-600',
    title: 'Invite Team & Assign Roles',
    image: '/images/pages/admin-employers-hero.jpg',
    imageAlt: 'Admin user management interface showing role assignment',
    content: (
      <>
        <p className="text-slate-600 mt-3 mb-4">Add your team and assign roles based on what each person needs to do:</p>
        <div className="space-y-2">
          {[
            { role: 'Admin', desc: 'Full platform access, user management, settings' },
            { role: 'Instructor', desc: 'Course creation, grading, student management' },
            { role: 'Staff', desc: 'Limited admin access, enrollment management' },
          ].map((r) => (
            <div key={r.role} className="flex items-start gap-2 text-sm">
              <span className="font-semibold text-slate-900 w-20 flex-shrink-0">{r.role}</span>
              <span className="text-slate-600">{r.desc}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    num: '5',
    color: 'bg-brand-blue-600',
    title: 'Add Programs & Content',
    image: '/images/pages/admin-courses-partners-hero.jpg',
    imageAlt: 'Course builder interface showing program and content setup',
    content: (
      <>
        <p className="text-slate-600 mt-3 mb-4">Set up your training programs and content. You can:</p>
        <ul className="space-y-2">
          {[
            'Create courses from scratch using the course builder',
            'Import existing content (SCORM, video, documents)',
            'Use Elevate course templates as a starting point',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '6',
    color: 'bg-brand-blue-600',
    title: 'Domain Options',
    image: '/images/pages/platform-page-5.jpg',
    imageAlt: 'Domain configuration options for the platform',
    content: (
      <>
        <p className="text-slate-600 mt-3 mb-4">Choose how users access your platform:</p>
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-900 text-sm mb-1">Default: Subdomain</h4>
            <p className="text-xs text-slate-600">yourorg.elevateforhumanity.org — works immediately, no setup required.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-900 text-sm mb-1">Optional: Custom Domain</h4>
            <p className="text-xs text-slate-600">lms.yourcompany.com — requires DNS configuration. We provide step-by-step instructions.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    num: '7',
    color: 'bg-amber-500',
    title: 'Billing & Enforcement',
    image: '/images/pages/platform-page-7.jpg',
    imageAlt: 'Billing and subscription management interface',
    content: null, // rendered inline below
  },
  {
    num: '8',
    color: 'bg-brand-blue-600',
    title: 'Support & SLA',
    image: '/images/pages/platform-page-9.jpg',
    imageAlt: 'Support portal and SLA documentation',
    content: (
      <>
        <p className="text-slate-600 mt-3 mb-4">All managed licenses include:</p>
        <ul className="space-y-2">
          {[
            'Email support — 24–48 hour response time',
            '99.9% uptime SLA',
            'Automatic security updates',
            'Daily backups with 30-day retention',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
];

export default function LicensingGuidePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-56 md:h-72 overflow-hidden">
        <Image
          src="/images/pages/store-guides-licensing-hero.jpg"
          alt="Elevate platform licensing guide"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/55" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-8 w-full">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Platform Licensing Guide</h1>
            <p className="text-slate-200 text-base max-w-xl">
              How the license works, what you get, and what happens if you don&apos;t pay.
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Guides', href: '/store/guides' }, { label: 'Licensing' }]} />
        </div>
      </div>

      {/* Steps */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Step 1 — License Type */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <h2 className="text-xl font-bold text-slate-900">Choose Your License Type</h2>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden mb-5 aspect-square" style={{ aspectRatio: '16/7' }}>
              <Image
                src="/images/pages/admin-licensing-hero.jpg"
                alt="License tier comparison — managed vs source-use"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-brand-blue-900 mb-3">Managed Platform <span className="text-xs font-normal text-brand-blue-600 ml-1">(Recommended)</span></h3>
                <ul className="text-sm text-brand-blue-800 space-y-1.5 mb-4">
                  <li>• Setup: $7,500–$15,000</li>
                  <li>• Monthly: $1,500–$3,500</li>
                  <li>• Hosting, security, and updates handled by Elevate</li>
                  <li>• Self-service checkout — no sales call required</li>
                </ul>
                <Link href="/store/licensing/managed" className="text-brand-blue-600 font-semibold text-sm hover:underline inline-flex items-center gap-1">
                  View Managed License <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-3">Source-Use <span className="text-xs font-normal text-slate-500 ml-1">(Enterprise)</span></h3>
                <ul className="text-sm text-slate-600 space-y-1.5 mb-4">
                  <li>• Starting at $75,000</li>
                  <li>• Requires enterprise approval before purchase</li>
                  <li>• Internal use only — no resale or sublicensing</li>
                  <li>• You assume full operational responsibility</li>
                </ul>
                <Link href="/store/licensing" className="text-slate-600 font-semibold text-sm hover:underline inline-flex items-center gap-1">
                  View Source-Use License <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Steps 2–6 and 8 */}
          {STEPS.filter((s) => !['1', '7'].includes(s.num)).map((step) => (
            <div key={step.num}>
              <div className="flex items-center gap-3 mb-5">
                <span className={`w-8 h-8 ${step.color} text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                  {step.num}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
              </div>
              <div className="relative w-full rounded-xl overflow-hidden mb-5 aspect-[4/3]" style={{ aspectRatio: '16/7' }}>
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
              {step.content}
            </div>
          ))}

          {/* Step 7 — Billing & Enforcement (special treatment) */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">7</span>
              <h2 className="text-xl font-bold text-slate-900">Billing &amp; Enforcement</h2>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden mb-5 aspect-[4/3]" style={{ aspectRatio: '16/7' }}>
              <Image
                src="/images/pages/platform-page-7.jpg"
                alt="Billing and subscription management"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Payment Enforcement Policy</h4>
                  <p className="text-amber-800 text-sm mb-3">
                    An active subscription is required for continued platform access. Non-payment results in automatic lockout. This is not negotiable.
                  </p>
                  <ul className="space-y-1.5 text-sm text-amber-800">
                    {[
                      'Invoices sent monthly via Stripe',
                      '7-day grace period after a failed payment',
                      'Platform access suspended after the grace period',
                      'Data retained for 30 days after suspension',
                      'Reactivation requires payment of the outstanding balance',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Master Statement */}
      <section className="py-8 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-slate-500 italic text-center">{MASTER_STATEMENT}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white mb-8">
            Try the full demo first, or go straight to license setup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/demos"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-50 transition-colors"
            >
              Try Demo First
            </Link>
            <Link
              href="/store/licensing/managed"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-900 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-800 transition-colors"
            >
              Start License Setup <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
