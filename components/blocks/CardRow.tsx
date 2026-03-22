'use client';

/**
 * CardRow — horizontal row of 3–4 cards with hard borders, no shadows, no gradients.
 * Each card: title + body. Optional top accent bar per card.
 */

export interface Card {
  title: string;
  body: string;
  /** Optional accent color for top border: 'red' | 'blue' | 'slate' */
  accent?: 'red' | 'blue' | 'slate' | 'green';
}

interface Props {
  heading?: string;
  subheading?: string;
  cards: Card[];
  /** Background of the section */
  bg?: 'white' | 'slate';
}

export default function CardRow({ heading, subheading, cards, bg = 'slate' }: Props) {
  const sectionBg = bg === 'slate' ? 'bg-slate-50 border-y border-slate-200' : 'bg-white border-y border-slate-100';

  const accentClass = (accent?: string) => {
    if (accent === 'red')   return 'border-t-4 border-t-brand-red-600';
    if (accent === 'blue')  return 'border-t-4 border-t-brand-blue-600';
    if (accent === 'green') return 'border-t-4 border-t-brand-green-600';
    return 'border-t-4 border-t-slate-900';
  };

  return (
    <section className={`${sectionBg} py-12 sm:py-16`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(heading || subheading) && (
          <div className="mb-10">
            {heading && <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">{heading}</h2>}
            {subheading && <p className="text-slate-500 text-base max-w-2xl">{subheading}</p>}
          </div>
        )}
        <div className={`grid sm:grid-cols-2 lg:grid-cols-${Math.min(cards.length, 4)} gap-4`}>
          {cards.map((c, i) => (
            <div
              key={i}
              className={`bg-white border border-slate-200 rounded-xl p-6 ${accentClass(c.accent)}`}
            >
              <h3 className="font-extrabold text-slate-900 text-base mb-2">{c.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
