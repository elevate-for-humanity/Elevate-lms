import { ShieldCheck } from 'lucide-react';

const handbookSections = [
  {
    title: 'How the registered apprenticeship works',
    text: 'The registered apprenticeship combines supervised on-the-job learning (OJL) at the host shop with Related Technical Instruction (RTI) coordinated by Elevate. This differs from a traditional classroom-based cosmetology school model. Follow the assigned occupation standard, individual training plan, required hours and assessments, and applicable state licensing requirements. Read the registered program and RAPIDS details in your Programs page after approval.',
  },
  {
    title: 'Supervision and safety',
    text: 'Maintain the supervision ratio required by the active registered standard. Provide a safe, lawful workplace and never approve training that was not directly observed or supported by reliable records.',
  },
  {
    title: 'Time, attendance, and geofencing',
    text: 'Apprentices must use the approved time and attendance workflow. Do not falsify, share, bypass, or alter location, clock, attendance, or work records. Return inaccurate entries for correction.',
  },
  {
    title: 'Wages and payroll evidence',
    text: 'Apprentices are paid workers. Follow the applicable registered wage schedule and any higher wage required by law. Keep payroll evidence current and do not treat estimated or unpaid time as verified OJL.',
  },
  {
    title: 'What your Host Shop must do every day',
    text: 'Provide a qualified licensed supervisor and safe, hands-on instruction. Have each apprentice clock in at the approved shop, clock out when leaving or taking unpaid meal breaks, and clock back in on return. Review actual OJL work and report geofence errors for documented correction. Pay apprentices under their approved wage schedule and applicable wage laws.',
  },
  {
    title: 'What your Host Shop must do every week and month',
    text: 'Weekly: review and verify actual workplace hours, record cuts, styles, colors or other supervised services in Practical Service Log, check attendance and payroll, and notify Elevate of problems. Monthly: review each apprentice’s progress, training coverage, mentor assignment, wage progression and upcoming practical assessments. Preserve records and never invent training or service counts.',
  },
  {
    title: 'RTI is handled by Elevate — not the Host Shop',
    text: 'Elevate coordinates and delivers Related Technical Instruction (theory), assignments, assessments and verified RTI hours. Host Shops do not create theory lessons, award RTI hours, or sign off on official Appendix A completion. Continue eligible supervised hands-on training while Elevate rolls out RTI; allow apprentices to attend required instruction and follow any required prerequisite safety training.',
  },
  {
    title: 'New and continuing apprentices',
    text: 'Existing apprentices continue from verified progress; do not restart hours. New apprentices must have authorized placement, required supervision and employment arrangements before hands-on training. Follow the approved individual schedule, shop licensing rules and sponsor instructions. Report departures, mentor changes, safety incidents, missed hours and wage problems promptly.',
  },
  {
    title: 'RTI and competency progress',
    text: 'Related technical instruction is separate from work hours. Verify competencies against the active occupation standard; a percentage of hours alone does not prove competency.',
  },
  {
    title: 'Funding and truthful reporting',
    text: 'Workforce reimbursement requires authorization before it is treated as funded. Never bill the same allowable cost to more than one funding source, and report corrections promptly.',
  },
  {
    title: 'Privacy and records',
    text: 'Use learner information only for authorized training operations. Keep the MOU, licenses, insurance, supervisor records, payroll evidence, attendance, OJL, RTI, and corrective records current in the portal.',
  },
] as const;

export function HostShopHandbook() {
  return (
    <section
      id="handbook"
      className="mt-8 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-emerald-700" />
        <div>
          <h2 className="text-2xl font-black text-slate-950">Host Shop operating handbook</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
            The MOU and active registered-program standard control if any summary below conflicts
            with a signed or governing requirement.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {handbookSections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <h3 className="font-black text-slate-950">{section.title}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{section.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
