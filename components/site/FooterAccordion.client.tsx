'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface FooterLink {
  name: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface Props {
  sections: FooterSection[];
}

export default function FooterAccordion({ sections }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav
      aria-label="Footer navigation"
      className="divide-y divide-slate-800 border-y border-slate-800 mb-10"
    >
      {sections.map((section) => {
        const isOpen = open === section.title;
        return (
          <div key={section.title}>
            <button
              onClick={() => setOpen(isOpen ? null : section.title)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between py-4 px-1 text-left"
            >
              <span className="text-sm font-bold uppercase tracking-widest text-white">
                {section.title}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <ul className="pb-5 space-y-3 pl-1">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
