import { FileCheck, TrendingUp, Handshake, GraduationCap } from 'lucide-react';

export default function GrantsSection() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Additional Workforce Grants &amp; Incentives
        </h2>
        <p className="text-slate-600 mb-10 max-w-3xl">
          OJT and WOTC are major employer incentives, but availability and reimbursement levels depend
          on the participant, employer, local workforce board, funding source, and approved contract.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <FileCheck className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">DOL Registered Apprenticeship</h3>
            <p className="text-sm text-slate-600 mb-3">
              Elevate is a DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301). When you
              host an apprentice, you participate in a structured training program. Elevate provides
              the Related Technical Instruction (RTI) and program administration; the employer provides
              supervised on-the-job learning at the approved worksite.
            </p>
            <p className="text-sm text-slate-600 mb-3">
              Registered Apprenticeship employers may qualify for incentives including:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 mb-3">
              <li>• <strong>Apprenticeship-related tax credits or grants</strong> where a current program and employer meet eligibility rules</li>
              <li>• <strong>OJT reimbursement</strong> when separately approved by the applicable workforce board or funding program</li>
              <li>• <strong>WOTC credits</strong> when the employee and employer satisfy federal eligibility requirements</li>
              <li>• <strong>Workforce and contracting advantages</strong> where participation is recognized by the relevant solicitation or program</li>
            </ul>
            <p className="text-sm text-slate-600">
              Elevate is the registered sponsor. Participating employers operate as approved training
              sites under the sponsor framework and applicable agreements. Eligibility for any funding
              or incentive is determined by the agency or program that administers it.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <TrendingUp className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Indiana Employer Training Grant (ETG)
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Already have employees who need upskilling? Indiana employer-training programs may
              provide support for qualifying incumbent-worker training in high-demand fields. Program
              rules, availability, eligible costs, and award levels are controlled by the administering agency.
            </p>
            <p className="text-sm text-slate-600 mb-3">Eligible training costs may include:</p>
            <ul className="text-sm text-slate-600 space-y-1 mb-3">
              <li>• Approved tuition and training fees</li>
              <li>• Eligible curriculum or company-specific training costs</li>
              <li>• Approved training materials or related costs</li>
            </ul>
            <p className="text-sm text-slate-600">
              Elevate can help identify an appropriate training pathway, but the funding agency makes
              the final eligibility and award determination.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Handshake className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">Federal Bonding Program</h3>
            <p className="text-sm text-slate-600 mb-3">
              The Federal Bonding Program can provide fidelity-bond coverage for eligible hires who
              face barriers to employment. Eligibility, coverage amount, term, and issuance are governed
              by the program administrator and applicable state process.
            </p>
            <p className="text-sm text-slate-600">
              Elevate can help employers and participants identify the appropriate referral path; the
              bond itself is not issued or guaranteed by Elevate.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <GraduationCap aria-label="graduationcap" className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Incumbent Worker Training (IWT)
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              WIOA can support qualifying incumbent-worker training where local workforce policy and
              employer circumstances meet program requirements. Employer cost sharing and covered
              training costs vary by the applicable workforce board and approved agreement.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Technology and process transitions</li>
              <li>• Regulatory and safety training</li>
              <li>• Skill upgrades designed to improve retention or advancement</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-8 text-white">
          <h3 className="text-xl font-bold mb-4">The Bottom Line for Employers</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-brand-orange-400 font-bold text-lg mb-1">Hiring?</div>
              <p className="text-slate-300">
                Ask the applicable workforce board whether the hire qualifies for an OJT agreement,
                WOTC, apprenticeship support, or another incentive before relying on reimbursement.
              </p>
            </div>
            <div>
              <div className="text-brand-orange-400 font-bold text-lg mb-1">
                Training existing staff?
              </div>
              <p className="text-slate-300">
                Employer-training or incumbent-worker funding may offset approved training costs when
                eligibility and funding are confirmed in advance.
              </p>
            </div>
            <div>
              <div className="text-brand-orange-400 font-bold text-lg mb-1">
                Hiring from reentry?
              </div>
              <p className="text-slate-300">
                Federal Bonding, WOTC, OJT, and other supports may be available, but each program has
                separate eligibility and approval requirements. Elevate does not guarantee an award.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
