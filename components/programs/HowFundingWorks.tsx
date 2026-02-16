import Link from 'next/link';

interface HowFundingWorksProps {
  programSlug: string;
}

export function HowFundingWorks({ programSlug }: HowFundingWorksProps) {
  return (
    <section className="my-12 p-8 bg-slate-50 rounded-lg">
      <h2 className="text-2xl font-bold text-zinc-900 mb-4">
        How Funding & Enrollment Works
      </h2>
      <p className="text-zinc-700 mb-4">
        Funding for this program is based on your location, eligibility, and
        workforce status. To ensure accuracy and avoid delays, Elevate for
        Humanity uses an appointment-based process in coordination with WorkOne
        and Indiana Career Connect.
      </p>

      <div className="my-6">
        <p className="text-zinc-900 font-semibold mb-3">You will:</p>
        <ul className="space-y-2 text-zinc-700">
          <li className="flex items-start">
            <span className="text-green-600 font-bold mr-2">•</span>
            Submit an inquiry to let us know your goals
          </li>
          <li className="flex items-start">
            <span className="text-green-600 font-bold mr-2">•</span>
            Meet with a WorkOne advisor to determine funding eligibility (WIOA,
            WRG, JRI, Apprenticeship, or other)
          </li>
          <li className="flex items-start">
            <span className="text-green-600 font-bold mr-2">•</span>
            Return to complete your checklist so we can finalize enrollment
          </li>
        </ul>
      </div>

      <p className="text-zinc-700 mb-6">
        This process protects your time and ensures you receive correct
        information the first time.
      </p>

      <Link
        href={`/apply?program=${programSlug}`}
        className="inline-flex items-center justify-center px-6 py-3 text-base font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
      >
        Start Inquiry
      </Link>
    </section>
  );
}
