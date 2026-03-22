'use client';

/**
 * FactsStrip — horizontal band of 3–6 hard facts.
 * Solid dark background, no gradients, no icons.
 * Each fact: label + value. Visually separates hero from body.
 */

export interface Fact {
  label: string;
  value: string;
}

interface Props {
  facts: Fact[];
  /** Default: slate-900 dark band */
  variant?: 'dark' | 'light' | 'red';
}

export default function FactsStrip({ facts, variant = 'dark' }: Props) {
  const bg =
    variant === 'red'   ? 'bg-brand-red-600 border-brand-red-700' :
    variant === 'light' ? 'bg-slate-50 border-slate-200' :
                          'bg-slate-900 border-slate-800';
  const valueColor =
    variant === 'light' ? 'text-slate-900' : 'text-white';
  const labelColor =
    variant === 'light' ? 'text-slate-500' : 'text-slate-400';
  const divider =
    variant === 'light' ? 'border-slate-200' : 'border-slate-700';

  return (
    <section className={`${bg} border-y`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(facts.length, 4)} divide-x ${divider}`}>
          {facts.map((f, i) => (
            <div key={i} className="px-4 py-5 sm:px-6 sm:py-6 text-center">
              <div className={`text-xl sm:text-2xl font-extrabold ${valueColor} leading-tight`}>{f.value}</div>
              <div className={`text-xs font-semibold uppercase tracking-widest mt-1 ${labelColor}`}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
