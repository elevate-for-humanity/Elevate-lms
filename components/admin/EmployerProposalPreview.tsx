import { Employer } from '@/lms-data/employers';
import { getProgramsWithTuitionMeta } from '@/lms-data/tuition';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const programsWithTuition = getProgramsWithTuitionMeta();

interface Props {
  employer: Employer;
}

export function EmployerProposalPreview({ employer }: Props) {
  const employerPrograms = programsWithTuition.filter((p) =>
    employer.interestedPrograms.includes(p.program.id),
  );

  return (
    <div className="space-y-4 text-xs text-slate-200">
      <section className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
        <p className="text-[11px] font-semibold text-slate-100">
          Draft Employer Proposal – {employer.name}
        </p>
        <p className="mt-2 text-[11px] text-slate-200">
          Dear {employer.contactName || 'Employer Partner'},
        </p>
        <p className="mt-2 text-[11px] text-slate-300">
          {PLATFORM_DEFAULTS.orgName} Career and Technical Institute is a workforce hub that combines
          credentialed training, soft skills, and on-the-job experiences so your hires show up
          ready, not just certified. We are approved with your local workforce system and actively
          align with JRI, WRG, WEX, OJT, apprenticeships and employer-sponsored training.
        </p>
        <p className="mt-2 text-[11px] text-slate-300">
          Below is a high-level summary of how we can partner with{' '}
          <span className="font-semibold">{employer.name}</span> to build and grow your talent
          pipeline.
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
        <p className="text-[11px] font-semibold text-slate-100">
          Proposed Pathways for Your Organization
        </p>
        {employerPrograms.length ? (
          <ul className="mt-2 space-y-2 text-[11px] text-slate-300">
            {employerPrograms.map(({ program, tuition }) => (
              <li key={program.id} className="rounded-lg bg-slate-900/80 p-2">
                <p className="font-semibold text-slate-100">{program.title}</p>
                {tuition?.baseTuition && (
                  <p className="text-[10px] text-slate-400">
                    Typical tuition range: {tuition.baseTuition}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-slate-300">
                  This pathway can be delivered using Elevate&apos;s LMS, credential partners, and
                  your worksite as a real-world learning lab. We will align soft skills (JRI style),
                  technical content, and work experience to your expectations.
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] text-slate-300">
            No specific programs have been mapped to this employer yet. An admin can update
            employer.interestedPrograms in lms-data/employers.ts.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
        <p className="text-[11px] font-semibold text-slate-100">
          Funding & Earn-While-You-Learn Options
        </p>
        <p className="mt-2 text-[11px] text-slate-300">
          Depending on the program and participant eligibility, Elevate may braid together:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-slate-300">
          <li>
            <span className="font-semibold">Job Ready Indy (JRI)</span> for soft skills and work
            readiness, often with stipends.
          </li>
          <li>
            <span className="font-semibold">Workforce Ready Grant (WRG) and ETPL programs</span> to
            offset tuition where eligible.
          </li>
          <li>
            <span className="font-semibold">WEX and OJT</span> to support wages while individuals
            learn on your worksite.
          </li>
          <li>
            Apprenticeship models (where appropriate) that combine hours, wages and instruction.
          </li>
          <li>
            Employer sponsorship and payment plans via Stripe for non-grant pathways and
            microprograms.
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
        <p className="text-[11px] font-semibold text-slate-100">Next Steps</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[11px] text-slate-300">
          <li>Confirm which pathways are the highest priority for {employer.name}.</li>
          <li>Identify whether WEX, OJT, apprenticeship, or direct hire is the best fit.</li>
          <li>
            Work with Elevate to complete any required MOUs, WEX/OJT templates, and job
            descriptions.
          </li>
          <li>Schedule a small pilot cohort and agree on metrics for success.</li>
        </ol>
        <p className="mt-2 text-[11px] text-slate-300">
          Once finalized, this content can be moved into a branded PDF or proposal document for{' '}
          {employer.name}.
        </p>
      </section>
    </div>
  );
}
