import { Metadata } from 'next';
import { Heart, Users, Globe, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config`;

export const metadata: Metadata = {
  title: `Community Services | ${PLATFORM_DEFAULTS.orgName}`,
  keywords: ["services", "workforce development", "training programs"], description: `Elevate for Humanity serves the community through workforce development and training.',
};

const SERVICES = [
  { icon: Users, title: 'Workforce Development', desc: 'Training programs for community members seeking employment.' },
  { icon: Heart, title: 'Support Services', desc: 'Career coaching and job placement assistance.' },
  { icon: Globe, title: 'Community Partnerships', desc: 'Collaborating with local organizations to serve better.' },
];

export default function CommunityServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Services</h1>
          <p className="text-xl text-blue-100">Serving our community through workforce development.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <Icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <a href="/contact" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700">
              Get Involved <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

