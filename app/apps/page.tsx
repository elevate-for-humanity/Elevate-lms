import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, DollarSign, Layout, Lock, ArrowRight, Star,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'My Apps | Elevate for Humanity',
  description: 'Access your purchased apps and tools.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apps',
  },
};

const apps = [
  {
    id: 'sam-gov',
    name: 'SAM.gov Assistant',
    description: 'Federal contractor registration and compliance management',
    icon: Building2,
    color: 'blue',
    status: 'active', // active, trial, locked
    href: '/apps/sam-gov',
  },
  {
    id: 'grants',
    name: 'Grants Discovery & Management',
    description: 'Find and manage federal, state, and foundation grants',
    icon: DollarSign,
    color: 'green',
    status: 'active',
    href: '/apps/grants',
  },
  {
    id: 'website-builder',
    name: 'Website Builder',
    description: 'Build professional training provider websites',
    icon: Layout,
    color: 'blue',
    status: 'trial',
    href: '/apps/website-builder',
  },
];

const colorClasses = {
  blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600', border: 'border-brand-blue-200' },
  green: { bg: 'bg-brand-green-100', text: 'text-brand-green-600', border: 'border-brand-green-200' },
  blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600', border: 'border-brand-blue-200' },
};

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apps' }]} />
        </div>
      </div>

      <div className="py-8 max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Apps</h1>
          <p className="text-gray-600 mt-1">Access your purchased apps and tools</p>
        </div>

        {/* Active Apps */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Apps</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.filter(app => app.status === 'active' || app.status === 'trial').map(app => {
              const colors = colorClasses[app.color as keyof typeof colorClasses];
              return (
                <Link
                  key={app.id}
                  href={app.href}
                  className="bg-white rounded-xl border p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                      <app.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {app.status === 'trial' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                        Trial
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-brand-blue-600 transition">
                    {app.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{app.description}</p>
                  <div className="flex items-center text-brand-blue-600 text-sm font-medium">
                    Open App <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Browse More Apps */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Browse More Apps</h2>
              <p className="text-gray-600 text-sm">Discover more tools to grow your organization</p>
            </div>
            <Link
              href="/store/apps"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 flex items-center gap-2"
            >
              Visit Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-white mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Visit Support Center
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
