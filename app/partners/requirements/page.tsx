import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Shop Requirements | Elevate for Humanity',
  description: 'Insurance, licensing, and site requirements for apprenticeship partner shops.',
};

export default function PartnerRequirementsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold">Partner Site Requirements</h1>
          <p className="mt-3 text-slate-300 text-lg">
            Standards for apprenticeship and hands-on training site approval
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <section className="prose prose-gray max-w-none">
          <h2>Apprenticeship Partner Shop Insurance Requirements</h2>

          <p>
            All partner barbershops approved as apprenticeship or hands-on training sites
            with Elevate for Humanity must maintain active commercial insurance appropriate
            for a live service training environment.
          </p>

          <h3>Minimum Required Coverage</h3>
          <p>Partner shops must carry the following active policies:</p>

          <div className="not-prose space-y-4 my-6">
            <div className="border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900">General Liability Insurance</h4>
              <p className="text-sm text-gray-500 mt-1">Minimum: $1,000,000 per occurrence / $2,000,000 aggregate</p>
              <p className="text-sm text-gray-700 mt-2">
                Must cover client injury, property damage, and incidents occurring at the shop location.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900">Professional / Barber Services Liability</h4>
              <p className="text-sm text-gray-700 mt-2">
                Must explicitly cover barbering services performed by staff, trainees, or apprentices
                under supervision in a live service setting.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900">Workers&apos; Compensation Insurance</h4>
              <p className="text-sm text-gray-500 mt-1">Required if the shop employs W-2 staff</p>
              <p className="text-sm text-gray-700 mt-2">
                Independent contractor-only shops must confirm classification with their insurer.
              </p>
            </div>
          </div>

          <h3>Coverage Scope Requirements</h3>
          <ul>
            <li>Insurance must be commercial business coverage tied to the licensed shop location</li>
            <li>
              Personal, booth renter, or individual stylist policies are <strong>not sufficient</strong> for
              apprenticeship training site approval
            </li>
            <li>
              Policy must allow hands-on training, apprentices, and instructional activities
              within the business
            </li>
          </ul>

          <h3>Documentation Requirement</h3>
          <p>
            A current Certificate of Insurance (COI) must be submitted prior to:
          </p>
          <ul>
            <li>Partner approval</li>
            <li>Apprentice placement</li>
            <li>On-site training activities</li>
          </ul>

          <p>The COI must include:</p>
          <ul>
            <li>Legal business name</li>
            <li>Shop address (training location)</li>
            <li>Policy effective dates</li>
            <li>Coverage limits</li>
            <li>Insurance carrier information</li>
          </ul>

          <h3>Additional Insured</h3>
          <p>
            Elevate for Humanity may require partner shops to list the organization as an
            Additional Insured for apprenticeship training conducted at the partner location
            to ensure liability protection and workforce compliance.
          </p>

          <div className="not-prose mt-8 p-5 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              Failure to maintain active and appropriate insurance will result in suspension
              or denial of apprenticeship site approval.
            </p>
          </div>

          <hr className="my-10" />

          <h2>General Partner Site Standards</h2>

          <h3>Licensing</h3>
          <ul>
            <li>Shop must hold a valid state barber or cosmetology establishment license</li>
            <li>All supervising barbers must hold active individual licenses in good standing</li>
            <li>Licenses must be posted and visible at the training location</li>
          </ul>

          <h3>Facility Requirements</h3>
          <ul>
            <li>Adequate workspace for apprentice training stations</li>
            <li>Compliance with local health and safety codes</li>
            <li>Clean, professional environment suitable for instructional activities</li>
            <li>Accessible restroom facilities</li>
          </ul>

          <h3>Supervision</h3>
          <ul>
            <li>A licensed barber must be on-site and available to supervise apprentices at all times during training hours</li>
            <li>Supervisor-to-apprentice ratio must not exceed 1:3</li>
            <li>Supervisors must sign off on apprentice hour logs weekly</li>
          </ul>

          <h3>Record Keeping</h3>
          <ul>
            <li>Partner shops must maintain accurate daily attendance and hour logs for all apprentices</li>
            <li>Records must be available for review by Elevate for Humanity, RAPIDS, or state licensing boards upon request</li>
            <li>Falsification of training hours is grounds for immediate partnership termination</li>
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            These requirements align with Indiana State Board of Barber Examiners regulations
            and RAPIDS Registered Apprenticeship program standards. Last updated March 2026.
          </p>
        </div>
      </div>
    </main>
  );
}
