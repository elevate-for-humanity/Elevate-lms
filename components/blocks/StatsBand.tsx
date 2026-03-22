'use client';

/**
 * StatsBand — full-width band of 3–4 bold stat/value pairs.
 * White background with strong top/bottom borders. No gradients.
 * Distinct from FactsStrip: larger numbers, more breathing room, horizontal rule separators.
 */

export interface Stat {
  value: string;
  label: string;
  note?: string;
}

interface Props {
  stats: Stat[];
  heading?: string;
}

export default function StatsBand({ stats, heading }: Props) {
  return (
    <section className="bg-white border-y-4 border-slate-900 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {heading && (
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-8">{heading}</p>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-none">{s.value}</div>
              <div className="text-sm font-bold text-slate-700 mt-2">{s.label}</div>
              {s.note && <div className="text-xs text-slate-400 mt-1">{s.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
