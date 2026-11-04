import { partnerStandards } from '@/lib/program-holder/professional-standards';
export function PartnerStandards() {
  return (
    <section className="space-y-4 rounded-2xl border border-blue-200 bg-white p-5">
      <h2 className="text-2xl font-black">Our standard: premium education, professional service</h2>
      <p className="text-sm">
        Run your assigned program with the care, preparation and accountability you bring to your
        own business.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {partnerStandards.map(([title, body]) => (
          <details key={title} className="rounded-xl border p-4">
            <summary className="min-h-11 cursor-pointer font-bold">{title}</summary>
            <p className="mt-2 text-sm leading-6">{body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
