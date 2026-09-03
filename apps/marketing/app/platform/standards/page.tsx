import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  CheckCircle, 
  Shield, 
  Layers, 
  Plug, 
  BarChart3, 
  Lock, 
  Globe, 
  Zap,
  FileCheck,
  Building2,
  Users,
  BookOpen,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'LMS Standards & Enterprise Capabilities | Elevate Platform',
  description: 'Enterprise-grade LMS with SCORM 1.2/2004, xAPI (Tin Can), LTI 1.3 integration, SOC 2 compliance, and mature reporting. Built for workforce development at scale.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/standards',
  },
};

const standards = [
  {
    name: 'SCORM 1.2 & 2004',
    description: 'Full SCORM compliance for importing and tracking third-party courseware. Supports completion tracking, scoring, bookmarking, and sequencing.',
    status: 'Supported',
    icon: BookOpen,
    details: [
      'SCORM 1.2 runtime environment',
      'SCORM 2004 3rd/4th Edition',
      'Automatic content packaging detection',
      'CMI data model support',
      'Sequencing and navigation',
    ],
  },
  {
    name: 'xAPI (Tin Can)',
    description: 'Experience API support for tracking learning activities across platforms, mobile apps, simulations, and real-world experiences.',
    status: 'Supported',
    icon: Zap,
    details: [
      'Learning Record Store (LRS) integration',
      'Statement forwarding',
      'Activity streams',
      'Offline learning capture',
      'Cross-platform tracking',
    ],
  },
  {
    name: 'LTI 1.3 / Advantage',
    description: 'Learning Tools Interoperability for seamless integration with external tools, content providers, and institutional systems.',
    status: 'Supported',
    icon: Plug,
    details: [
      'LTI 1.3 Core',
      'Deep Linking',
      'Assignment and Grade Services',
      'Names and Role Provisioning',
      'Platform-to-tool launches',
    ],
  },
  {
    name: 'cmi5',
    description: 'Next-generation e-learning standard combining xAPI flexibility with LMS launch and tracking capabilities.',
    status: 'Supported',
    icon: Layers,
    details: [
      'AU (Assignable Unit) management',
      'Session tracking',
      'Completion and success criteria',
      'xAPI statement generation',
      'Offline support',
    ],
  },
];

const securityCertifications = [
  {
    name: 'SOC 2 Type II',
    description: 'Annual audit for security, availability, and confidentiality controls',
    status: 'Compliant',
    icon: Shield,
  },
  {
    name: 'FERPA',
    description: 'Student data privacy protection for educational records',
    status: 'Compliant',
    icon: Lock,
  },
  {
    name: 'WCAG 2.1 AA',
    description: 'Web accessibility standards for users with disabilities',
    status: 'Compliant',
    icon: Users,
  },
  {
    name: 'GDPR Ready',
    description: 'Data protection and privacy controls for EU compliance',
    status: 'Compliant',
    icon: Globe,
  },
];

const enterpriseFeatures = [
  {
    category: 'Reporting & Analytics',
    icon: BarChart3,
    features: [
      'Real-time dashboards with drill-down',
      'Custom report builder',
      'Scheduled report delivery',
      'WIOA performance metrics',
      'Cohort analysis',
      'Predictive completion analytics',
      'Export to Excel, CSV, PDF',
      'API access for BI tools',
    ],
  },
  {
    category: 'Content Authoring',
    icon: BookOpen,
    features: [
      'Built-in course builder',
      'Video hosting and streaming',
      'Quiz and assessment engine',
      'Interactive content support',
      'SCORM package import',
      'Content versioning',
      'Multi-language support',
      'Accessibility checker',
    ],
  },
  {
    category: 'Integrations',
    icon: Plug,
    features: [
      'REST API with OpenAPI spec',
      'Webhook event system',
      'SSO (SAML 2.0, OAuth 2.0, OIDC)',
      'HRIS integrations',
      'SIS/Student Information Systems',
      'Payment gateways',
      'Calendar sync (Google, Outlook)',
      'Zapier connector',
    ],
  },
  {
    category: 'Multi-Tenancy',
    icon: Building2,
    features: [
      'White-label branding',
      'Custom domains',
      'Isolated data environments',
      'Role-based access control',
      'Tenant-specific configurations',
      'Shared content libraries',
      'Cross-tenant reporting',
      'Hierarchical organizations',
    ],
  },
];

