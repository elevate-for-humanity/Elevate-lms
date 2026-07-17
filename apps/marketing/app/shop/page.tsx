import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowRight, Monitor, Sparkles, BarChart3, Globe, Shield, 
  Zap, Package, CreditCard, Users
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Elevate Store | Software & Tools for Workforce Development',
  description: 'Platform licenses, AI tools, training resources, and workforce software for training providers, employers, and workforce agencies.',
  keywords: ['LMS', 'workforce software', 'training platform', 'AI tools', 'course builder'],
};

const categories = [
  {
    icon: Monitor,
    title: 'Platform',
    description: 'Core LMS, admin dashboard, and student portal',
    href: '/store/platform',
    color: 'bg-brand-blue-600',
  },
  {
    icon: Sparkles,
    title: 'AI Studio',
    description: 'AI video generation, voiceovers, and course creation',
    href: '/store/ai-studio',
    color: 'bg-purple-600',
  },
  {
    icon: Globe,
    title: 'Website Builder',
    description: 'Drag-and-drop site builder with LMS integration',
    href: '/store/apps/website-builder',
    color: 'bg-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics Pro',
    description: 'Advanced reporting, WIOA compliance, and PIRL exports',
    href: '/store/add-ons/analytics-pro',
    color: 'bg-orange-600',
  },
];

const products = [
  {
    icon: Package,
    title: 'Enterprise License',
    description: 'Full platform access with white-label, API, and dedicated support',
    price: 'Starting at $999/mo',
    href: '/platform/licensing',
  },
  {
    icon: CreditCard,
    title: 'SAM.gov Manager',
    description: 'Federal contractor registration and compliance tracking',
    price: 'Starting at $49/mo',
    href: '/store/apps/sam-gov',
  },
  {
    icon: Zap,
    title: 'Grants Discovery',
    description: 'AI-powered grant matching and application tracking',
    price: 'Starting at $79/mo',
    href: '/store/apps/grants',
  },
  {
    icon: Users,
    title: 'Employer Portal',
    description: 'Apprenticeship tracking, OJT management, and WOTC credits',
    price: 'Included with platform',
    href: '/platform/employer',
  },
];

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            Elevate Store
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Software, tools, and platform licenses for workforce development organizations. 
            Build, scale, and automate your training programs.
          </p>
          <Link
            href="/store/demos"
            className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors"
          >
            View Live Demos
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.title}
                  href={cat.href}
                  className="group p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg hover:border-brand-blue-300 transition-all"
                >
                  <div className={`w-14 h-14 ${cat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-brand-blue-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-slate-600">{cat.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">Featured Products</h2>
          <p className="text-slate-600 text-center mb-10 max-w-xl mx-auto">
            Everything you need to run a modern workforce development organization
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <Link
                  key={product.title}
                  href={product.href}
                  className="group bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg hover:border-brand-blue-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                          {product.title}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600 transition-colors" />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                      <p className="text-sm font-semibold text-emerald-600">{product.price}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need a custom solution?</h2>
          <p className="text-slate-300 mb-8">
            Enterprise licensing, white-label deployments, and custom integrations available. 
            Talk to our team about your specific requirements.
          </p>
          <Link
            href="/contact?subject=enterprise-inquiry"
            className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Contact Sales
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
