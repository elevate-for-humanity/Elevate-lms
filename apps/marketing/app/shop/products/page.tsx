import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowRight, Monitor, Sparkles, Globe, BarChart3, 
  CreditCard, Zap, Package, Truck, Users, FileText
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Products | Elevate Store',
  description: 'Complete catalog of workforce development software, platform licenses, AI tools, and training resources.',
  keywords: ['products', 'software', 'LMS', 'workforce', 'training platform'],
};

const products = [
  {
    category: 'Platform Licenses',
    icon: Monitor,
    items: [
      { name: 'Single User', desc: 'Individual practitioner license', price: '$99/mo', href: '/platform' },
      { name: 'Small Business', desc: 'Growing training organizations', price: '$399/mo', href: '/platform' },
      { name: 'Enterprise', desc: 'Full platform with white-label', price: '$999/mo', href: '/platform/licensing' },
    ],
  },
  {
    category: 'AI Tools',
    icon: Sparkles,
    items: [
      { name: 'AI Studio Starter', desc: '50 videos, 200 images/mo', price: '$99/mo', href: '/store/ai-studio' },
      { name: 'AI Studio Pro', desc: 'Unlimited AI content', price: '$299/mo', href: '/store/ai-studio' },
      { name: 'AI Instructor Pack', desc: '6 pre-built avatars', price: '$499 one-time', href: '/store/ai-studio' },
    ],
  },
  {
    category: 'Add-Ons',
    icon: BarChart3,
    items: [
      { name: 'Analytics Pro', desc: 'Advanced reporting & PIRL', price: '$49/mo', href: '/store/add-ons/analytics-pro' },
      { name: 'Website Builder', desc: 'Drag-and-drop site builder', price: '$29/mo', href: '/store/apps/website-builder' },
      { name: 'SAM.gov Manager', desc: 'Federal contractor tools', price: '$49/mo', href: '/store/apps/sam-gov' },
    ],
  },
  {
    category: 'Grants & Funding',
    icon: Zap,
    items: [
      { name: 'Grants Discovery', desc: 'AI grant matching', price: '$79/mo', href: '/store/apps/grants' },
      { name: 'Grant Contract Suite', desc: 'Application tracking & compliance', price: '$149/mo', href: '/store/add-ons/grant-contract-suite' },
    ],
  },
  {
    category: 'Workforce Tools',
    icon: Users,
    items: [
      { name: 'Employer Portal', desc: 'Apprenticeship & OJT tracking', price: 'Included', href: '/platform/employer' },
      { name: 'Workforce Board', desc: 'WIOA management & PIRL', price: 'Contact us', href: '/platform/workforce' },
      { name: 'Career Services', desc: 'Job matching & placement', price: 'Included', href: '/platform/career' },
    ],
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/shop" className="hover:text-white">Store</Link>
            <span>/</span>
            <span className="text-white">Products</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Products</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Complete workforce development platform, AI tools, and professional services. 
            Everything you need to launch, scale, and automate your training programs.
          </p>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {products.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.category}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{section.category}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {section.items.map((product) => (
                    <Link
                      key={product.name}
                      href={product.href}
                      className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md hover:border-brand-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                          {product.name}
                        </h3>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-600 transition-colors" />
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{product.desc}</p>
                      <p className="text-sm font-semibold text-emerald-600">{product.price}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom Solutions CTA */}
      <section className="py-16 px-4 bg-brand-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Looking for something specific?</h2>
          <p className="text-slate-600 mb-6">
            We build custom solutions for workforce agencies, government contractors, and enterprise organizations. 
            Contact us to discuss your requirements.
          </p>
          <Link
            href="/contact?subject=custom-solution"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-blue-700 transition-colors"
          >
            Contact Sales
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
