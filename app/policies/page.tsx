import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  FileText, 
  Shield, 
  Clock, 
  AlertTriangle, 
  Database, 
  Lock, 
  Users, 
  Scale,
  BookOpen,
  CheckCircle,
  Building,
  Gavel,
  Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Policies & Compliance | Elevate for Humanity',
  description: 'Platform policies, service agreements, and compliance documentation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies',
  },
};

const policies = [
  {
    category: 'Platform Operations',
    items: [
      { name: 'Service Level Agreement', href: '/policies/sla', icon: Clock, description: 'Uptime targets and service credits' },
      { name: 'Incident Response Policy', href: '/policies/incident-response', icon: AlertTriangle, description: 'How we handle security and operational incidents' },
      { name: 'Disaster Recovery Policy', href: '/policies/disaster-recovery', icon: Shield, description: 'Business continuity and data recovery procedures' },
      { name: 'Disaster Recovery Test Report', href: '/policies/disaster-recovery-test', icon: CheckCircle, description: 'Latest DR drill results and documentation' },
      { name: 'Response Time SLA', href: '/policies/response-sla', icon: Clock, description: 'Support response time commitments' },
    ]
  },
  {
    category: 'Privacy & Data',
    items: [
      { name: 'Privacy Policy', href: '/policies/privacy', icon: Lock, description: 'How we collect and use your data' },
      { name: 'Privacy Notice', href: '/policies/privacy-notice', icon: Lock, description: 'Detailed privacy disclosures' },
      { name: 'Data Retention Policy', href: '/policies/data-retention', icon: Database, description: 'How long we keep your data' },
      { name: 'FERPA Compliance', href: '/policies/ferpa', icon: Shield, description: 'Student education records protection' },
    ]
  },
  {
    category: 'Terms & Agreements',
    items: [
      { name: 'Terms of Service', href: '/policies/terms', icon: FileText, description: 'Platform usage terms' },
      { name: 'Acceptable Use Policy', href: '/policies/acceptable-use', icon: Users, description: 'Guidelines for platform use' },
      { name: 'Copyright Policy', href: '/policies/copyright', icon: Scale, description: 'Intellectual property guidelines' },
    ]
  },
  {
    category: 'Academic Policies',
    items: [
      { name: 'Academic Integrity', href: '/policies/academic-integrity', icon: BookOpen, description: 'Honesty and ethics in learning' },
      { name: 'Student Code of Conduct', href: '/policies/student-code', icon: Users, description: 'Expected student behavior' },
      { name: 'Attendance Policy', href: '/policies/attendance', icon: Clock, description: 'Attendance requirements' },
      { name: 'Progress Policy', href: '/policies/progress', icon: CheckCircle, description: 'Academic progress standards' },
      { name: 'Grievance Policy', href: '/policies/grievance', icon: Gavel, description: 'How to file complaints' },
    ]
  },
  {
    category: 'Admissions & Enrollment',
    items: [
      { name: 'Admissions Policy', href: '/policies/admissions', icon: Building, description: 'Enrollment requirements' },
      { name: 'Credential Verification', href: '/policies/credentials', icon: CheckCircle, description: 'How we verify credentials' },
      { name: 'Revocation Policy', href: '/policies/revocation', icon: AlertTriangle, description: 'Credential revocation procedures' },
    ]
  },
  {
    category: 'Compliance & Governance',
    items: [
      { name: 'Federal Compliance', href: '/policies/federal-compliance', icon: Building, description: 'Federal regulatory compliance' },
      { name: 'WIOA Policy', href: '/policies/wioa', icon: Scale, description: 'Workforce Innovation and Opportunity Act' },
      { name: 'AI Usage Policy', href: '/policies/ai-usage', icon: Shield, description: 'How we use AI responsibly' },
      { name: 'Content Policy', href: '/policies/content', icon: FileText, description: 'Content standards and moderation' },
      { name: 'Community Guidelines', href: '/policies/community-guidelines', icon: Users, description: 'Community standards' },
    ]
  },
];

export default function PoliciesIndexPage() {
  return (
    <div className="space-y-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies" }]} />
      </div>
{/* Intro Section */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-black mb-4">Policies & Governance</h1>
        <p className="text-lg text-gray-700 mb-4">
          The following policies describe how the Elevate for Humanity platform is operated, 
          monitored, and governed.
        </p>
        <p className="text-gray-600">
          They outline our service targets, incident response procedures, disaster recovery 
          practices, data retention standards, and security controls in support of partners, 
          agencies, training providers, and other institutional stakeholders.
        </p>
      </div>

      {/* Policy Categories */}
      {policies.map((category) => (
        <div key={category.category} className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            {category.category}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {category.items.map((policy) => {
              const Icon = policy.icon;
              return (
                <Link
                  key={policy.href}
                  href={policy.href}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <Icon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black">{policy.name}</h3>
                    <p className="text-sm text-gray-600">{policy.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Contact */}
      <div className="bg-brand-blue-50 rounded-xl p-6 text-center">
        <p className="text-gray-700">
          Questions about our policies? Contact us at{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-orange-600 hover:underline font-medium">
            elevate4humanityedu@gmail.com
          </a>
        </p>
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
