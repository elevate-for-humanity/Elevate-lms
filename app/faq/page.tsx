import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Phone, Mail, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ | Elevate for Humanity',
  description: 'Frequently asked questions about workforce training, apprenticeships, and funding.',
};

const faqs = [
  { q: 'How do I apply for a program?', a: 'Click the "Apply Now" button on any program page, or visit /apply to get started. You can check your funding eligibility at the same time.' },
  { q: 'How does WIOA funding work?', a: 'WIOA (Workforce Innovation and Opportunity Act) is federal funding that covers tuition, books, and support services for eligible adults and dislocated workers. Visit /funding/wioa for full details.' },
  { q: 'What programs are available?', a: 'We offer programs in healthcare (CNA, Medical Assistant, Phlebotomy), skilled trades (HVAC, Electrical, CDL), technology (IT Help Desk), and beauty (Barber, Cosmetology apprenticeships). See /programs for all options.' },
  { q: 'How long do programs take?', a: 'Program length varies: CNA is 3-6 weeks, HVAC is 8-12 weeks, apprenticeships are 12-18 months. Each program page has specific duration and schedule information.' },
  { q: 'Can I get funding if I am already employed?', a: 'Yes. WIOA funding is available for underemployed workers who earn low wages or need skills upgrades. Contact us to discuss your situation.' },
  { q: 'What is a registered apprenticeship?', a: 'A registered apprenticeship is a DOL-approved program where you earn wages while learning. You work at an employer partner and attend classes. Visit /funding/dol for details.' },
  { q: 'Do you offer payment plans?', a: 'Yes. For self-pay students, we offer monthly payment plans. Many students also qualify for WIOA, WRG, or other funding that covers tuition completely.' },
  { q: 'What certifications can I earn?', a: 'Depending on your program, you can earn CNA certification, EPA 608, NHA certifications (CMA, CPT, Phlebotomy), ACT WorkKeys/NCRC, and more.' },
  { q: 'Do you help with job placement?', a: 'Yes. Our career services team connects graduates with hiring partners. We have relationships with 75+ employers across healthcare, trades, and technology.' },
  { q: 'What if I have a criminal record?', a: 'We work with justice-involved individuals and understand that some programs have licensing requirements. Contact us to discuss your specific situation.' },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-blue-100">Find answers to common questions about our programs and funding.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 pl-9">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Still Have Questions?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">
              <MessageCircle className="w-5 h-5" />
              Contact Us
            </Link>
            <Link href="/funding" className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50">
              Learn About Funding
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
