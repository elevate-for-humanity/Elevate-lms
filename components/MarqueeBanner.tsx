'use client';

/**
 * MarqueeBanner - announcement bar with accessible semantic structure.
 * Keeps the existing visual treatment while describing Elevate as the broader
 * AI-powered humanitarian workforce hub rather than as a traditional institute.
 */
export default function MarqueeBanner() {
  const announcements = [
    'Enrolling Now — Indianapolis Healthcare & Trades Training',
    'WIOA Funding Available — Apply Today',
    'AI-Powered Training • Testing • Apprenticeship • Workforce Support',
  ];

  return (
    <div className="w-full bg-brand-red-50 border-y border-brand-red-100 py-2.5 overflow-hidden" role="region" aria-label="Announcements">
      <ul
        className="flex gap-0 animate-marquee"
        aria-label="Announcement list"
        style={{ listStyle: 'none' }}
      >
        {announcements.map((text, i) => (
          <li
            key={i}
            className="shrink-0 px-8 text-sm font-medium text-brand-red-700 whitespace-nowrap"
          >
            {text}
          </li>
        ))}
        {/* Duplicate for a seamless visual loop; hidden from assistive tech. */}
        {announcements.map((text, i) => (
          <li
            key={`dup-${i}`}
            className="shrink-0 px-8 text-sm font-medium text-brand-red-700 whitespace-nowrap"
            aria-hidden="true"
          >
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