const integrationPartners = [
  { name: 'Zoom', category: 'Video Conferencing' },
  { name: 'Microsoft Teams', category: 'Collaboration' },
  { name: 'Google Workspace', category: 'Productivity' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Workday', category: 'HRIS' },
  { name: 'ADP', category: 'Payroll' },
  { name: 'LinkedIn Learning', category: 'Content' },
  { name: 'Articulate', category: 'Authoring' },
];

export default function PlatformStandardsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Platform', href: '/platform' },
            { label: 'Standards & Capabilities' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Enterprise-Grade LMS
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Industry Standards & Enterprise Capabilities
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Built on universal e-learning standards with mature integrations, 
              enterprise reporting, and third-party validated security. Ready for 
              workforce development at any scale.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Request Demo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs/api"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition border border-white/20"
              >
                API Documentation <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* E-Learning Standards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Universal E-Learning Standards
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Full compliance with industry-standard specifications for content 
              interoperability, tracking, and tool integration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {standards.map((standard) => {
              const Icon = standard.icon;
              return (
                <div key={standard.name} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{standard.name}</h3>
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          {standard.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{standard.description}</p>
                  <ul className="space-y-2">
                    {standard.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Security & Compliance Certifications
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Third-party validated security controls and regulatory compliance 
              for enterprise and government deployments.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityCertifications.map((cert) => {
              const Icon = cert.icon;
              return (
                <div key={cert.name} className="bg-white rounded-xl p-6 border text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{cert.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{cert.description}</p>
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {cert.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/security"
              className="text-blue-600 font-medium hover:underline"
            >
              View Security Documentation →
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise Feature Matrix
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Mature capabilities for reporting, content authoring, integrations, 
              and multi-tenant deployments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {enterpriseFeatures.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.category} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{category.category}</h3>
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {category.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Ecosystem */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Integration Ecosystem
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with the tools your organization already uses through 
              native integrations and open APIs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {integrationPartners.map((partner) => (
              <div key={partner.name} className="bg-white rounded-lg p-4 border text-center">
                <p className="font-semibold text-gray-900">{partner.name}</p>
                <p className="text-xs text-gray-500">{partner.category}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/platform/apps"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              View All Integrations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* API & Developer */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Developer-First API
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                RESTful API with comprehensive documentation, SDKs, and webhook 
                support for custom integrations and automation.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  OpenAPI 3.0 specification
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  OAuth 2.0 authentication
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Rate limiting and quotas
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Sandbox environment
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Webhook event subscriptions
                </li>
              </ul>
              <Link
                href="/docs/api"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline"
              >
                Explore API Documentation <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm">
              <div className="text-slate-400 mb-2"># Get learner progress</div>
              <div className="text-green-400">curl -X GET \</div>
              <div className="text-white pl-4">https://api.elevate.edu/v1/learners/123/progress \</div>
              <div className="text-white pl-4">-H "Authorization: Bearer $TOKEN"</div>
              <div className="mt-4 text-slate-400"># Response</div>
              <div className="text-yellow-400">{'{'}</div>
              <div className="text-white pl-4">"learner_id": "123",</div>
              <div className="text-white pl-4">"courses_completed": 5,</div>
              <div className="text-white pl-4">"certifications": ["CNA", "CPR"],</div>
              <div className="text-white pl-4">"completion_rate": 0.94</div>
              <div className="text-yellow-400">{'}'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to See It in Action?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Schedule a demo to see how our enterprise LMS can support your 
            workforce development programs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Schedule Demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
