// Registered Apprenticeship sponsor disclosure block.
// Required on all apprenticeship, barber program, and partner shop pages
// to match RAPIDS record 2025-IN-132301.

export default function SponsorDisclosure() {
  return (
    <div className="bg-brand-blue-700 text-white rounded-lg p-5 sm:p-6 my-8">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Registered Apprenticeship Sponsor Disclosure</p>
      <dl className="space-y-2.5 text-sm">
        <div className="flex flex-col sm:flex-row sm:gap-2">
          <dt className="text-slate-400 font-medium sm:min-w-[180px]">Sponsor of Record:</dt>
          <dd className="font-semibold">2Exclusive LLC-S</dd>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-2">
          <dt className="text-slate-400 font-medium sm:min-w-[180px]">Instructional Provider:</dt>
          <dd className="font-semibold">Elevate for Humanity Career &amp; Training Institute</dd>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-2">
          <dt className="text-slate-400 font-medium sm:min-w-[180px]">Training Sites:</dt>
          <dd className="font-semibold">Sponsor-approved licensed employer and partner locations operating under formal training agreements.</dd>
        </div>
      </dl>
    </div>
  );
}
