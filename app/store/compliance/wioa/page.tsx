
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Home, ChevronRight, Download, FileText, Users, BarChart3, Shield, CheckCircle, } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

export const metadata: Metadata = {
  title: 'WIOA Compliance Tools | Elevate for Humanity Store',
  description: 'Complete WIOA compliance toolkit with participant tracking, performance metrics, PIRL exports, and automated quarterly reporting.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/compliance/wioa',
  },
};

const features = [
  {
    title: 'Participant Intake & Eligibility',
    description: 'Automated eligibility verification with document upload and digital signatures.',
    image: '/images/pages/wioa-meeting.jpg',
    items: ['Digital intake forms', 'Eligibility checklist automation', 'Document management', 'E-signature integration'],
  },
  {
    title: 'Performance Metrics Tracking',
    description: 'Real-time tracking of all WIOA primary indicators of performance.',
    image: '/images/pages/workforce-training.jpg',
    items: ['Employment rate tracking', 'Median earnings calculation', 'Credential attainment', 'Measurable skill gains'],
  },
  {
    title: 'PIRL Data Export',
    description: 'One-click export to Participant Individual Record Layout format.',
    image: '/images/pages/store-recommendations.jpg',
    items: ['Automated field mapping', 'Data validation', 'Error checking', 'Batch export capability'],
  },
  {
    title: 'Quarterly & Annual Reports',
    description: 'Pre-built report templates for all required WIOA submissions.',
    image: '/images/pages/job-placement.jpg',
    items: ['ETA-9169 reports', 'ETA-9170 reports', 'Custom report builder', 'Scheduled generation'],
  },
];

const metrics = [
  { label: 'Employment Rate Q2', target: '70%', icon: Users },
  { label: 'Employment Rate Q4', target: '68%', icon: Users },
  { label: 'Median Earnings Q2', target: '$6,500', icon: BarChart3 },
  { label: 'Credential Rate', target: '65%', icon: FileText },
  { label: 'Measurable Skill Gains', target: '55%', icon: CheckCircle },
  { label: 'Effectiveness in Serving Employers', target: 'Baseline', icon: Shield },
];

