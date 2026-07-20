export const dynamic = 'force-static';


import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import UltraVideoPlayer from '@/components/video/UltraVideoPlayer';
import { Play, Star, Layout, Palette, Globe, Zap, Shield, BarChart, ArrowRight, Monitor, MousePointer, Eye } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const metadata: Metadata = {
  title: 'Website Builder for Training Providers | Elevate Store',
  description: 'Build professional training provider websites in minutes. Pre-built templates, LMS integration, enrollment forms, and SEO optimization included.',
  keywords: ['website builder', 'training provider website', 'LMS website', 'education website builder', 'course website', 'enrollment forms', 'SEO'],
  openGraph: {
    title: 'Website Builder for Training Providers',
    description: 'Build professional training provider websites with LMS integration.',
    images: ['/images/pages/technology-sector.webp'],
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

export default function WebsiteBuilderAppPage() {
  const catalog = INDIVIDUAL_APP_CATALOG['website-builder'];

  return (
    <div className="min-h-screen bg-white">
             <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Website Builder" }]} />
      </div>
{/* Hero */}
      <section className="text-slate-900 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-brand-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">WEBSITE</span>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-sm ml-1">4.9 rating</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Website Builder for Training Providers
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Launch a professional training website in minutes. Pre-built templates, LMS integration,
                enrollment forms, and SEO tools included.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/store/apps/website-builder"
                  className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
                >
                  Start 14-day free trial
                </Link>
                <Link
                  href="/import"
                  className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
                >
                  Import existing site
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="aspect-video bg-white rounded-lg overflow-hidden relative">
                  <UltraVideoPlayer
                    src="/videos/training-providers-video-with-narration.mp4"
                    poster="/images/pages/store-hero.webp"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-700 mb-6">Industry-specific templates included</p>
          <div className="flex flex-wrap justify-center gap-3">
            {templates.map((template, i) => (
              <span key={i} className="bg-white px-4 py-2 rounded-full text-sm font-medium text-slate-900 border border-slate-200">
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
              <div key={i} className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 px-4 bg-brand-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Build Your Site in Minutes</h2>
          <p className="text-slate-700 mb-8">Watch how easy it is to create a professional training provider website</p>
          <div className="aspect-video bg-white rounded-2xl overflow-hidden relative">
            <UltraVideoPlayer
              src="/videos/training-providers-video-with-narration.mp4"
              poster="/images/pages/store-hero.webp"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Live Interactive Demo */}
      <section className="py-20 px-4 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-brand-red-600 uppercase tracking-wider mb-3">Interactive Demo</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Try It Before You Buy
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Build a page in real-time with our drag-and-drop editor. No account required for preview.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Builder Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-slate-500">elevatetraining.org/demo</span>
                  </div>
                </div>
                {/* Page preview mock */}
                <div className="p-6">
                  <div className="bg-brand-blue-600 rounded-lg p-4 mb-4 text-white text-center">
                    <p className="font-bold">Workforce Training Center</p>
                    <p className="text-sm text-blue-100">Start your career today</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-200 rounded h-16"></div>
                    <div className="bg-slate-200 rounded h-16"></div>
                    <div className="bg-slate-200 rounded h-16"></div>
                  </div>
                  <div className="bg-slate-100 rounded p-3 text-sm text-slate-600">
                    Enrollment form will appear here
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6">What You Can Build</h3>
              <div className="space-y-4">
                {[
                  { icon: MousePointer, title: 'Drag & Drop Blocks', desc: 'Add videos, forms, testimonials, and more with one click' },
                  { icon: Monitor, title: 'Live Preview', desc: 'See changes instantly as you build' },
                  { icon: Palette, title: 'Industry Templates', desc: 'Healthcare, trades, beauty, technology — pre-styled for you' },
                  { icon: Eye, title: 'LMS Integration', desc: 'Connect enrollment forms directly to Elevate LMS' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/store/demos"
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  <Monitor className="w-5 h-5" />
                  Open Live Demo
                </Link>
                <Link
                  href="/apps/website-builder/start-trial"
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-300 hover:border-brand-blue-500 hover:bg-brand-blue-50 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Start 14-Day Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <IndividualAppPlansSection catalog={catalog} />

      {/* CTA */}
      <section className="py-16 px-4 text-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Launch Your Training Website Today</h2>
          <p className="text-slate-700 mb-8">
            14-day individual free trial — no credit card. Subscribe monthly when you are ready.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/store/apps/website-builder"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold"
            >
              Start Free Trial
            </Link>
            <Link href="/store/apps/website-builder" className="border border-slate-300 hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-lg font-bold">
              Open Website Builder
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
