/** Lookup IDs transcribed from Indiana DWD INTraining provider-location approval emails:
 * June 12, 2026 (10001138, 10000949), August 3, 2026 (10001154).
 * Provider-location approval is separate from program and participant authorization.
 */
export function ImpactPartnershipBrief({ name }: { name: string }) {
  return (
    <section
      aria-labelledby="impact-appointment"
      className="space-y-5 rounded-2xl border border-blue-200 bg-white p-5 sm:p-7"
    >
      <h2 id="impact-appointment" className="text-2xl font-black">
        Your IMPACT partnership appointment
      </h2>
      <div className="rounded-xl border-l-4 border-blue-700 bg-blue-50 p-5 text-base leading-8 text-slate-950">
        <p>
          Hello, my name is {name}. I represent Elevate for Humanity in the Gary region. We have an
          existing FSSA IMPACT relationship in Indianapolis, and we want to establish a local
          training and referral partnership here.
        </p>
        <p className="mt-3">
          Please look for Elevate for Humanity Career &amp; Technical Institute under INTraining
          Provider Location ID <strong>10001138</strong>. We want to bring our training courses to this area and establish the local partnership and referral process.
        </p>
        <p className="mt-3">
          Who is your training-provider liaison? What agreements, local site approvals, course
          information and onboarding documents do you need? How do referrals, participant approval,
          attendance reporting, progress reports and payment work? Can we leave with a named
          contact, a written checklist and a follow-up meeting?
        </p>
      </div>
      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="min-h-11 cursor-pointer font-bold">
          Provider lookup numbers and meeting notes
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">Approved provider name</th>
                <th className="p-2">Provider Location ID</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">Elevate for Humanity Career &amp; Technical Institute</td>
                <td className="p-2 font-bold">10001138</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Elevate for Humanity Training Center</td>
                <td className="p-2 font-bold">10000949</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Elevate for Humanity</td>
                <td className="p-2 font-bold">10001154</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6">
          These are provider-location lookup IDs, not approval for every course or a new Gary
          training site. Ask the liaison to verify the current provider, course and location record
          before referrals begin.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Get the liaison’s name, role and business contact details.</li>
          <li>
            Ask whether this is a training-referral arrangement, provider/vendor agreement, or SNAP
            E&amp;T third-party partnership and request its onboarding checklist.
          </li>
          <li>
            Confirm the accepted course, delivery method, local-site requirements, tuition and
            participant authorization process.
          </li>
          <li>
            Confirm required reporting, invoicing, payment terms and supportive-service
            coordination.
          </li>
          <li>Record the next action and schedule the follow-up in Calendar and Video.</li>
        </ol>
        <a
          href="https://www.in.gov/fssa/dfr/impact-job-training/training/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-900 underline"
        >
          Indiana FSSA IMPACT training process
        </a>
      </details>
    </section>
  );
}
