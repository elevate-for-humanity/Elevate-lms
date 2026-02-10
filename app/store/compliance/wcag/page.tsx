import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Home, ChevronRight, Circle, Eye, Keyboard, Volume2, Monitor } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

export const metadata: Metadata = {
  title: 'WCAG Accessibility Tools | Elevate for Humanity Store',
  description: 'WCAG 2.1 Level AA compliance tools with screen reader support, keyboard navigation, and accessibility auditing.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/compliance/wcag',
  },
};

const features = [
  {
    title: 'Screen Reader Support',
    description: 'Full compatibility with JAWS, NVDA, VoiceOver, and other assistive technologies.',
    image: '/images/technology/hero-programs-technology.jpg',
    items: ['ARIA labels', 'Semantic HTML', 'Alt text automation', 'Focus management'],
  },
  {
    title: 'Keyboard Navigation',
    description: 'Complete keyboard accessibility for all interactive elements.',
    image: '/images/technology/hero-program-it-support.jpg',
    items: ['Tab order optimization', 'Skip links', 'Focus indicators', 'Shortcut keys'],
  },
  {
    title: 'Visual Accessibility',
    description: 'Color contrast, text sizing, and visual presentation compliance.',
    image: '/images/business/tax-prep-certification.jpg',
    items: ['4.5:1 contrast ratio', 'Resizable text', 'No color-only info', 'Reduced motion'],
  },
  {
    title: 'Multimedia Accessibility',
    description: 'Captions, transcripts, and audio descriptions for all media.',
    image: '/images/team-hq/team-meeting.jpg',
    items: ['Closed captions', 'Transcripts', 'Audio descriptions', 'Sign language'],
  },
];

const guideSteps = [
  {
    title: 'What is WCAG?',
    message: 'WCAG stands for Web Content Accessibility Guidelines. It ensures your platform is usable by people with disabilities - including visual, auditory, motor, and cognitive impairments.',
    highlight: '#wcag-features',
  },
  {
    title: 'Level AA Compliance',
    message: 'We meet WCAG 2.1 Level AA standards, which is required for federal contractors and recommended for all organizations. This covers screen readers, keyboard navigation, and more.',
    highlight: '#wcag-features',
  },
  {
    title: 'Automated Auditing',
    message: 'Our tools automatically scan your content for accessibility issues and provide actionable fixes. No manual testing required.',
    highlight: '#pricing',
  },
];

export default function WCAGCompliancePage() {
  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Wcag" }]} />
      </div>
{/* Avatar Guide */}
      <AvatarGuide
        avatarImage="/images/team-hq/instructor-1.jpg"
        avatarName="Alex"
        welcomeMessage="Hi! I'm Alex. Accessibility isn't just compliance - it's about making learning available to everyone. Let me show you how we make that happen."
        steps={guideSteps}
        autoStart={true}
      />

      {/* Breadcrumb */}
      <nav className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 text-sm">
            <Link href="/" className="text-gray-600 hover:text-black flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
            <Link href="/store" className="text-gray-600 hover:text-black">Store</Link>
            <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
            <Link href="/store/compliance" className="text-gray-600 hover:text-black">Compliance</Link>
            <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
            <span className="text-black font-semibold">WCAG Accessibility</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-blue-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/technology/hero-programs-technology.jpg" alt="WCAG" fill className="object-cover opacity-30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
                Accessibility
              </span>
              <h1 className="text-4xl sm:text-5xl font-black mb-6">WCAG 2.1 Level AA</h1>
              <p className="text-xl text-blue-100 mb-8">
                Make your platform accessible to everyone with screen reader support, keyboard navigation, and automated accessibility auditing.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="#pricing" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition">
                  View Pricing
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/store/demo" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500 transition border border-blue-500">
                  Request Demo
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Eye, label: 'Screen Readers' },
                { icon: Keyboard, label: 'Keyboard Nav' },
                { icon: Volume2, label: 'Captions' },
                { icon: Monitor, label: 'High Contrast' },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <item.icon className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="wcag-features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-2 text-center">Accessibility Features</h2>
          <p className="text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            Complete WCAG 2.1 Level AA compliance for inclusive learning
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all group">
                <div className="relative h-48">
                  <Image src={feature.image} alt={feature.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">{feature.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-black">
                        <Circle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-8 text-center">Accessibility Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Audit Only', price: '$499', features: ['One-time accessibility audit', 'Detailed report', 'Remediation guide'] },
              { name: 'Full Compliance', price: '$1,499', features: ['Everything in Audit', 'Automated monitoring', 'Quarterly re-audits', 'VPAT documentation'], popular: true },
              { name: 'Enterprise', price: '$3,999', features: ['Everything in Full', 'Custom remediation', 'Staff training', 'Legal compliance letter'] },
            ].map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl p-8 border-2 ${plan.popular ? 'border-blue-500 shadow-xl' : 'border-gray-200'}`}>
                {plan.popular && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>}
                <h3 className="text-xl font-bold text-black mt-4">{plan.name}</h3>
                <p className="text-4xl font-black text-black my-4">{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-black">
                      <Circle className="w-4 h-4 text-blue-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/store/checkout" className={`block text-center py-3 rounded-lg font-bold ${plan.popular ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Make Learning Accessible</h2>
          <p className="text-blue-100 mb-8">Schedule a demo to see our accessibility tools in action.</p>
          <Link href="/store/demo" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition">
            Schedule Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
