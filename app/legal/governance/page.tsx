import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, ChevronRight, Shield, Scale, BookOpen, ShoppingCart, Calculator, UserPlus, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Governance Documents | Elevate For Humanity',
  description: 'Authoritative governance documents for Elevate For Humanity platform operations, compliance, and standards.',
};

const documents = [
  {
    id: 'EFH-GOV-001',
    title: 'Platform Overview and Governance',
    description: 'Platform components, user roles, governance model, and organizational structure.',
    href: '/legal/governance/platform-overview',
    icon: Building,
    color: 'bg-gray-100 text-gray-700',
    owner: 'Executive Director',
  },
  {
    id: 'EFH-SEC-001',
    title: 'Security and Data Protection Statement',
    description: 'Data handling, encryption, access controls, incident response, and user responsibilities.',
    href: '/legal/governance/security',
    icon: Shield,
    color: 'bg-orange-100 text-orange-700',
    owner: 'Data Protection Officer',
  },
  {
    id: 'EFH-COM-001',
    title: 'Compliance and Disclosure Framework',
    description: 'Regulatory compliance, required disclosures, consumer protection, and accessibility.',
    href: '/legal/governance/compliance',
    icon: Scale,
    color: 'bg-brand-blue-100 text-brand-blue-700',
    owner: 'Chief Compliance Officer',
  },
  {
    id: 'EFH-LMS-001',
    title: 'LMS Governance and Course Standards',
    description: 'Course creation, instructor requirements, certification policies, and quality assurance.',
    href: '/legal/governance/lms-standards',
    icon: BookOpen,
    color: 'bg-green-100 text-green-700',
    owner: 'Director of Education',
  },
  {
    id: 'EFH-STO-001',
    title: 'Store, Payments, and Licensing Framework',
    description: 'E-commerce operations, payment processing, digital licensing, and refund policies.',
    href: '/legal/governance/store-payments',
    icon: ShoppingCart,
    color: 'bg-brand-blue-100 text-brand-blue-700',
    owner: 'Director of Operations',
  },
  {
    id: 'EFH-TAX-001',
    title: 'Tax Preparation and Refund Advance Operations',
    description: 'Supersonic Fast Cash services, IRS compliance, refund advances, and data security.',
    href: '/legal/governance/tax-operations',
    icon: Calculator,
    color: 'bg-red-100 text-red-700',
    owner: 'Tax Operations Manager',
  },
  {
    id: 'EFH-UX-001',
    title: 'Onboarding and User Experience Standards',
    description: 'User journeys, accessibility standards, support channels, and design system.',
    href: '/legal/governance/onboarding-ux',
    icon: UserPlus,
    color: 'bg-teal-100 text-teal-700',
    owner: 'Director of Product',
  },
];

export default function GovernanceIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Governance" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Governance</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Governance Documents</h1>
          <p className="text-gray-300 max-w-2xl">Authoritative reference documents for Elevate For Humanity platform operations, compliance, and standards. These documents are audit-ready and serve as the single source of truth for all governance matters.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Document Set Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold">7</p>
            </div>
            <div>
              <p className="text-gray-500">Version</p>
              <p className="text-2xl font-bold">1.0</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-2xl font-bold">Jan 2025</p>
            </div>
            <div>
              <p className="text-gray-500">Review Cycle</p>
              <p className="text-2xl font-bold">Annual</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link
                key={doc.id}
                href={doc.href}
                className="block bg-white rounded-lg border hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="p-6 flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${doc.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-gray-500">{doc.id}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{doc.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{doc.description}</p>
                    <p className="text-xs text-gray-500">Owner: {doc.owner}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Document Cross-References</h2>
          <p className="text-gray-600 text-sm mb-4">These documents are designed to work together as a complete governance framework. Key relationships:</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>Platform Overview</strong> provides context for all other documents and defines the organizational structure.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>Security Statement</strong> applies to all platform components described in LMS, Store, and Tax Operations documents.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>Compliance Framework</strong> establishes regulatory requirements referenced by Tax Operations and Store documents.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>UX Standards</strong> defines accessibility and support standards that apply across all user-facing components.</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>For questions about these documents, contact: elevate4humanityedu@gmail.com</p>
          <p className="mt-1">© 2025 Elevate For Humanity. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
