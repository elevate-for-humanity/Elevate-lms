'use client';

import Link from 'next/link';

interface ProgramNavProps {
  sections: Array<{
    id: string;
    label: string;
  }>;
}

export function ProgramNav({ sections }: ProgramNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-[72px] z-40 shadow-sm" aria-label="Program sections">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="px-4 py-2 text-sm font-semibold text-black hover:text-brand-blue-600 hover:bg-gray-50 rounded-lg transition whitespace-nowrap"
            >
              {section.label}
            </a>
          ))}
          <Link
            href="/apply"
            className="px-4 py-2 text-sm font-bold text-white bg-brand-orange-600 hover:bg-brand-orange-700 rounded-lg transition whitespace-nowrap ml-auto"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
