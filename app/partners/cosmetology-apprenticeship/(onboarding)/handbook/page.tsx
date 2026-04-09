import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import {
  Shield, Clock, Users, AlertTriangle, Phone,
  CheckCircle2, FileText, Scale, ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Handbook | Cosmetology Apprenticeship',
  description: 'Responsibilities, policies, and guidelines for cosmetology apprenticeship host salon partners.',
};

const sections = [
  {
    id: 'role',
    icon: Users,
    title: 'Your Role as a Host Salon',
    content: [
      'As a host salon, you provide the hands-on training environment where apprentices develop real-world cosmetology skills under direct supervision of a licensed cosmetologist.',
      'You are not just an employer — you are a mentor and trainer. The quality of the apprentice\'s experience depends on the structure and support you provide.',
    ],
    items: [
      'Designate a supervising cosmetologist (Indiana IPLA licensed, minimum 2 years experience) for each apprentice',
      'Maintain a supervisor-to-apprentice ratio not to exceed 1:4',
      'Allow apprentices to practice all required competencies progressively across all service categories',
      'Maintain a professional, safe, and inclusive salon environment',
      'Support apprentice attendance at Related Technical Instruction (RTI) through the Elevate LMS',
    ],
  },
  {
    id: 'compensation',
    icon: Scale,
    title: 'Compensation Requirements',
    content: [
      'Apprentices are paid employees. This is not unpaid labor. All compensation must comply with federal and Indiana wage laws.',
    ],
    items: [
      'Hourly Wage — $10.00–$16.00/hour base rate (recommended starting range)',
      'Commission — 30%–50% of services performed by the apprentice (must average at least $7.25/hour per pay period)',
      'Hybrid — $8.00–$10.00/hour base + 15%–25% commission on services',
      'Tip Policy — Apprentices keep 100% of tips earned from their clients',
      'Pay Frequency — Biweekly or semi-monthly, with itemized pay stubs',
      'Workers\' compensation insurance coverage is required for all apprentices',
    ],
  },
  {
    id: 'hours',
    icon: Clock,
    title: 'Hour Tracking & Verification',
    content: [
      'The apprenticeship requires 2,000 hours of on-the-job training. Accurate tracking is essential for program compliance and Indiana IPLA licensure eligibility.',
    ],
    items: [
      'Track all hours worked daily using the Elevate apprentice app or provided timesheets',
      'Supervising cosmetologist must verify and sign off on hours weekly',
      'Submit hour verification reports as requested by the Sponsor',
      'Report any discrepancies or missed time promptly',
      'Do not allow apprentices to perform services without direct supervision',
    ],
  },
  {
    id: 'competencies',
    icon: CheckCircle2,
    title: 'Competency Development',
    content: [
      'Apprentices must demonstrate proficiency across all cosmetology service categories. You are responsible for providing opportunities to practice and for verifying skill development.',
    ],
    items: [
      'Shampoo, conditioning, and scalp treatments',
      'Haircutting — basic, advanced, and razor techniques',
      'Thermal styling — blow-dry, flat iron, curling iron',
      'Chemical services — color, highlights, perms, relaxers',
      'Skin care — facial treatments, waxing, and hair removal',
      'Nail care — manicures, pedicures, and nail enhancements',
      'Sanitation, disinfection, and infection control procedures',
      'Client consultation, communication, and salon business operations',
    ],
  },
  {
    id: 'safety',
    icon: Shield,
    title: 'Workplace Safety & Compliance',
    content: [
      'You must maintain a safe salon that complies with all applicable health, safety, and licensing regulations.',
    ],
    items: [
      'Maintain a valid Indiana salon license in good standing at all times',
      'Follow all Indiana State Board of Cosmetology and Barber Examiners regulations',
      'Ensure proper sanitation and disinfection of all tools, stations, and implements',
      'Maintain current workers\' compensation and general liability insurance',
      'Provide a harassment-free and discrimination-free workplace',
      'Report any workplace injuries or incidents to the Sponsor immediately',
      'Ensure all chemical services are performed with proper ventilation and PPE',
    ],
  },
  {
    id: 'communication',
    icon: Phone,
    title: 'Communication & Reporting',
    content: [
      'Open communication with the Sponsor (Elevate for Humanity) is essential for program success and DOL compliance.',
    ],
    items: [
      'Respond to Sponsor inquiries within 2 business days',
      'Notify the Sponsor immediately of any issues with the apprentice',
      'Allow scheduled site visits for quality assurance and DOL audits',
      'Participate in quarterly check-in calls or meetings',
      'Report any changes to salon ownership, licensing, insurance, or supervising cosmetologist',
      'Notify the Sponsor within 5 business days of any apprentice termination or leave of absence',
    ],
  },
  {
    id: 'prohibited',
    icon: AlertTriangle,
    title: 'Prohibited Practices',
    content: [
      'The following practices are strictly prohibited and may result in immediate termination of the partnership:',
    ],
    items: [
      'Requiring apprentices to work without pay or below minimum wage',
      'Allowing unsupervised service delivery by apprentices',
      'Falsifying hour records or competency sign-offs',
      'Discrimination or harassment of any kind',
      'Requiring apprentices to perform non-cosmetology duties (cleaning, reception) as their primary work',
      'Withholding tips earned by the apprentice',
      'Retaliating against apprentices who report concerns to the Sponsor',
      'Allowing apprentices to perform chemical services without direct supervisor oversight',
    ],
  },
  {
    id: 'termination',
    icon: FileText,
    title: 'Termination & Reassignment',
    content: [
      'Either party may terminate the MOU with 30 days written notice. The Sponsor may terminate immediately for serious violations.',
    ],
    items: [
      'If you need to end the partnership, notify the Sponsor in writing',
      'The Sponsor will work to reassign the apprentice to another approved salon',
      'All outstanding hours and compensation must be settled upon termination',
      'Return any Sponsor-provided materials or equipment',
      'Termination of the salon partnership does not affect the apprentice\'s standing in the program',
    ],
  },
];

export default function CosmetologyPartnerHandbookPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/cosmetology-apprenticeship' },
          { label: 'Handbook' },
        ]} />
      </div>

      <section className="py-8 border-b">
        <div className="max-w-4xl mx-auto px-6">
          <InstitutionalHeader
            documentType="Worksite Partner Handbook"
            title="Cosmetology Apprenticeship — Host Salon Handbook"
            subtitle="Responsibilities, policies, and guidelines for cosmetology apprenticeship host salon partners."
            noDivider
          />
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Program', value: 'Cosmetology Apprenticeship' },
              { label: 'Total Hours', value: '2,000 OJT hours' },
              { label: 'Licensing Body', value: 'Indiana IPLA' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs">{label}</p>
                <p className="font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {sections.map(({ id, icon: Icon, title, content, items }) => (
          <section key={id} id={id} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-purple-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            </div>
            {content.map((p, i) => (
              <p key={i} className="text-slate-600 text-sm leading-relaxed mb-3">{p}</p>
            ))}
            <ul className="space-y-2 mt-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Next step CTA */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center">
          <p className="text-purple-900 font-bold text-lg mb-2">Ready to continue?</p>
          <p className="text-purple-700 text-sm mb-5">After reading this handbook, proceed to sign the MOU and complete your onboarding.</p>
          <Link
            href="/partners/cosmetology-apprenticeship/(onboarding)/sign-mou"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
          >
            Continue to MOU <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <DocumentFooter
          notice="RAPIDS Program No.: 2025-IN-132301 · RTI Provider ID: 208029 · DOL Registered Apprenticeship Sponsor"
        />
      </div>
    </div>
  );
}
