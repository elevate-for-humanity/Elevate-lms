export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ | Elevate for Humanity',
  description: 'Frequently asked questions about workforce training, apprenticeships, and funding.',
};

const faqs = [
  { q: 'How do I know if I qualify for WIOA funding?', a: 'If you are unemployed, underemployed, receive public assistance (SNAP, Medicaid), are a veteran, or lack a high school diploma, you may qualify. The best way to find out is to complete our free eligibility check or visit your local WorkOne center.' },
  { q: 'How long do the training programs take?', a: 'Program length varies. Short courses (CPR, OSHA) can be completed in 1-2 days. Healthcare programs like CNA typically take 4-8 weeks. Apprenticeships in barbering or cosmetology take 1-2 years since you earn while you learn.' },
  { q: 'Are the programs really free?', a: 'Many participants qualify for WIOA funding that covers 100% of tuition. Others receive employer sponsorship or state grants. We help you explore all funding options at no cost.' },
  { q: 'What is a DOL-registered apprenticeship?', a: 'A DOL-registered apprenticeship is a federal program that combines paid on-the-job training with classroom instruction. Apprentices earn wages while learning and receive an industry-recognized credential upon completion.' },
  { q: 'Can I work while in the program?', a: 'Yes! For apprenticeships, you earn wages from day one at your host shop. For other programs, many offer evening and weekend schedules to accommodate work.' },
  { q: 'What support do you provide after graduation?', a: 'We offer career coaching, job placement assistance, and employer connections. Our goal is employment outcomes, not just program completion.' },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HelpCircle className="w-12 h-12 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-blue-100">Find answers to common questions about our programs and funding.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl shadow-md group">
                <summary className="p-6 cursor-pointer flex items-center justify-between font-bold text-slate-900">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-slate-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
