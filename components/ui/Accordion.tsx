'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ items, allowMultiple = false }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        return (
          <div key={item.id}>
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-black">{item.title}</span>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && <div className="p-4 pt-0 text-black">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
};
