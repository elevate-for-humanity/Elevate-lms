'use client';

/**
 * AccordionSection — collapsible FAQ/detail section.
 * No icons. Hard borders. Clean open/close with CSS transition.
 */

import { useState } from 'react';

export interface AccordionItem {
  question: string;
  answer: string | React.ReactNode;
}

interface Props {
  heading?: string;
  items: AccordionItem[];
  bg?: 'white' | 'slate';
}

export default function AccordionSection({ heading, items, bg = 'white' }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const sectionBg = bg === 'slate' ? 'bg-slate-50 border-y border-slate-200' : 'bg-white border-y border-slate-100';

  return (
    <section className={`${sectionBg} py-12 sm:py-16`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {heading && (
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">{heading}</h2>
        )}
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {items.map((item, i) => (
            <div key={i} className="bg-white">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={open === i}
              >
                <span className="font-bold text-slate-900 text-sm sm:text-base pr-4">{item.question}</span>
                <span className="flex-shrink-0 w-5 h-5 border-2 border-slate-400 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                  {open === i ? '−' : '+'}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${open === i ? 'max-h-[600px]' : 'max-h-0'}`}
              >
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
