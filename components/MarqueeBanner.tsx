'use client';

/**
 * MarqueeBanner — continuously scrolling Elevate brand ticker.
 * Runs indefinitely; does not pause on scroll or hover.
 */

const ITEMS = [
  'ELEVATE FOR HUMANITY',
  'WIOA FUNDED TRAINING',
  'DOL REGISTERED APPRENTICESHIP',
  'INDIANA ETPL APPROVED',
  'CNA CERTIFICATION',
  'CDL CLASS A',
  'HVAC · WELDING · ELECTRICAL',
  'BARBER APPRENTICESHIP',
  'EARN WHILE YOU LEARN',
  "APPLY NOW — IT'S FREE",
  '$0 FOR ELIGIBLE PARTICIPANTS',
  'INDIANAPOLIS, INDIANA',
];

export default function MarqueeBanner() {
  const row = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-slate-900 border-y border-slate-800 py-3.5 overflow-hidden select-none" aria-hidden="true">
      <div className="flex whitespace-nowrap" style={{ animation: 'elevate-marquee 40s linear infinite' }}>
        {row.map((item, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="text-sm font-black tracking-widest text-white uppercase">{item}</span>
            <span className="mx-5 text-brand-red-500 font-black">✦</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes elevate-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