const pricing = [
  {
    name: 'WIOA Starter',
    price: '$499',
    period: 'one-time',
    description: 'Essential compliance templates and checklists',
    features: ['Eligibility checklists', 'Intake form templates', 'Basic reporting templates', 'Email support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'WIOA Professional',
    price: '$1,999',
    period: 'one-time',
    description: 'Full compliance toolkit with automation',
    features: ['Everything in Starter', 'PIRL export automation', 'Performance dashboard', 'Quarterly report generator', 'Priority support'],
    cta: 'Most Popular',
    popular: true,
  },
  {
    name: 'WIOA Enterprise',
    price: '$4,999',
    period: 'one-time',
    description: 'Complete solution with custom integration',
    features: ['Everything in Professional', 'Custom state integrations', 'Multi-site support', 'API access', 'Dedicated account manager', 'On-site training'],
    cta: 'Contact Sales',
    popular: false,
  },
];

// Avatar guide steps for WIOA walkthrough
const wioaGuideSteps = [
  {
    title: 'What is WIOA?',
    message: 'WIOA stands for Workforce Innovation and Opportunity Act. It\'s the federal law that governs workforce development programs. Our tools help you stay compliant with all requirements.',
    highlight: '#wioa-features',
  },
  {
    title: 'Track Performance',
    message: 'WIOA requires tracking specific metrics like employment rates, median earnings, and credential attainment. Our dashboard tracks all of these automatically.',
    highlight: '#wioa-features',
  },
  {
    title: 'PIRL Exports',
    message: 'Need to submit Participant Individual Record Layout data? We generate PIRL-compliant exports with one click - no manual data entry needed.',
    highlight: '#how-it-works',
  },
  {
    title: 'Choose Your Plan',
    message: 'We have three pricing tiers based on your needs. The Professional plan is most popular - it includes automated PIRL exports and quarterly reporting.',
    highlight: '#pricing',
  },
];

export default function WIOACompliancePage() {

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Wioa" }]} />
      </div>
{/* Avatar Guide at Top */}
      <AvatarGuide
        avatarImage="/images/pages/store-recommendations.jpg"
        avatarName="James"
        welcomeMessage="Welcome to our WIOA Compliance tools! I'm James, and I'll explain how we make WIOA compliance simple. Let me show you around."
        steps={wioaGuideSteps}
        autoStart={true}
      />

      {/* Breadcrumb Navigation */}
      <nav className="bg-white border-b border-gray-200">
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
            <span className="text-black font-semibold">WIOA Compliance</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/store-compliance-wioa-hero.jpg" alt="WIOA Compliance" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="inline-block bg-brand-green-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">Compliance Tools</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">WIOA Compliance Made Simple</h1>
            <p className="text-lg text-slate-300 mb-6 max-w-3xl mx-auto">
              Complete toolkit for Workforce Innovation and Opportunity Act compliance. Automated tracking, reporting, and PIRL exports for workforce development programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="#pricing" className="inline-flex items-center gap-2 bg-white text-brand-green-700 px-6 py-3 rounded-lg font-bold hover:bg-brand-green-50 transition">
                View Pricing <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/store/demos" className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-green-500 transition border border-brand-green-500">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WIOA Metrics */}
      <section className="py-12 bg-brand-green-50">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">WIOA Primary Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-white rounded-lg p-4 border border-brand-green-200 text-center">
                <metric.icon className="w-5 h-5 text-brand-green-600 mb-2 mx-auto" />
                <p className="text-sm text-slate-600">{metric.label}</p>
                <p className="text-xl font-bold text-slate-900">{metric.target}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="wioa-features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-2 text-center">Complete WIOA Toolkit</h2>
          <p className="text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            Everything you need to maintain WIOA compliance and track performance metrics
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-brand-green-500 hover:shadow-xl transition-all group">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                   sizes="100vw" />
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

      {/* How It Works */}
      <section id="how-it-works"className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Setup', desc: 'Configure your program and eligibility criteria', image: '/images/pages/wioa-meeting.jpg' },
              { step: '2', title: 'Enroll', desc: 'Participants complete digital intake forms', image: '/images/pages/adult-learner.jpg' },
              { step: '3', title: 'Track', desc: 'Automatic performance metric tracking', image: '/images/pages/store-recommendations.jpg' },
              { step: '4', title: 'Report', desc: 'Generate PIRL exports and quarterly reports', image: '/images/pages/graduation-ceremony.jpg' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-brand-green-600">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-brand-green-600/60 flex items-center justify-center">
                    <span className="text-2xl font-black text-slate-900">{item.step}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-black mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-2 text-center">WIOA Compliance Pricing</h2>
          <p className="text-gray-600 mb-12 text-center">Choose the package that fits your organization</p>

          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl overflow-hidden border-2 ${plan.popular ? 'border-brand-green-500 shadow-xl' : 'border-gray-200'} relative`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-brand-green-600 text-white text-center py-2 text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                  <h3 className="text-xl font-bold text-black mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-black">{plan.price}</span>
                    <span className="text-gray-500 text-sm ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-black">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.name === 'WIOA Enterprise' ? '/contact' : '/store/checkout'}
                    className={`block text-center py-3 rounded-lg font-bold transition ${
                      plan.popular
                        ? 'bg-brand-green-600 text-white hover:bg-brand-green-700'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Resources */}
      <section className="py-16 bg-brand-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-black text-black mb-4">Free WIOA Resources</h2>
                <p className="text-gray-600 mb-6">
                  Download our free WIOA compliance checklist and eligibility guide to get started.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-green-700 transition">
                    <Download className="w-5 h-5" />
                    Download Checklist
                  </button>
                  <button className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                    <FileText className="w-5 h-5" />
                    Eligibility Guide
                  </button>
                </div>
              </div>
              <div className="relative h-64 rounded-xl overflow-hidden">
                <Image
                  src="/images/pages/store-compliance-wioa-detail.jpg"
                  alt="WIOA Resources"
                  fill
                  className="object-cover"
                 sizes="100vw" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-green-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Ready for WIOA Compliance?</h2>
          <p className="text-brand-green-100 mb-8">
            Schedule a demo to see how our WIOA toolkit can streamline your compliance workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/demos" className="inline-flex items-center justify-center gap-2 bg-white text-brand-green-700 px-8 py-4 rounded-lg font-bold hover:bg-brand-green-50 transition">
              Schedule Demo
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
