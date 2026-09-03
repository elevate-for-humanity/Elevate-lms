'use client';

import React from 'react';

import { useState } from 'react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const faqs = [
  {
    question: 'Why do I need a WorkOne appointment?',
    answer:
      'Funding and eligibility vary by county and workforce status. Appointments ensure accurate guidance.',
  },
  {
    question: 'Can I just walk in or DM you?',
    answer: 'No. Funding decisions are appointment-based only.',
  },
  {
    question: 'What do I tell the advisor?',
    answer:
      "Tell them you are working with {PLATFORM_DEFAULTS.orgName} and the program you're interested in.",
  },
  {
    question: "What if I don't qualify for funding?",
    answer: "We'll discuss alternative pathways after your appointment.",
  },
];

export function ProgramFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold text-zinc-900 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-zinc-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left px-6 py-4 bg-white hover:bg-slate-50 transition-colors flex justify-between items-center"
            >
              <span className="font-semibold text-zinc-900">{faq.question}</span>
              <span className="text-zinc-500 text-xl">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-slate-50 border-t border-zinc-200">
                <p className="text-zinc-700">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
