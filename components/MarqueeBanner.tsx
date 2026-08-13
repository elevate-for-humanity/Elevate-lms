'use client';

/**
 * Homepage announcement strip.
 * Render each announcement once so the live page never shows duplicated copy.
 */
export default function MarqueeBanner() {
  const announcements = [
    'Enrolling Now — Indianapolis Healthcare & Trades Training',
    'WIOA Funding Available — Apply Today',
    'AI-Powered Training • Testing • Apprenticeship • Workforce Support',
  ];

  return (
    <div
      className="w-full border-y border-brand-red-100 bg-brand-red-50"
      role="region"
      aria-label="Announcements"
    >
      <ul
        className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-3 text-center sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
        aria-label="Announcement list"
        style={{ listStyle: 'none' }}
      >
        {announcements.map((text, index) => (
          <li
            key={text}
            className="flex items-center text-sm font-semibold text-brand-red-700"
          >
            {index > 0 ? (
              <span className="mr-6 hidden text-brand-red-300 sm:inline" aria-hidden="true">
                •
              </span>
            ) : null}
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
