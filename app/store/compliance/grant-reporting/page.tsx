
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Home, ChevronRight, FileText, BarChart3, Calendar, Download } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

export const metadata: Metadata = {
  title: 'Grant Reporting Tools | Elevate for Humanity Store',
  description: 'Automated grant reporting with customizable templates, outcome tracking, and one-click exports for federal and state workforce grants.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/compliance/grant-reporting',
  },
};

const features = [
  {
    title: 'Automated Data Collection',
    description: 'Automatically capture participant data, outcomes, and metrics as they happen.',
    image: '/images/technology/hero-programs-technology.jpg',
    items: ['Real-time data capture', 'Automatic calculations', 'Data validation', 'Error prevention'],
  },
  {
    title: 'Custom Report Templates',
    description: 'Pre-built templates for DOL, state agencies, and foundation reporting.',
    image: '/images/homepage/funding-navigation.png',
    items: ['DOL ETA reports', 'State-specific formats', 'Foundation templates', 'Custom builders'],
  },
  {
    title: 'Outcome Tracking',
    description: 'Track employment, wages, credentials, and other grant outcomes.',
    image: '/images/homepage/funders-philanthropy.jpg',
    items: ['Employment tracking', 'Wage verification', 'Credential attainment', 'Follow-up automation'],
  },
  {
    title: 'One-Click Exports',
    description: 'Export reports in any format required by your funders.',
    image: '/images/technology/hero-program-it-support.jpg',
    items: ['Excel exports', 'PDF reports', 'CSV data files', 'API integrations'],
  },
];

const guideSteps = [
  {
    title: 'Grant Reporting Pain',
    message: 'If you\'ve ever spent days pulling data for a grant report, you know the pain. Our tools automate 90% of that work so you can focus on serving participants.',
    highlight: '#grant-features',
  },
  {
    title: 'Automatic Tracking',
    message: 'As participants move through your program, we automatically track the metrics your funders care about - employment, wages, credentials, and more.',
    highlight: '#grant-features',
  },
  {
    title: 'One-Click Reports',
    message: 'When it\'s time to report, just click a button. We generate the exact format your funder needs - DOL, state agencies, or private foundations.',
    highlight: '#pricing',
  },
];

export default function GrantReportingPage() {

  return (
    <div className="bg-white">
      {/* Avatar Guide */}
      <AvatarGuide
        avatarImage="/images/team-hq/instructor-2.jpg"
        avatarName="Guide"
        welcomeMessage="Hey! I'm your guide. I used to spend 40 hours on quarterly reports. Now it takes 10 minutes. Let me show you how our grant reporting tools work."
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
            <span className="text-black font-semibold">Grant Reporting</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/homepage/funded-programs.jpg" alt="Grant Reporting" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Grant Reporting Made Easy</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Automated data collection, customizable templates, and one-click exports for all your federal and state grant reporting needs.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="grant-features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-2 text-center">Grant Reporting Features</h2>
          <p className="text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            Everything you need to streamline grant reporting
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-brand-orange-500 hover:shadow-xl transition-all group">
                <div className="relative h-48">
                  <Image src={feature.image} alt={feature.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-slate-900">{feature.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-black">
                        <span className="text-slate-400 flex-shrink-0">•</span>
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

      {/* Supported Grants */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-8 text-center">Supported Grant Types</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'WIOA Title I', desc: 'Adult, Dislocated Worker, Youth' },
              { name: 'WIOA Title II', desc: 'Adult Education and Literacy' },
              { name: 'Perkins V', desc: 'Career and Technical Education' },
              { name: 'SNAP E&T', desc: 'Employment and Training' },
              { name: 'TANF', desc: 'Temporary Assistance' },
              { name: 'DOL Grants', desc: 'Competitive grants' },
              { name: 'State Grants', desc: 'State workforce funding' },
              { name: 'Foundation', desc: 'Private foundation grants' },
            ].map((grant) => (
              <div key={grant.name} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-black mb-1">{grant.name}</h3>
                <p className="text-sm text-gray-600">{grant.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-8 text-center">Grant Reporting Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '$299', features: ['5 report templates', 'Basic outcome tracking', 'Excel exports'] },
              { name: 'Professional', price: '$999', features: ['Unlimited templates', 'Full outcome tracking', 'All export formats', 'Scheduled reports'], popular: true },
              { name: 'Enterprise', price: '$2,499', features: ['Everything in Pro', 'Custom integrations', 'API access', 'Dedicated support'] },
            ].map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl p-8 border-2 ${plan.popular ? 'border-brand-orange-500 shadow-xl' : 'border-gray-200'}`}>
                {plan.popular && <span className="bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>}
                <h3 className="text-xl font-bold text-black mt-4">{plan.name}</h3>
                <p className="text-4xl font-black text-black my-4">{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-black">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/store/licensing" className={`block text-center py-3 rounded-lg font-bold ${plan.popular ? 'bg-brand-red-600 text-white' : 'bg-gray-100 text-black'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Simplify Grant Reporting</h2>
          <p className="text-brand-orange-100 mb-8">Schedule a demo to see how we can save you hours on every report.</p>
          <Link href="/store/demos" className="inline-flex items-center gap-2 bg-white text-brand-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-50 transition">
            Schedule Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
