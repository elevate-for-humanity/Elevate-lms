export const dynamic = 'force-static';


import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import { Play, Star, Search, Bell, FileText, DollarSign, Calendar, Users } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const metadata: Metadata = {
  title: 'Grants Discovery & Management App | Elevate Store',
  description: 'Find and manage federal, state, and foundation grants. AI-powered grant matching, application tracking, deadline alerts, and compliance reporting.',
  keywords: ['grants', 'grant management', 'federal grants', 'grants.gov', 'foundation grants', 'grant writing', 'grant tracking', 'nonprofit funding'],
  openGraph: {
    title: 'Grants Discovery & Management App',
    description: 'Find and manage federal, state, and foundation grants with AI-powered matching.',
    images: ['/images/pages/homepage-why-elevate.webp'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/apps/grants',
  },
};

const features = [
  { icon: Search, title: 'AI Grant Matching', desc: 'Smart algorithms find grants that match your organization' },
  { icon: Bell, title: 'Deadline Alerts', desc: 'Never miss a deadline with automated reminders' },
  { icon: FileText, title: 'Application Tracking', desc: 'Track all applications from draft to award' },
  { icon: DollarSign, title: 'Budget Management', desc: 'Track grant budgets and expenditures' },
  { icon: Calendar, title: 'Reporting Calendar', desc: 'Automated compliance reporting schedules' },
  { icon: Users, title: 'Team Collaboration', desc: 'Work together on applications and reports' },
];

const grantSources = [
  'Grants.gov Federal Opportunities',
  'State Government Grants',
  'Foundation Directory Online',
  'Corporate Giving Programs',
  'Community Development Grants',
  'Workforce Development Funding',
];

export default function GrantsAppPage() {
  const catalog = INDIVIDUAL_APP_CATALOG.grants;

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Grants" }]} />
      </div>
{/* Hero */}
      <section className="text-slate-900 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-brand-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">FUNDING</span>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-sm ml-1">4.8 (89 reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Grants Discovery & Management App
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Find the right grants faster with AI-powered matching. Track applications, manage deadlines, and streamline compliance reporting.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/apps/grants/start-trial"
                  className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
                >
                  Start 14-day free trial
                </Link>
                <button className="inline-flex items-center gap-2 border border-slate-300 hover:bg-white text-slate-900 px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="aspect-video bg-white rounded-lg overflow-hidden relative">
                  <CanonicalVideo
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

      {/* Grant Sources */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-700 mb-6">Search grants from multiple sources</p>
          <div className="flex flex-wrap justify-center gap-4">
            {grantSources.map((source, i) => (
              <span key={i} className="bg-white px-4 py-2 rounded-full text-sm font-medium text-slate-900 border border-slate-200">
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-brand-green-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-7 h-7 text-brand-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 px-4 bg-brand-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">See How It Works</h2>
          <p className="text-slate-700 mb-8">Watch a complete walkthrough of the grants discovery and management process</p>
          <div className="aspect-video bg-white rounded-2xl overflow-hidden relative">
            <CanonicalVideo
              src="/videos/training-providers-video-with-narration.mp4"
              poster="/images/pages/store-hero.webp"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <IndividualAppPlansSection catalog={catalog} />

      {/* CTA */}
      <section className="py-16 px-4 text-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start Finding Grants Today</h2>
          <p className="text-slate-700 mb-8">14-day individual free trial — no credit card. Subscribe monthly when you are ready.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apps/grants/start-trial" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold">
              Start Free Trial
            </Link>
            <Link href="/contact" className="border border-slate-300 hover:bg-white text-slate-900 px-8 py-4 rounded-lg font-bold">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
