import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Star, ShoppingCart, Building2, DollarSign, Layout } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apps & Tools | Elevate Store',
  description: 'Discover apps and tools for workforce development, government contracting, grant management, and training provider websites.',
  keywords: ['workforce apps', 'SAM.gov', 'grants management', 'website builder', 'training provider tools'],
  openGraph: {
    title: 'Apps & Tools | Elevate Store',
    description: 'Discover apps and tools for workforce development and training providers.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/apps',
  },
};

const apps = [
  {
    slug: 'sam-gov',
    name: 'SAM.gov Registration & Compliance',
    description: 'Streamline federal contractor registration and maintain SAM.gov compliance with automated tools.',
    icon: Building2,
    color: 'blue',
    rating: 4.9,
    reviews: 127,
    price: 149,
    category: 'Government',
  },
  {
    slug: 'grants',
    name: 'Grants Discovery & Management',
    description: 'Find and manage federal, state, and foundation grants with AI-powered matching and tracking.',
    icon: DollarSign,
    color: 'green',
    rating: 4.8,
    reviews: 89,
    price: 199,
    category: 'Funding',
  },
  {
    slug: 'website-builder',
    name: 'Website Builder for Training Providers',
    description: 'Build professional training websites with LMS integration, enrollment forms, and SEO tools.',
    icon: Layout,
    color: 'blue',
    rating: 4.9,
    reviews: 156,
    price: 79,
    category: 'Website',
  },
];

const colorClasses = {
  blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600', badge: 'bg-brand-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600', badge: 'bg-green-600' },
  blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600', badge: 'bg-brand-blue-600' },
};

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Apps" }]} />
      </div>
{/* Hero */}
      <section className="bg-slate-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Apps & Tools</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Powerful tools for workforce development, government contracting, and training provider operations.
          </p>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apps.map((app) => {
              const colors = colorClasses[app.color as keyof typeof colorClasses];
              return (
                <div key={app.slug} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center`}>
                        <app.icon className={`w-7 h-7 ${colors.text}`} />
                      </div>
                      <span className={`${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {app.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{app.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{app.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-4 h-4 ${i <= Math.floor(app.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{app.rating} ({app.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold">${app.price}</span>
                        <span className="text-gray-500">/mo</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/store/apps/${app.slug}`}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/store/cart?add=${app.slug}-pro`}
                          className={`inline-flex items-center gap-1 ${colors.badge} text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-gray-600 mb-8">Contact us for enterprise pricing and custom integrations.</p>
          <Link href="/contact" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-bold">
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}
