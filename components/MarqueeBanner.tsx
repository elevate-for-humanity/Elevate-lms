'use client';

/**
 * MarqueeBanner - announcement bar with accessible semantic structure.
 * Uses ul/li for screen readers and proper list semantics.
 * Marquee animation for visual interest.
 */
export default function MarqueeBanner() {
  const announcements = [
    'Enrolling Now — Indianapolis Healthcare & Trades Training',
    'WIOA Funding Available — Apply Today',
    "Indiana's Premier Career & Technical Institute",
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
        {/* Duplicate for seamless loop */}
        {announcements.map((text, i) => (
          <li
            key={`dup-${i}`}
            className="shrink-0 px-8 text-sm font-medium text-brand-red-700 whitespace-nowrap aria-hidden"
            aria-hidden="true"
          >
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
