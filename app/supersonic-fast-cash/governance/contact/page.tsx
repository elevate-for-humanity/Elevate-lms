import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Mail, Building2, Shield, Scale, FileText, Zap } from 'lucide-react';
import { QuickSummary } from '@/app/governance/_content/QuickSummary';

export const metadata: Metadata = {
  title: 'Governance Contact | Supersonic Fast Cash',
  description: 'Contact information for governance, compliance, and diligence inquiries for Supersonic Fast Cash.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/contact',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const contactCategories = [
  {
    title: 'General Governance Inquiries',
    icon: Building2,
    email: 'elevate4humanityedu@gmail.com',
    description: 'Questions about platform governance, authoritative documents, or operational controls.',
    responseTime: '2-3 business days',
  },
  {
    title: 'Security & Data Protection',
    icon: Shield,
    email: 'elevate4humanityedu@gmail.com',
    description: 'Security-related questions, data protection inquiries, or incident reports.',
    responseTime: '1-2 business days',
  },
  {
    title: 'Compliance & Legal',
    icon: Scale,
    email: 'elevate4humanityedu@gmail.com',
    description: 'Compliance questions, regulatory inquiries, or legal matters.',
    responseTime: '2-3 business days',
  },
  {
    title: 'Diligence Requests',
    icon: FileText,
    email: 'elevate4humanityedu@gmail.com',
    description: 'Requests for documentation, audits, or partner/buyer due diligence materials.',
    responseTime: '3-5 business days',
  },
];

const summaryBullets = [
  'All governance inquiries are handled by the Elevate for Humanity team',
  'Security reports are prioritized and reviewed within 24 hours',
  'Diligence materials available upon request',
  'Response times vary by inquiry type (1-5 business days)',
];

export default function SupersonicGovernanceContactPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Contact" }]} />
      </div>
{/* Header - Supersonic branded */}
      <div className="bg-emerald-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            href="/governance" 
            className="inline-flex items-center text-emerald-300 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Governance
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 text-sm">Supersonic Fast Cash</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Governance Contact
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            For governance, compliance, security, or diligence inquiries, use the appropriate 
            contact channel below.
          </p>
          <div className="mt-6 text-sm text-emerald-300">
            Last reviewed: {currentDate} • Owner: Platform Governance
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Summary */}
        <QuickSummary
          title="Governance Contact"
          bullets={summaryBullets}
          elevateCanonicalPath="/governance/contact"
          showSupersonicScope
        />

        {/* Contact Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Channels</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {contactCategories.map((category) => (
              <div 
                key={category.title}
                className="border border-slate-200 rounded-xl p-6 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{category.title}</h3>
                </div>
                <p className="text-slate-600 text-sm mb-4">{category.description}</p>
                <a 
                  href={`mailto:${category.email}`}
                  className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700"
                >
                  <Mail className="w-4 h-4" />
                  {category.email}
                </a>
                <p className="text-xs text-slate-500 mt-2">
                  Typical response: {category.responseTime}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What to Include */}
        <section className="mb-12 bg-emerald-50 rounded-xl p-6 border border-emerald-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">What to Include in Your Inquiry</h2>
          <ul className="space-y-2 text-slate-700">
            <li>• Your name and organization (if applicable)</li>
            <li>• The specific document or page your question relates to</li>
            <li>• A clear description of your question or request</li>
            <li>• Any relevant context (e.g., regulatory requirement, partner agreement)</li>
            <li>• Your preferred timeline for response (if urgent)</li>
          </ul>
        </section>

        {/* For Tax Filers */}
        <section className="mb-12 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">For Tax Filers</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about your tax preparation or refund advance:
          </p>
          <ul className="space-y-2 text-slate-700 mb-4">
            <li>• For general tax questions, visit our <Link href="/tax-faq" className="text-emerald-600 hover:text-emerald-700">Tax FAQ</Link></li>
            <li>• For account-specific issues, contact customer support</li>
            <li>• For governance or compliance questions, use the channels above</li>
          </ul>
          <Link
            href="/tax-preparation"
            className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700"
          >
            <FileText className="w-4 h-4" />
            Learn About Tax Preparation
          </Link>
        </section>

        {/* Security Incidents */}
        <section className="mb-12 bg-red-50 rounded-xl p-6 border border-red-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Security Incidents</h2>
          <p className="text-slate-700 mb-4">
            If you need to report a security incident or vulnerability:
          </p>
          <a 
            href="mailto:elevate4humanityedu@gmail.com"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Shield className="w-4 h-4" />
            elevate4humanityedu@gmail.com
          </a>
          <p className="text-sm text-slate-600 mt-4">
            Security reports are prioritized and reviewed within 24 hours.
          </p>
        </section>

        {/* Related Links */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Related Resources</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/governance"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Governance Hub
            </Link>
            <Link
              href="/governance/security"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Security Statement
            </Link>
            <Link
              href="/governance/compliance"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Compliance Framework
            </Link>
            <Link
              href="/tax-preparation"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Tax Preparation
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
