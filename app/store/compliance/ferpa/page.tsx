
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Home, ChevronRight, Lock, Shield, Eye, Key } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

export const metadata: Metadata = {
  title: 'FERPA Compliance Tools | Elevate for Humanity Store',
  description: 'Complete FERPA compliance toolkit with data encryption, access controls, audit logging, and consent management.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/compliance/ferpa',
  },
};

const features = [
  {
    title: 'Data Encryption',
    description: 'AES-256 encryption for all student data at rest and in transit.',
    image: '/images/pages/comp-cta-training.jpg',
    items: ['AES-256 encryption', 'TLS 1.3 in transit', 'Encrypted backups', 'Key rotation'],
  },
  {
    title: 'Access Controls',
    description: 'Role-based access control ensures only authorized users see student data.',
    image: '/images/pages/comp-cta-training.jpg',
    items: ['Role-based permissions', 'Multi-factor authentication', 'Session management', 'IP restrictions'],
  },
  {
    title: 'Audit Logging',
    description: 'Complete audit trail of all data access and modifications.',
    image: '/images/pages/homepage-why-elevate.jpg',
    items: ['Access logging', 'Change tracking', 'Export history', 'Compliance reports'],
  },
  {
    title: 'Consent Management',
    description: 'Digital consent forms and parent/guardian authorization workflows.',
    image: '/images/pages/homepage-why-elevate.jpg',
    items: ['Digital consent forms', 'Parent authorization', 'Opt-out tracking', 'Consent expiration'],
  },
];

const guideSteps = [
  {
    title: 'What is FERPA?',
    message: 'FERPA is the Family Educational Rights and Privacy Act. It protects student education records and gives parents rights over their children\'s information.',
    highlight: '#ferpa-features',
  },
  {
    title: 'Data Protection',
    message: 'Our platform uses AES-256 encryption and role-based access controls to ensure only authorized staff can access student records.',
    highlight: '#ferpa-features',
  },
  {
    title: 'Audit Everything',
    message: 'Every access to student data is logged. You can generate compliance reports showing who accessed what and when.',
    highlight: '#ferpa-features',
  },
];

export default function FERPACompliancePage() {

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Ferpa" }]} />
      </div>
{/* Avatar Guide */}
      <AvatarGuide
        avatarImage="/images/pages/store-recommendations.jpg"
        avatarName="Sarah"
        welcomeMessage="Hi! I'm Sarah, and I'll explain how we protect student data under FERPA. Data privacy is serious business - let me show you our safeguards."
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
            <span className="text-black font-semibold">FERPA Protection</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/store-compliance-ferpa-hero.jpg" alt="FERPA" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">FERPA Data Protection</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Enterprise-grade student data protection with encryption, access controls, and complete audit trails.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="ferpa-features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-2 text-center">FERPA Protection Features</h2>
          <p className="text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            Complete data protection for student education records
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-brand-blue-500 hover:shadow-xl transition-all group">
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

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black mb-8 text-center">FERPA Compliance Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Basic', price: '$299', features: ['Encryption at rest', 'Basic access controls', 'Monthly audit reports'] },
              { name: 'Professional', price: '$999', features: ['Everything in Basic', 'MFA enforcement', 'Real-time audit logs', 'Consent management'], popular: true },
              { name: 'Enterprise', price: '$2,499', features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'Compliance certification'] },
            ].map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl p-8 border-2 ${plan.popular ? 'border-brand-blue-500 shadow-xl' : 'border-gray-200'}`}>
                {plan.popular && <span className="bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>}
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
                <Link href="/store/licensing" className={`block text-center py-3 rounded-lg font-bold ${plan.popular ? 'bg-brand-blue-600 text-white' : 'bg-gray-100 text-black'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Protect Student Data Today</h2>
          <p className="text-brand-blue-100 mb-8">Schedule a demo to see our FERPA compliance tools in action.</p>
          <Link href="/store/demos" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-50 transition">
            Schedule Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
