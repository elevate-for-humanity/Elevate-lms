import { Metadata } from 'next';
import Link from 'next/link';
import { 
  FileText, Shield, Scale, Search, Settings, Mail, 
  ArrowRight, Building2, Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Governance | Elevate for Humanity',
  description: 'Platform governance, authoritative documents, and operational controls. For partners, buyers, reviewers, and agency representatives.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const quickLinks = [
  {
    title: 'Authoritative Documents',
    description: 'The seven governing documents that define platform operations',
    href: '/governance/authoritative-docs',
    icon: FileText,
  },
  {
    title: 'Security & Data Protection',
    description: 'How data is collected, protected, and managed',
    href: '/governance/security',
    icon: Shield,
  },
  {
    title: 'Compliance & Disclosures',
    description: 'Legal, financial, and eligibility standards',
    href: '/governance/compliance',
    icon: Scale,
  },
  {
    title: 'SEO & Indexing Governance',
    description: 'How search visibility is controlled and enforced',
    href: '/governance/seo-indexing',
    icon: Search,
  },
  {
    title: 'Operational Controls',
    description: 'Audits, CI gates, and deployment controls',
    href: '/governance/operational-controls',
    icon: Settings,
  },
  {
    title: 'Governance Contact',
    description: 'Who to contact for diligence questions',
    href: '/governance/contact',
    icon: Mail,
  },
];

const highlights = [
  'Single source of truth for all platform operations',
  'Documented security and data protection practices',
  'Automated enforcement of indexing and content rules',
  'Regular audits of LMS, Store, and compliance',
  'Clear change management and review processes',
];

export default function GovernancePage() {
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
          <Breadcrumbs items={[{ label: 'Governance' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-brand-blue-400" />
            <span className="text-brand-blue-400 font-medium">Platform Governance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Governance
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            This page provides a clear overview of how the platform is governed, documented, 
            and controlled across the public site, LMS, Store, and Supersonic Fast Cash services.
          </p>
          <div className="mt-6 text-sm text-slate-400">
            Last reviewed: {currentDate} • Owner: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* For Reviewers */}
        <section className="mb-12 bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">For Partners, Buyers & Reviewers</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            If you are a partner, buyer, reviewer, or agency representative, this is the best 
            starting point for understanding how the platform operates and how risk is managed.
          </p>
          <p className="text-slate-700 leading-relaxed">
            All governance documents are designed to stand alone during diligence, regulatory 
            review, or payment processor review.
          </p>
        </section>

        {/* What You'll Find */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What You Will Find Here</h2>
          <div className="space-y-3">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-brand-blue-100 transition-colors">
                    <link.icon className="w-5 h-5 text-slate-600 group-hover:text-brand-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">{link.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Related Resources */}
        <section className="mb-12 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/resources"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-brand-blue-300 hover:text-brand-blue-600 transition-colors"
            >
              Resource Library
            </Link>
            <Link
              href="/privacy-policy"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-brand-blue-300 hover:text-brand-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-brand-blue-300 hover:text-brand-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/accessibility"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:border-brand-blue-300 hover:text-brand-blue-600 transition-colors"
            >
              Accessibility
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Questions?</h2>
          <p className="text-slate-600 mb-6">
            For diligence inquiries or governance questions, contact our team.
          </p>
          <Link
            href="/governance/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Governance Team
          </Link>
        </section>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
