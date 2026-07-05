import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: `FAQ | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Frequently asked questions about workforce training, apprenticeships, funding, and enrollment.',
};

const faqCategories = [
  {
    category: 'Funding & Payment',
    questions: [
      {
        q: 'How do I qualify for WIOA funding?',
        a: 'WIOA funding is available to adults and dislocated workers who meet income guidelines. Contact your local WorkOne center or apply through Elevate — we help determine your eligibility and guide you through the process.',
      },
      {
        q: 'What funding options are available?',
        a: 'We accept WIOA Title I, Indiana Workforce Ready Grant, Vocational Rehabilitation, Trade Adjustment Assistance, and employer sponsorships. Many students pay nothing.',
      },
      {
        q: 'Do you offer payment plans?',
        a: 'Yes. BNPL options are available for students who qualify. You can spread tuition over 3, 6, or 12 months with 0% interest on approved programs.',
      },
      {
        q: 'Is there a fee to apply?',
        a: 'No. Applying is free. If a program has an enrollment fee, it will be clearly stated and may be covered by funding.',
      },
    ],
  },
  {
    category: 'Programs & Training',
    questions: [
      {
        q: 'How long do programs take?',
        a: 'Program lengths vary. CNA takes 6 weeks. HVAC technician training takes 6 weeks. CDL Class A takes 4-8 weeks. Apprenticeships run 12-18 months while you earn.',
      },
      {
        q: 'Are programs in-person or online?',
        a: 'Most programs are in-person with hands-on training. Some theory components may be available online. Clinical and OJT hours are always in-person.',
      },
      {
        q: 'Do I need a high school diploma or GED?',
        a: 'Most programs require a high school diploma or GED. Some programs may have exceptions — contact us to discuss your situation.',
      },
      {
        q: 'What certifications will I earn?',
        a: 'Certifications vary by program. Examples include CNA (Indiana state), EPA 608 Universal, CDL Class A/B, and industry-recognized credentials in trades and technology.',
      },
    ],
  },
  {
    category: 'Apprenticeships',
    questions: [
      {
        q: 'What is a registered apprenticeship?',
        a: 'A DOL-registered apprenticeship combines paid on-the-job training with related classroom instruction. You earn while you learn and earn an industry-recognized credential.',
      },
      {
        q: 'How do apprenticeships work at Elevate?',
        a: 'You apply, get matched with an employer sponsor, and work full-time while completing training hours. You receive a paycheck and mentorship throughout.',
      },
      {
        q: 'Do I need experience to start an apprenticeship?',
        a: 'No. Most registered apprenticeships have no experience requirements. You learn everything on the job with supervised training.',
      },
      {
        q: 'What trades are available?',
        a: 'Current apprenticeships include Barber, Cosmetology, Culinary Arts, and more. Contact us for the latest availability.',
      },
    ],
  },
  {
    category: 'Enrollment & Scheduling',
    questions: [
      {
        q: 'How do I apply?',
        a: 'Click "Apply Now" on any program page, or visit /apply. Complete the short form and an advisor will contact you within 1 business day.',
      },
      {
        q: 'When do programs start?',
        a: 'Program start dates vary. CNA typically starts every 4-6 weeks. HVAC and CDL have rolling admissions. Check specific program pages for upcoming start dates.',
      },
      {
        q: 'Can I work while in training?',
        a: 'It depends on the program. Short-term programs (4-8 weeks) often require full-time commitment. Apprenticeships are paid positions so you work and train simultaneously.',
      },
      {
        q: 'What if I need to miss class?',
        a: 'Attendance policies vary by program. Talk to your instructor or advisor. Excessive absences may affect your completion timeline.',
      },
    ],
  },
  {
    category: 'Job Placement',
    questions: [
      {
        q: 'Do you help with job placement?',
        a: 'Yes. Career services include resume assistance, interview preparation, and employer connections. Many programs have direct hiring agreements with local employers.',
      },
      {
        q: 'What salary can I expect after graduation?',
        a: 'Salaries vary by field, location, and experience. CNA: $28K-$38K. HVAC: $35K-$65K. CDL: $50K-$80K. Apprenticeship completers often start higher due to experience.',
      },
      {
        q: 'Do employers recognize your credentials?',
        a: 'Yes. Our certifications are industry-recognized. EPA 608, CNA (Indiana state), CDL (DOT), and trade licenses are recognized nationally.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Everything you need to know about our programs, funding, and enrollment
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((cat, i) => (
            <div key={i} className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                {cat.category}
              </h2>
              <div className="space-y-4">
                {cat.questions.map((item, j) => (
                  <details key={j} className="group bg-slate-50 rounded-xl">
                    <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-slate-900 hover:text-brand-red-600 transition-colors list-none">
                      <span>{item.q}</span>
                      <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                    </summary>
                    <div className="px-5 pb-5 text-slate-600 leading-relaxed">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h2>
          <p className="text-slate-600 mb-8">
            Our advisors are here to help you find the right program and funding.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/apply"
              className="w-full sm:w-auto px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:border-brand-red-500 hover:text-brand-red-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
