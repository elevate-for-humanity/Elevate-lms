import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, DollarSign, GraduationCap, Shield, ArrowRight, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Resources & Guides | Elevate for Humanity',
  description: 'Informational resources about tax preparation, workforce training, and learning systems. General guidance to help you understand how these processes work.',
  alternates: {
    canonical: `${SITE_URL}/resources`,
  },
  openGraph: {
    title: 'Resources & Guides | Elevate for Humanity',
    description: 'Informational resources about tax preparation, workforce training, and learning systems.',
    url: `${SITE_URL}/resources`,
    siteName: 'Elevate for Humanity',
    type: 'website',
  },
};

const taxResources = [
  {
    title: 'How Tax Filing Works: A Step-by-Step Overview',
    description: 'Explains the general tax filing process from preparation through refund issuance.',
    href: '/resources/how-tax-filing-works',
  },
  {
    title: 'Tax Refund Timelines: What to Expect After Filing',
    description: 'Covers common refund timelines and why they can vary.',
    href: '/resources/tax-refund-timeline-explained',
  },
  {
    title: 'How Refund-Based Advances Work (General Information)',
    description: 'Provides high-level information about refund-based advance options.',
    href: '/resources/how-refund-advances-work',
  },
];

const workforceResources = [
  {
    title: 'WIOA Eligibility Guide',
    description: 'Learn about funding eligibility requirements for workforce training.',
    href: '/wioa-eligibility',
  },
  {
    title: 'Career Services',
    description: 'Resume help, interview prep, and job placement support.',
    href: '/career-services',
  },
  {
    title: 'Program Catalog',
    description: 'Browse all available training programs.',
    href: '/programs',
  },
];

const platformResources = [
  {
    title: 'Security & Data Protection Statement',
    description: 'Explains how the platform protects data through secure systems and access controls.',
    href: '/governance/security',
  },
  {
    title: 'Authoritative Documentation Index',
    description: 'Single source of truth for platform governance and operations.',
    href: '/governance',
  },
];

export default function ResourcesPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Resources' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <span className="text-blue-400 font-medium">Resource Library</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Resources & Guides
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Informational content about tax preparation, workforce training, and learning systems. 
            These materials help you understand how these processes typically work.
          </p>
          <div className="mt-6 text-sm text-slate-400">
            Last reviewed: {currentDate} • Reviewed by: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* About These Resources */}
        <section className="mb-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">About These Resources</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            This resource library provides general, informational content about tax preparation, 
            workforce training, and learning systems. The goal is to help readers understand how 
            these processes typically work and what to expect.
          </p>
          <p className="text-slate-700 leading-relaxed">
            All content published here follows internal review standards and is aligned with our{' '}
            <Link href="/governance" className="text-blue-600 hover:text-blue-700 font-medium">
              authoritative documentation
            </Link>. These materials are informational only and are not intended as legal, 
            financial, or tax advice.
          </p>
        </section>

        {/* Tax Preparation & Refunds */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Tax Preparation & Refunds</h2>
          </div>
          <div className="space-y-4">
            {taxResources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{resource.title}</h3>
                    <p className="text-slate-600 text-sm">{resource.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Workforce Training & Programs */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Workforce Training & Programs</h2>
          </div>
          <div className="space-y-4">
            {workforceResources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{resource.title}</h3>
                    <p className="text-slate-600 text-sm">{resource.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Data Protection & Platform Operations */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Data Protection & Platform Operations</h2>
          </div>
          <div className="space-y-4">
            {platformResources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{resource.title}</h3>
                    <p className="text-slate-600 text-sm">{resource.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Editorial Standards */}
        <section className="mb-12 bg-amber-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-900">Editorial Standards</h2>
          </div>
          <p className="text-slate-700 mb-4">All resources published here:</p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              Are reviewed for accuracy and clarity
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              Avoid guarantees or promises
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              Use plain-language explanations
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              Are updated periodically as practices evolve
            </li>
          </ul>
          <p className="text-slate-600 mt-4 text-sm">
            For details on how these standards are enforced, see our{' '}
            <Link href="/governance" className="text-blue-600 hover:text-blue-700 font-medium">
              Authoritative Documentation Index
            </Link>.
          </p>
        </section>

        {/* Need Help */}
        <section className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Need Help?</h2>
          <p className="text-slate-600 mb-4">
            Contact our support team for assistance with any questions.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </Link>
        </section>
      </div>
    </div>
  );
}
