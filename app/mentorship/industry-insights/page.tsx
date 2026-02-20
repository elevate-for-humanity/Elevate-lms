
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Lightbulb, ArrowRight, TrendingUp, Briefcase, BarChart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Industry Insights Mentorship | Elevate for Humanity',
  description: 'Gain insider knowledge about your target industry from experienced professionals. Understand trends, opportunities, and challenges.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/industry-insights' },
};

export default function IndustryInsightsPage() {

  const industries = ['Healthcare', 'Skilled Trades', 'Technology', 'Business', 'Beauty & Cosmetology'];

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentorship", href: "/mentorship" }, { label: "Industry Insights" }]} />
      </div>
<div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/mentorship" className="hover:text-brand-blue-600">Mentorship</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Industry Insights</span>
          </nav>
        </div>
      </div>

      <section className="relative h-[350px] flex items-center justify-center text-white overflow-hidden">
        <Image src="/images/hero/portal-hero.jpg" alt="Industry Insights" fill className="object-cover" priority quality={90} sizes="100vw" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Industry Insights</h1>
          <p className="text-xl text-indigo-100">Learn from professionals who know your industry</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What You Will Learn</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-indigo-50 rounded-xl p-6 text-center">
              <TrendingUp className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Industry Trends</h3>
              <p className="text-gray-600">Stay ahead of changes and emerging opportunities</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-6 text-center">
              <Briefcase className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Career Paths</h3>
              <p className="text-gray-600">Understand different roles and advancement opportunities</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-6 text-center">
              <BarChart className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Market Demand</h3>
              <p className="text-gray-600">Know which skills employers are looking for</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Industries We Cover</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {industries.map((industry, i) => (
              <span key={i} className="bg-white px-6 py-3 rounded-full shadow-sm text-gray-700 font-medium">
                {industry}
              </span>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-8">
            Our mentors have real-world experience in these industries and can share valuable insights about what it takes to succeed.
          </p>
        </div>
      </section>

      <section className="py-16 bg-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Get Industry Knowledge</h2>
          <p className="text-xl text-indigo-100 mb-8">Connect with mentors who have been where you want to go.</p>
          <Link href="/apply" className="bg-white hover:bg-gray-100 text-indigo-700 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply for Mentorship <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
