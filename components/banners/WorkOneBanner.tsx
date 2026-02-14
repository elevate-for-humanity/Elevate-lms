import Link from 'next/link';

export function WorkOneBanner() {
  return (
    <div className="w-full border-b bg-brand-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-blue-900">
              Appointment-based info + WorkOne steps (required for funding)
            </p>
            <p className="text-sm text-brand-blue-900/90">
              We are appointment-based for program + funding information. Step
              1: Submit the Elevate for Humanity inquiry form. Step 2: Create
              your account at www.indianacareerconnect.com. Step 3: Schedule an
              appointment with a WorkOne advisor. At your appointment, tell them
              you are there for Elevate for Humanity. After you schedule, come
              back and complete your progress checklist.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-md bg-brand-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700"
            >
              Submit Inquiry
            </Link>

            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-brand-blue-300 bg-white px-3 py-2 text-sm font-semibold text-brand-blue-900 hover:bg-gray-100"
            >
              IndianaCareerConnect
            </a>

            <Link
              href="/next-steps"
              className="inline-flex items-center justify-center rounded-md border border-brand-blue-300 bg-white px-3 py-2 text-sm font-semibold text-brand-blue-900 hover:bg-gray-100"
            >
              Open My Checklist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
