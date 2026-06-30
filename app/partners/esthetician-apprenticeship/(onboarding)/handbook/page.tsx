export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Clock, Users, AlertTriangle, Phone, FileText, Scale, ArrowRight } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Partner Handbook | Esthetician Apprenticeship',
  description: 'Responsibilities, policies, and guidelines for esthetician apprenticeship host spa partners.',
};

const STEPS = [
  { id: 'handbook', label: 'Partner Handbook', href: '/partners/esthetician-apprenticeship/handbook' },
  { id: 'policy-acknowledgment', label: 'Policy Acknowledgment', href: '/partners/esthetician-apprenticeship/policy-acknowledgment' },
  { id: 'documents', label: 'Required Documents', href: '/partners/esthetician-apprenticeship/documents' },
  { id: 'forms', label: 'Required Forms', href: '/partners/esthetician-apprenticeship/forms' },
  { id: 'sign-mou', label: 'Sign MOU', href: '/partners/esthetician-apprenticeship/sign-mou' },
];

const sections = [
  {
    id: 'role',
    icon: Users,
    title: 'Your Role as a Host Spa',
    content: [
      'As a host spa, you provide the hands-on training environment where apprentices develop real-world esthetician skills under direct supervision of a licensed esthetician.',
      "You are not just an employer — you are a mentor and trainer. The quality of the apprentice's experience depends on the structure and support you provide.",
    ],
    items: [
      'Designate a supervising esthetician (Indiana IPLA licensed, minimum 2 years experience) for each apprentice',
      'Maintain a supervisor-to-apprentice ratio not to exceed 1:3',
      'Allow apprentices to practice all required competencies progressively across all service categories',
      'Maintain a professional, safe, and inclusive spa environment',
      'Support apprentice attendance at Related Technical Instruction (RTI) through the Elevate LMS',
    ],
  },
  {
    id: 'compensation',
    icon: Scale,
    title: 'Compensation Requirements',
    content: [
      'Apprentices are employees of your spa. You are required to pay them at least Indiana minimum wage for all hours worked, including training time.',
      'You may not charge apprentices for training, tools, or supplies provided as part of the apprenticeship.',
    ],
    items: [
      'Minimum wage: Indiana state minimum wage (currently $7.25/hr federal floor)',
      'Recommended starting wage: $12–$15/hr to attract quality candidates',
      'Apprentices are W-2 employees — withhold taxes, provide pay stubs',
      'Do not deduct training costs from wages',
      'OJT wage reimbursement (up to 50%) available through WorkOne — Elevate coordinates',
    ],
  },
  {
    id: 'hours',
    icon: Clock,
    title: 'Hour Tracking & Verification',
    content: [
      'Indiana requires 1,500 hours of supervised training for esthetician licensure. All hours must be logged and verified.',
    ],
    items: [
      'Log hours weekly in the Elevate partner portal',
      'Supervisor must verify hours monthly with digital signature',
      'Elevate submits verified hours to USDOL RAPIDS system',
      'Apprentice must maintain 80% attendance to remain in good standing',
      'Hours must be completed within 18 months of enrollment start date',
    ],
  },
  {
    id: 'prohibited',
    icon: AlertTriangle,
    title: 'Prohibited Practices',
    content: ['The following practices are strictly prohibited and may result in immediate termination of the partnership agreement.'],
    items: [
      'Charging apprentices for training, tools, or supplies',
      'Requiring apprentices to perform services outside their competency level without supervision',
      'Retaliating against apprentices who report concerns to Elevate',
      'Misrepresenting hours or competency completions',
      'Discriminating against apprentices based on protected characteristics',
      'Using apprentices as unpaid labor for non-training tasks',
    ],
  },
  {
    id: 'contact',
    icon: Phone,
    title: 'Contact & Support',
    content: ['Elevate provides ongoing support throughout the apprenticeship. Contact us for any questions or concerns.'],
    items: [
      'Partner Support: partners@elevateforhumanity.org',
      `Phone: ${PLATFORM_DEFAULTS.supportPhone}`,
      'Compliance issues: compliance@elevateforhumanity.org',
      `Emergency: Call ${PLATFORM_DEFAULTS.supportPhone} and select option 2`,
    ],
  },
];

export default function EstheticianHandbookPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <InstitutionalHeader
          title="Host Spa Partner Handbook"
          subtitle="Esthetician Apprenticeship Program"
          documentType="Partner Handbook"
        />

        <div className="space-y-6 mt-8">
          {sections.map(({ id, icon: Icon, title, content, items }) => (
            <div key={id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-pink-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              </div>
              {content.map((p, i) => (
                <p key={i} className="text-sm text-slate-600 mb-3 leading-relaxed">{p}</p>
              ))}
              <ul className="space-y-2 mt-3">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <Shield className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link href="/partners/esthetician-apprenticeship/apply" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to Application
          </Link>
          <Link
            href="/partners/esthetician-apprenticeship/policy-acknowledgment"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Continue to Policy Acknowledgment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <DocumentFooter programName="Esthetician Apprenticeship" />
      </div>
    </div>
  );
}
