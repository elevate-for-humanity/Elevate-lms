import React from 'react';

type Props = {
  programName?: string;
  isApprenticeship?: boolean;
};

export default function ProgramHowItWorks({
  programName,
  isApprenticeship,
}: Props) {
  return (
    <section className="mt-8 rounded-2xl border p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">
        How {programName ? programName : 'This Program'} Works
      </h2>
      <p className="mt-2 text-sm text-black">
        Structured steps, clear expectations, and real progress tracking—so you
        always know what's next.
      </p>

      <ol className="mt-5 space-y-3">
        <li className="rounded-xl border p-4">
          <div className="font-semibold">1) Apply</div>
          <div className="mt-1 text-sm text-black">
            Submit the quick application so we can confirm your goals,
            eligibility, and best program fit.
          </div>
        </li>

        <li className="rounded-xl border p-4">
          <div className="font-semibold">2) Choose Your Funding Path</div>
          <div className="mt-1 text-sm text-black">
            We guide you into the right option: workforce funding
            (WIOA/WRG/JRI), employer sponsorship, or self-pay/payment plan (if
            available).
          </div>
        </li>

        <li className="rounded-xl border p-4">
          <div className="font-semibold">3) Complete Onboarding</div>
          <div className="mt-1 text-sm text-black">
            You'll receive onboarding steps (documents, expectations, schedule,
            platform access). If compliance items are required, we list them
            upfront.
          </div>
        </li>

        <li className="rounded-xl border p-4">
          <div className="font-semibold">4) Start Training</div>
          <div className="mt-1 text-sm text-black">
            Theory is completed online with progress tracking. Hands-on training
            is completed in-person when the program requires labs/clinical/shop
            hours.
          </div>
        </li>

        <li className="rounded-xl border p-4">
          <div className="font-semibold">
            5) Track Progress + Stay On Schedule
          </div>
          <div className="mt-1 text-sm text-black">
            Attendance and progress are tracked so you stay on pace and can show
            completion for workforce or employer requirements.
          </div>
        </li>

        <li className="rounded-xl border p-4">
          <div className="font-semibold">6) Finish + Next Steps</div>
          <div className="mt-1 text-sm text-black">
            When you complete the requirements, you receive completion
            documentation and next-step support (credentialing guidance and
            career readiness where applicable).
          </div>
        </li>
      </ol>

      {isApprenticeship ? (
        <div className="mt-6 rounded-xl bg-gray-50 p-5">
          <h3 className="text-lg font-semibold">
            Earn While You Learn (Apprenticeship Track)
          </h3>
          <p className="mt-2 text-sm text-black">
            This is job-based training. You learn by working under supervision,
            logging hours, and completing required theory. Compensation
            (hourly/commission/tips) depends on the employer/shop agreement.
          </p>
        </div>
      ) : null}
    </section>
  );
}
