import { Metadata } from 'next';
import { Users, Handshake, Building, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Partnerships | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Partner with Elevate for Humanity to train your workforce or host apprentices.',
};

const PARTNER_TYPES = [
  {
    icon: Building,
    title: 'Employer Partners',
    description: 'Hire trained graduates or sponsor apprenticeships for your workforce.',
  },
  {
    icon: Users,
    title: 'Training Partners',
    description: 'Join our network of training providers across Indiana.',
  },
  {
    icon: Handshake,
    title: 'Workforce Partners',
    description: 'Collaborate with workforce boards and career centers.',
  },
];

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Partnerships</h1>
          <p className="text-xl text-blue-100">
            Work with us to build a stronger workforce in Indiana.
          </p>
        </div>
      </section>
      
      {/* Partner Types */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Partner With Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {PARTNER_TYPES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white p-8 rounded-xl border border-slate-200 text-center hover:shadow-lg transition">
                <Icon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-600 mb-6">{description}</p>
                <a href="/contact" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700">
                  Learn More <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Partner?</h2>
          <p className="text-slate-300 mb-8">Contact us to discuss partnership opportunities.</p>
          <a href="/contact" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition">
            Get Started <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  );
}

