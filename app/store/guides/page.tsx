
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, 
  FileText, 
  Award, 
  ArrowRight, 
  Download,
  Users,
  TrendingUp,
  Shield,
  Building2,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Guides & Resources | Elevate Store',
  description: 'Professional guides and resources for workforce development, capital readiness, and licensing compliance. Build institutional trust and scale responsibly.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/guides',
  },
};

const guides = [
  {
    id: 'capital-readiness',
    title: 'Capital Readiness Guide',
    subtitle: 'For Licensed & Workforce Organizations',
    description: 'Build institutional trust, pass audits, and scale responsibly. A practical guide for licensed and workforce-aligned organizations seeking funding.',
    href: '/store/guides/capital-readiness',
    icon: Award,
    price: '$297',
    originalPrice: '$497',
    image: '/images/pages/training-page-1.jpg',
    badge: 'Best Seller',
    features: [
      '150+ page comprehensive guide',
      'Audit preparation checklists',
      'Compliance documentation templates',
      'Funding source directory',
      'Case studies from funded organizations',
      'Lifetime updates included',
    ],
  },
  {
    id: 'licensing',
    title: 'Platform Licensing Guide',
    subtitle: 'Understanding Your License',
    description: 'Complete guide to understanding and managing your workforce operating system license. Covers all tiers, features, and compliance requirements.',
    href: '/store/guides/licensing',
    icon: FileText,
    price: 'Included',
    originalPrice: null,
    image: '/images/pages/training-page-1.jpg',
    badge: 'Included with License',
    features: [
      'License tier comparison',
      'Feature availability matrix',
      'Compliance requirements',
      'Upgrade pathways',
      'Support options',
      'FAQ and troubleshooting',
    ],
  },
];

const categories = [
  { name: 'Funding & Grants', count: 3, icon: TrendingUp },
  { name: 'Compliance', count: 5, icon: Shield },
  { name: 'Operations', count: 4, icon: Building2 },
  { name: 'Training', count: 6, icon: Users },
];

export default function GuidesPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Guides' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-48 md:h-64 flex items-center overflow-hidden">
        <Image
          src="/images/pages/store-guides-hero.jpg"
          alt="Guides & Resources"
          fill
          className="object-cover"
          priority
        />
        
      </section>

      {/* Category Pills */}
      <section className="py-8 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-full text-sm font-medium">
              All Guides
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.name}
                className="px-4 py-2 bg-white text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
                <span className="text-slate-600">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section id="guides" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Featured Guides</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Each guide is written by workforce development experts and updated regularly.
            </p>
          </div>

          <div className="space-y-12">
            {guides.map((guide, index) => (
              <div 
                key={guide.id} 
                className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
              >
                <div className={`grid lg:grid-cols-2 ${index % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Image Side */}
                  <div className={`relative h-64 lg:h-auto min-h-[350px] ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <Image
                      src={guide.image}
                      alt={guide.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                        guide.price === 'Included' 
                          ? 'bg-brand-green-500 text-white' 
                          : 'bg-brand-blue-600 text-white'
                      }`}>
                        {guide.badge}
                      </span>
                    </div>

                  </div>

                  {/* Content Side */}
                  <div className="p-8 lg:p-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                        <guide.icon className="w-7 h-7 text-brand-blue-600" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-brand-blue-600">{guide.price}</div>
                        {guide.originalPrice && (
                          <div className="text-sm text-slate-600 line-through">{guide.originalPrice}</div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-brand-blue-600 font-medium mb-1">{guide.subtitle}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{guide.title}</h3>
                    <p className="text-slate-600 mb-6">{guide.description}</p>

                    <div className="mb-8">
                      <h4 className="font-semibold text-slate-900 mb-3">What&apos;s Included:</h4>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {guide.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-slate-400 flex-shrink-0">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Link
                        href={guide.href}
                        className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
                      >
                        {guide.price === 'Included' ? 'Download Guide' : 'View Details'}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                      {guide.price !== 'Included' && (
                        <Link
                          href={`${guide.href}?buy=true`}
                          className="inline-flex items-center gap-2 border-2 border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
                        >
                          Purchase Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-6">
            <div className="flex justify-center gap-1 text-yellow-400 text-2xl mb-4">
              ⭐⭐⭐⭐⭐
            </div>
            <blockquote className="text-2xl font-medium text-slate-900 mb-6">
              &ldquo;The Capital Readiness Guide helped us secure $2.3M in workforce funding. 
              The audit checklists alone saved us months of preparation.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                JM
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900">Jennifer Martinez</div>
                <div className="text-sm text-slate-600">Executive Director, Workforce Solutions Inc.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Need Custom Training Materials?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            We develop custom guides and training materials for enterprise clients.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 border-2 border-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
