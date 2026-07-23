import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Check, X, Star, ArrowRight, Users, Building, GraduationCap,
  Award, BarChart3, Shield, Settings, Globe, Headphones,
  FileText, UsersRound, Briefcase, Truck
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compare Plans',
  keywords: ["compare", "pricing", "plans", "features", "single user", "small business", "enterprise"],
  description: 'Compare Elevate plans: Single User, Small Business, and Enterprise. Find the perfect fit for your workforce development organization.',
};

const plans = [
  {
    id: 'single',
    name: 'Single User',
    description: 'For individual practitioners or sole proprietors',
    price: '$99',
    period: '/month',
    cta: 'Start Free Trial',
    highlight: false,
    features: {
      'Core LMS': true,
      'Course Creation': true,
      'Student Enrollment': 'Up to 25',
      'Document Storage': '10 GB',
      'Support': 'Email',
      'Certifications': true,
      'Basic Reporting': true,
      'Mobile App': false,
      'AI Features': false,
      'Apprenticeship Management': false,
      'WIOA Tracking': false,
      'Employer Portal': false,
      'Host Shop Portal': false,
      'Custom Branding': false,
      'API Access': false,
      'SSO/SAML': false,
      'Dedicated Support': false,
      'Custom Integrations': false,
      'SLA': '99.5%',
      'Training Sessions': 'Self-paced only',
    }
  },
  {
    id: 'business',
    name: 'Small Business',
    description: 'For growing training organizations and career centers',
    price: '$399',
    period: '/month',
    cta: 'Start Free Trial',
    highlight: true,
    features: {
      'Core LMS': true,
      'Course Creation': true,
      'Student Enrollment': 'Up to 500',
      'Document Storage': '100 GB',
      'Support': 'Priority Email + Chat',
      'Certifications': true,
      'Basic Reporting': true,
      'Mobile App': true,
      'AI Features': 'Basic',
      'Apprenticeship Management': true,
      'WIOA Tracking': true,
      'Employer Portal': true,
      'Host Shop Portal': false,
      'Custom Branding': true,
      'API Access': false,
      'SSO/SAML': false,
      'Dedicated Support': false,
      'Custom Integrations': false,
      'SLA': '99.9%',
      'Training Sessions': 'Monthly group training',
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For workforce agencies, schools, and large organizations',
    price: 'Custom',
    period: '',
    cta: 'Contact Sales',
    highlight: false,
    features: {
      'Core LMS': true,
      'Course Creation': true,
      'Student Enrollment': 'Unlimited',
      'Document Storage': 'Unlimited',
      'Support': '24/7 Dedicated',
      'Certifications': true,
      'Basic Reporting': true,
      'Mobile App': true,
      'AI Features': 'Full Suite',
      'Apprenticeship Management': true,
      'WIOA Tracking': true,
      'Employer Portal': true,
      'Host Shop Portal': true,
      'Custom Branding': true,
      'API Access': true,
      'SSO/SAML': true,
      'Dedicated Support': true,
      'Custom Integrations': true,
      'SLA': '99.99%',
      'Training Sessions': 'Onboarding + ongoing',
    }
  }
];

const featureCategories = [
  {
    category: 'Core Platform',
    icon: GraduationCap,
    features: [
      { name: 'Core LMS', key: 'Core LMS' },
      { name: 'Course Creation', key: 'Course Creation' },
      { name: 'Student Enrollment', key: 'Student Enrollment' },
      { name: 'Document Storage', key: 'Document Storage' },
      { name: 'Mobile App', key: 'Mobile App' },
    ]
  },
  {
    category: 'Compliance & Credentials',
    icon: Award,
    features: [
      { name: 'Certifications', key: 'Certifications' },
      { name: 'Basic Reporting', key: 'Basic Reporting' },
      { name: 'WIOA Tracking', key: 'WIOA Tracking' },
    ]
  },
  {
    category: 'Apprenticeship',
    icon: UsersRound,
    features: [
      { name: 'Apprenticeship Management', key: 'Apprenticeship Management' },
      { name: 'Employer Portal', key: 'Employer Portal' },
      { name: 'Host Shop Portal', key: 'Host Shop Portal' },
    ]
  },
  {
    category: 'Intelligence',
    icon: BarChart3,
    features: [
      { name: 'AI Features', key: 'AI Features' },
    ]
  },
  {
    category: 'Security & Access',
    icon: Shield,
    features: [
      { name: 'Custom Branding', key: 'Custom Branding' },
      { name: 'API Access', key: 'API Access' },
      { name: 'SSO/SAML', key: 'SSO/SAML' },
    ]
  },
  {
    category: 'Support & Service',
    icon: Headphones,
    features: [
      { name: 'Support', key: 'Support' },
      { name: 'Dedicated Support', key: 'Dedicated Support' },
      { name: 'Custom Integrations', key: 'Custom Integrations' },
      { name: 'Training Sessions', key: 'Training Sessions' },
      { name: 'SLA', key: 'SLA' },
    ]
  }
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="w-5 h-5 text-green-600 mx-auto" />;
  }
  if (value === false) {
    return <X className="w-5 h-5 text-slate-300 mx-auto" />;
  }
  return <span className="text-sm text-slate-700 text-center">{value}</span>;
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/pages/compare-hero.webp" alt="Plan Comparison - Elevate for Humanity" fill className="object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Compare Plans
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Choose the perfect plan for your workforce development organization. 
              All plans include our core platform with enterprise-grade security.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/demos" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                View Live Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-2xl p-8 ${
                  plan.highlight 
                    ? 'bg-brand-blue-600 text-white shadow-2xl ring-4 ring-brand-orange-500' 
                    : 'bg-white shadow-lg border border-slate-200'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-brand-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? '' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? '' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <Link 
                  href={plan.id === 'enterprise' ? '/contact' : '/demos'}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-bold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-brand-blue-600 hover:bg-slate-100'
                      : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Feature Comparison
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See exactly what's included in each plan. No hidden fees or surprise charges.
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left p-4 font-bold w-1/4">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center p-4 font-bold w-1/4">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, catIndex) => (
                  <>
                    <tr key={category.category} className="bg-slate-100">
                      <td colSpan={4} className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        <category.icon className="w-5 h-5 text-brand-blue-600" />
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr 
                        key={feature.key} 
                        className={`
                          ${featureIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                          ${catIndex === featureCategories.length - 1 && featureIndex === category.features.length - 1 ? 'border-b-4 border-slate-900' : 'border-b border-slate-100'}
                        `}
                      >
                        <td className="p-4 text-slate-700">{feature.name}</td>
                        {plans.map((plan) => (
                          <td key={plan.id} className="p-4 text-center">
                            <FeatureValue value={plan.features[feature.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-8">
            {featureCategories.map((category) => (
              <div key={category.category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-slate-900 text-white p-4 flex items-center gap-2">
                  <category.icon className="w-5 h-5" />
                  <span className="font-bold">{category.category}</span>
                </div>
                {category.features.map((feature, index) => (
                  <div 
                    key={feature.key}
                    className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                  >
                    <div className="text-sm font-medium text-slate-700 mb-2">{feature.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {plans.map((plan) => (
                        <div key={plan.id} className="text-xs text-slate-500 mb-1">{plan.name}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {plans.map((plan) => (
                        <div key={plan.id}>
                          <FeatureValue value={plan.features[feature.key]} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Sections */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Which Plan Is Right For You?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Single User</h3>
              <p className="text-slate-600 mb-6">
                Perfect for independent instructors, consultants, or small practice owners who need 
                a professional LMS to deliver courses and track student progress.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Individual trainer or consultant
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Small client base (under 25)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Basic certification needs
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Email support is sufficient
                </li>
              </ul>
              <Link href="/demos" className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg transition-colors">
                Start Free Trial
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-brand-blue-600 ring-4 ring-brand-orange-500/20">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-brand-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6 mt-4">
                <Building className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Small Business</h3>
              <p className="text-slate-600 mb-6">
                Ideal for growing training organizations, career centers, and community colleges 
                that need apprenticeship management and WIOA tracking.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Training organizations (up to 500 students)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Apprenticeship programs
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  WIOA compliance needs
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Multiple staff members
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Priority support
                </li>
              </ul>
              <Link href="/demos" className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Start Free Trial
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Enterprise</h3>
              <p className="text-slate-600 mb-6">
                For workforce agencies, school districts, and large organizations requiring 
                unlimited scale, SSO, and dedicated support.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Unlimited students & staff
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Full apprenticeship ecosystem
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  SSO/SAML integration
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Custom integrations
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  24/7 dedicated support
                </li>
              </ul>
              <Link href="/contact" className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Return on Investment
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                Our customers see measurable improvements in efficiency and outcomes. 
                The right plan pays for itself through reduced administrative burden and better results.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">40% Faster Program Launch</h4>
                    <p className="text-slate-600 text-sm">
                      Launch new programs in days instead of months with our pre-built templates and workflows.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">3x More Participants</h4>
                    <p className="text-slate-600 text-sm">
                      Serve more participants with streamlined enrollment and automated workflows.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Settings className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">60% Less Admin Time</h4>
                    <p className="text-slate-600 text-sm">
                      Automate repetitive tasks so your staff can focus on student success.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Calculate Your ROI</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600 mb-1">Your current staff hours on admin per week</div>
                  <div className="text-2xl font-bold text-slate-900">20 hrs</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600 mb-1">Hourly cost</div>
                  <div className="text-2xl font-bold text-slate-900">$25/hr</div>
                </div>
                <div className="p-4 bg-brand-blue-600 text-white rounded-xl">
                  <div className="text-sm text-blue-100 mb-1">Potential weekly savings (60%)</div>
                  <div className="text-3xl font-bold">$300/week</div>
                  <div className="text-sm text-blue-100">$15,600/year</div>
                </div>
              </div>
              <Link href="/contact" className="block w-full text-center mt-6 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Get Custom ROI Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free trial or schedule a personalized demo with our team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demos" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}