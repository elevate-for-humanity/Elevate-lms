import { FileCheck, TrendingUp, Handshake, Scale, GraduationCap } from 'lucide-react';

export default function GrantsSection() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Additional Workforce Grants &amp; Incentives
        </h2>
        <p className="text-slate-600 mb-10 max-w-3xl">
          OJT and WOTC are the two biggest programs, but they are not the only ones. Depending
          on your industry, location, and who you hire, you may qualify for additional funding.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Registered Apprenticeship */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <FileCheck className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">DOL Registered Apprenticeship</h3>
            <p className="text-sm text-slate-600 mb-3">
              Elevate is a DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301). When you
              host an apprentice, you get a structured training program without building one yourself.
              Elevate provides the Related Technical Instruction (RTI) online. You provide the
              on-the-job training at your worksite.
            </p>
            <p className="text-sm text-slate-600 mb-3">
              Registered Apprenticeship employers may qualify for:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 mb-3">
              <li>• <strong>State apprenticeship tax credits</strong> (varies by state — Indiana offers credits for certain programs)</li>
              <li>• <strong>OJT reimbursement</strong> during the apprenticeship period</li>
              <li>• <strong>WOTC credits</strong> if the apprentice qualifies under a targeted group</li>
              <li>• <strong>Federal contractor preference</strong> — apprenticeship participation can strengthen government contract bids</li>
            </ul>
            <p className="text-sm text-slate-600">
              You do not need to register as a sponsor. Elevate is the sponsor. You are the
              employer training site. We handle RAPIDS reporting, competency tracking, and compliance.
            </p>
          </div>

          {/* ETG */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <TrendingUp className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">Indiana Employer Training Grant (ETG)</h3>
            <p className="text-sm text-slate-600 mb-3">
              Already have employees who need upskilling? Indiana&apos;s ETG program provides grants
              to employers for training <strong>current workers</strong> in high-demand fields.
              This is different from OJT — ETG is for your existing team, not new hires.
            </p>
            <p className="text-sm text-slate-600 mb-3">
              ETG can cover:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 mb-3">
              <li>• Tuition and training fees for industry certifications</li>
              <li>• Curriculum development for company-specific training</li>
              <li>• Training materials and equipment</li>
            </ul>
            <p className="text-sm text-slate-600">
              Administered through Indiana DWD. Elevate can help you identify eligible training
              programs and assist with the application process.
            </p>
          </div>

          {/* Federal Bonding */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Handshake className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">Federal Bonding Program</h3>
            <p className="text-sm text-slate-600 mb-3">
              Worried about hiring someone with a criminal record? The Federal Bonding Program
              provides <strong>free fidelity bonds</strong> that protect your business against
              employee theft or dishonesty for the first 6 months of employment.
            </p>
            <p className="text-sm text-slate-600 mb-3">
              This is not insurance you pay for. It is a free bond issued by the U.S. Department
              of Labor. It covers the employee for up to $25,000 with zero cost to you. After
              6 months, if the employee has performed well, you can purchase a standard commercial
              bond at regular rates.
            </p>
            <p className="text-sm text-slate-600">
              Many of our JRI (Job Ready Indy) graduates qualify. This removes
              the financial risk of hiring from reentry populations while giving people a real
              second chance.
            </p>
          </div>

          {/* Incumbent Worker Training */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <GraduationCap className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">Incumbent Worker Training (IWT)</h3>
            <p className="text-sm text-slate-600 mb-3">
              WIOA also funds training for workers who are <strong>already employed but need new
              skills</strong> to avoid layoff or advance in their careers. If your industry is
              changing and your team needs to adapt, IWT can help cover the cost.
            </p>
            <p className="text-sm text-slate-600 mb-3">
              IWT requires an employer match (typically 10-50% depending on company size), but
              the majority of training costs are covered by WIOA funds. This is particularly
              useful for:
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Technology transitions (new software, automation, digital tools)</li>
              <li>• Regulatory compliance training (OSHA, EPA, healthcare standards)</li>
              <li>• Skill upgrades that prevent layoffs</li>
            </ul>
          </div>
        </div>

        {/* Summary callout */}
        <div className="bg-slate-900 rounded-xl p-8 text-white">
          <h3 className="text-xl font-bold mb-4">The Bottom Line for Employers</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-brand-orange-400 font-bold text-lg mb-1">Hiring?</div>
              <p className="text-slate-300">
                Use OJT for wage reimbursement + WOTC for tax credits. Stack both on the same hire.
                Elevate provides pre-trained, pre-screened candidates at zero recruiting cost.
              </p>
            </div>
            <div>
              <div className="text-brand-orange-400 font-bold text-lg mb-1">Training existing staff?</div>
              <p className="text-slate-300">
                Use ETG or IWT to offset upskilling costs. Elevate can help identify eligible
                programs and assist with applications.
              </p>
            </div>
            <div>
              <div className="text-brand-orange-400 font-bold text-lg mb-1">Hiring from reentry?</div>
              <p className="text-slate-300">
                Use Federal Bonding (free) + WOTC ($2,400 credit) + OJT (75% wage reimbursement).
                Triple-stack on a single justice-involved hire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
