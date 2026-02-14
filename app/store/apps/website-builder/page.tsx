import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Check, Play, ShoppingCart, Star, Layout, Palette, Globe, Zap, Shield, BarChart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Website Builder for Training Providers | Elevate Store',
  description: 'Build professional training provider websites in minutes. Pre-built templates, LMS integration, enrollment forms, and SEO optimization included.',
  keywords: ['website builder', 'training provider website', 'LMS website', 'education website builder', 'course website', 'enrollment forms', 'SEO'],
  openGraph: {
    title: 'Website Builder for Training Providers',
    description: 'Build professional training provider websites with LMS integration.',
    images: ['/images/programs-hq/technology-hero.jpg'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/apps/website-builder',
  },
};

const features = [
  { icon: Layout, title: 'Drag & Drop Builder', desc: 'No coding required. Build pages visually with ease.' },
  { icon: Palette, title: 'Professional Templates', desc: '50+ templates designed for training providers' },
  { icon: Globe, title: 'Custom Domains', desc: 'Use your own domain with free SSL certificate' },
  { icon: Zap, title: 'LMS Integration', desc: 'Connect directly to Elevate LMS for enrollments' },
  { icon: Shield, title: 'WIOA Compliant', desc: 'Built-in compliance disclosures and accessibility' },
  { icon: BarChart, title: 'SEO Optimized', desc: 'Automatic meta tags, sitemaps, and schema markup' },
];

const templates = [
  'Workforce Training Center',
  'Healthcare Academy',
  'Trade School',
  'CDL Training School',
  'Barber Academy',
  'IT Bootcamp',
  'Apprenticeship Program',
  'Career Services Center',
];

const pricing = [
  { name: 'Starter', price: 29, period: '/month', features: ['1 Website', '5 Pages', 'Basic Templates', 'Elevate Subdomain', 'Email Support', 'Basic Analytics'] },
  { name: 'Professional', price: 79, period: '/month', features: ['3 Websites', 'Unlimited Pages', 'All Templates', 'Custom Domain', 'LMS Integration', 'Priority Support', 'Advanced Analytics', 'Form Builder'], popular: true },
  { name: 'Agency', price: 199, period: '/month', features: ['Unlimited Websites', 'White-label Builder', 'Client Management', 'API Access', 'Custom Templates', 'Dedicated Support', 'Multi-user Access', 'Revenue Sharing'] },
];

export default function WebsiteBuilderAppPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Website Builder" }]} />
      </div>
{/* Hero */}
      <section className="bg-slate-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-brand-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">WEBSITE</span>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-sm ml-1">4.9 (156 reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Website Builder for Training Providers
              </h1>
              <p className="text-xl text-brand-blue-100 mb-8">
                Launch a professional training website in minutes. Pre-built templates, LMS integration, enrollment forms, and SEO tools included.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/store/cart?add=website-pro"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart - $79/mo
                </Link>
                <button className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/training-providers-video-with-narration.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-600 mb-6">Industry-specific templates included</p>
          <div className="flex flex-wrap justify-center gap-3">
            {templates.map((template, i) => (
              <span key={i} className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                {template}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 px-4 bg-brand-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Build Your Site in Minutes</h2>
          <p className="text-gray-600 mb-8">Watch how easy it is to create a professional training provider website</p>
          <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/training-providers-video-with-narration.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-gray-600 text-center mb-12">Start free, upgrade as you grow</p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 ${plan.popular ? 'bg-brand-blue-600 text-white ring-4 ring-blue-300' : 'bg-white border border-gray-200'}`}>
                {plan.popular && <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
                <h3 className={`text-2xl font-bold mt-4 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className={plan.popular ? 'text-brand-blue-100' : 'text-gray-500'}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <Check className={`w-5 h-5 ${plan.popular ? 'text-brand-blue-200' : 'text-green-500'}`} />
                      <span className={plan.popular ? 'text-brand-blue-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/store/cart?add=website-${plan.name.toLowerCase()}`}
                  className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
                    plan.popular 
                      ? 'bg-white text-brand-blue-600 hover:bg-gray-100' 
                      : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  Add to Cart
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Launch Your Training Website Today</h2>
          <p className="text-gray-300 mb-8">14-day free trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/store/cart?add=website-pro" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold">
              Start Free Trial
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold">
              Request Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
