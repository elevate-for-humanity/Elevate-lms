const TERMS = [
  {
    term: 'WIOA',
    meaning: 'Workforce Innovation and Opportunity Act — a U.S. workforce law that supports eligible employment and training services.',
  },
  {
    term: 'OJT',
    meaning: 'On-the-job training — structured training completed while a participant is working with an employer.',
  },
  {
    term: 'RTI',
    meaning: 'Related Technical Instruction — classroom or technical instruction that complements apprenticeship work experience.',
  },
  {
    term: 'RAPIDS',
    meaning: 'Registered Apprenticeship Partners Information Database System — the federal system used for registered apprenticeship records.',
  },
  {
    term: 'White-label',
    meaning: 'A customer-facing experience presented with your organization’s own name, logo and branding where supported.',
  },
];

export function StoreGlossary() {
  return (
    <section className="border-y border-slate-200 bg-white py-12" aria-labelledby="store-glossary-heading">
      <div className="mx-auto max-w-5xl px-5">
        <h2 id="store-glossary-heading" className="text-2xl font-black text-slate-950">Workforce terms in plain language</h2>
        <p className="mt-2 max-w-3xl font-semibold leading-7 text-slate-700">You do not need to know workforce-program acronyms to choose a product. These definitions explain the terms used in capability descriptions.</p>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          {TERMS.map((item) => (
            <div key={item.term} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-black text-slate-950">{item.term}</dt>
              <dd className="mt-1 text-sm font-semibold leading-6 text-slate-700">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
