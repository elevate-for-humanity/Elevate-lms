import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQSearch } from '@/components/faq/FAQSearch';
import { MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ | Elevate for Humanity',
  description:
    'Frequently asked questions about Elevate career training, enrollment, funding review, apprenticeships, credentials, and career services.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/faq' },
};

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

const faqs: FAQ[] = [
  {
    id: 'funding-1',
    question: 'Is training free?',
    answer:
      'Do not assume a program is free. Some participants may receive third-party workforce funding for an eligible program, but eligibility, approved costs, available funds, and authorization are determined by the responsible funding source. Programs without verified funding should be treated according to their published self-pay or other documented payment terms.',
    category: 'Funding',
    display_order: 1,
  },
  {
    id: 'funding-2',
    question: 'How do I know whether I qualify for WIOA or Workforce Ready Grant funding?',
    answer:
      'Start the application with the exact program you want to attend. Elevate may help with screening and documentation, but screening is not an award. The responsible workforce or state agency determines participant eligibility and must provide the applicable authorization before Elevate treats the enrollment as funded.',
    category: 'Funding',
    display_order: 2,
  },
  {
    id: 'funding-3',
    question: 'Does funding cover books, supplies, exams, transportation, or childcare?',
    answer:
      'Coverage differs by funding source and individual authorization. Do not assume any additional cost or supportive service is covered unless it appears in the participant’s approved documentation from the responsible funding source.',
    category: 'Funding',
    display_order: 3,
  },
  {
    id: 'program-1',
    question: 'What programs do you offer?',
    answer:
      'Elevate publishes career-training pathways across healthcare, skilled trades, business, technology, beauty and personal services, and work-based learning. Use the Programs page and the individual program record for current tuition, duration, credential, schedule, and enrollment information.',
    category: 'Programs',
    display_order: 4,
  },
  {
    id: 'program-2',
    question: 'How long are the programs?',
    answer:
      'Duration varies by program and enrollment pathway. The individual program page is the authoritative public source for the current published duration and schedule.',
    category: 'Programs',
    display_order: 5,
  },
  {
    id: 'program-3',
    question: 'What credential will I earn?',
    answer:
      'Credentials are program-specific. Review the exact program page for the credentialing organization, exam or completion requirement, and whether successful completion of training alone is sufficient to earn the credential.',
    category: 'Programs',
    display_order: 6,
  },
  {
    id: 'apprenticeship-1',
    question: 'Which beauty program is federally registered as an apprenticeship?',
    answer:
      'Barber Apprenticeship is the beauty occupation currently identified in Elevate’s canonical public Registered Apprenticeship configuration. Other beauty pathways must not be represented as federally registered unless the canonical RAPIDS record and supporting standards are updated.',
    category: 'Apprenticeship',
    display_order: 7,
  },
  {
    id: 'apprenticeship-2',
    question: 'Is host-shop placement guaranteed?',
    answer:
      'No. Host-site participation and placement capacity must be confirmed for the individual apprentice. A listed host shop or submitted application does not guarantee employment or assignment.',
    category: 'Apprenticeship',
    display_order: 8,
  },
  {
    id: 'career-1',
    question: 'Do you guarantee a job or a salary?',
    answer:
      'No. Elevate may provide career-services support such as resume preparation, interview preparation, and employer connections, but employment, placement timing, wages, salary, retention, and career outcomes are not guaranteed.',
    category: 'Career Services',
    display_order: 9,
  },
  {
    id: 'enrollment-1',
    question: 'What documents are required?',
    answer:
      'Document requirements vary by program, funding source, employer or clinical site, licensing pathway, and participant circumstances. The application and enrollment team should provide the exact checklist for the selected program rather than relying on a generic list.',
    category: 'Enrollment',
    display_order: 10,
  },
  {
    id: 'enrollment-2',
    question: 'Does submitting an application mean I am enrolled?',
    answer:
      'No. An application begins review. Admission, funding authorization, required documentation, program prerequisites, payment arrangements, and any placement requirements must be satisfied before the applicable enrollment status is final.',
    category: 'Enrollment',
    display_order: 11,
  },
  {
    id: 'general-1',
    question: 'Where is training delivered?',
    answer:
      'Delivery location and modality vary by program. Review the exact program record and enrollment materials for the current location, online or hybrid components, and any required hands-on or employer-based training.',
    category: 'General',
    display_order: 12,
  },
  {
    id: 'support-1',
    question: 'How do I file a complaint or grievance?',
    answer:
      'Use Elevate’s published grievance process and Student Handbook, or contact the organization for the applicable policy and escalation path. Keep copies of any submitted complaint and supporting documentation.',
    category: 'Support',
    display_order: 13,
  },
];

export default function FAQPage() {
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest">Current guidance</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">Frequently Asked Questions</h1>
          <p className="text-slate-300 max-w-3xl mt-5 leading-relaxed">
            General answers do not override the exact program record, enrollment agreement,
            government authorization, apprenticeship standards, credential requirements, or other
            controlling documentation that applies to an individual participant.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <a key={category} href={`#${category}`} className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-200">
              {category}
            </a>
          ))}
        </div>

        <FAQSearch faqs={faqs} />

        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <MessageSquare className="w-10 h-10 text-brand-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Need an answer for your exact record?</h2>
          <p className="text-slate-600 mt-2 mb-5">
            Identify the program, funding source, enrollment status, or apprenticeship occupation so the controlling record can be reviewed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/programs" className="bg-slate-950 text-white px-6 py-3 rounded-lg font-bold">Programs</Link>
            <Link href="/funding" className="border border-slate-300 px-6 py-3 rounded-lg font-bold text-slate-900">Funding</Link>
            <Link href="/contact" className="border border-slate-300 px-6 py-3 rounded-lg font-bold text-slate-900">Contact</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
