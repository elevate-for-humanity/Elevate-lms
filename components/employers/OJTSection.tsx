import { DollarSign, BadgeDollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

export default function OJTSection() {
  return (
    <section id="ojt" className="py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Intro */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green-100 text-brand-green-800 rounded-full text-xs font-bold mb-4">
            <DollarSign className="w-3.5 h-3.5" /> WORKFORCE FUNDING
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            On-the-Job Training (OJT): Get Paid to Train Your New Hires
          </h2>
          <p className="text-lg text-slate-600">
            Every employer trains new hires. The difference is whether you pay for it yourself
            or let the government reimburse you. OJT is a federal program that pays you back
            for doing what you already do — training people to work at your business.
          </p>
        </div>

        {/* What OJT Actually Is */}
        <div className="grid md:grid-cols-2 gap-10 mb-16">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">What OJT Actually Is</h3>
            <p className="text-slate-600 mb-4">
              On-the-Job Training is a program under the <strong>Workforce Innovation and Opportunity
              Act (WIOA)</strong> that reimburses employers for the cost of training a new employee.
              The logic is simple: when you hire someone who needs skills development, the government
              recognizes that your time and resources have value. OJT compensates you for that
              investment.
            </p>
            <p className="text-slate-600 mb-4">
              You are not hiring a &quot;trainee&quot; or an intern. You are hiring a <strong>real employee
              at a real wage</strong>. They are on your payroll from day one. They show up, they work,
              they learn your systems. The only difference is that WorkOne sends you a check for
              up to 75% of their wages during the training period.
            </p>
            <p className="text-slate-600">
              The training period is typically <strong>3 to 6 months</strong>, depending on the
              complexity of the role. A CNA position might have a 12-week OJT period. An HVAC
              technician might have 6 months. The duration is negotiated upfront in the OJT contract
              based on what the job actually requires.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Why It Exists</h3>
            <p className="text-slate-600 mb-4">
              The federal government spends billions on workforce development every year. The problem
              they are trying to solve: people who want to work but lack the specific skills employers
              need. OJT bridges that gap by making it financially painless for you to take a chance
              on someone who is trained but not yet experienced in your exact environment.
            </p>
            <p className="text-slate-600 mb-4">
              This is not charity. This is an economic development tool. The government gets a
              taxpayer off unemployment. You get a trained employee at a fraction of the cost.
              The employee gets a career. Everyone wins.
            </p>
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4 mt-6">
              <h4 className="font-bold text-brand-green-900 text-sm mb-2">Who qualifies as an OJT candidate?</h4>
              <ul className="text-sm text-brand-green-800 space-y-1">
                <li>• WIOA-eligible job seekers (unemployed, underemployed, low-income)</li>
                <li>• Veterans transitioning to civilian careers</li>
                <li>• Justice-involved individuals reentering the workforce</li>
                <li>• Workers displaced by layoffs or industry changes</li>
                <li>• Young adults (18-24) with barriers to employment</li>
              </ul>
              <p className="text-xs text-brand-green-700 mt-2 italic">
                Elevate pre-screens all candidates for WIOA eligibility before referring them to you.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works — Detailed Steps */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 md:p-10 mb-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">How OJT Works — Step by Step</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                step: '1',
                title: 'You tell us what you need',
                desc: 'Job title, skills required, wage range, start date. We match candidates from our training pipeline who already have foundational skills and credentials for your industry.',
              },
              {
                step: '2',
                title: 'You interview and hire',
                desc: 'You choose who to hire — this is your decision, not ours. The candidate becomes your employee on your payroll at the agreed wage. No temp agency, no middleman.',
              },
              {
                step: '3',
                title: 'We set up the OJT contract',
                desc: 'Elevate coordinates with your local WorkOne career center to create the OJT contract. This document specifies the training plan, duration, wage, and reimbursement rate. We handle the paperwork.',
              },
              {
                step: '4',
                title: 'You train, we track',
                desc: 'The employee works at your business and learns your specific processes. You provide supervision and mentorship. Elevate tracks training milestones and submits progress reports to WorkOne.',
              },
              {
                step: '5',
                title: 'You get reimbursed',
                desc: 'WorkOne reimburses you up to 75% of the employee\'s wages for the entire training period. Payments are made directly to your business, typically monthly or at contract milestones.',
              },
              {
                step: '6',
                title: 'You keep a trained employee',
                desc: 'After the OJT period ends, you have a fully trained employee who knows your business, your customers, and your standards. No more reimbursement — but no more training cost either.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="w-8 h-8 bg-brand-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reimbursement Calculator */}
        <div className="grid md:grid-cols-2 gap-10 mb-16">
          <div className="bg-brand-green-50 rounded-xl border border-brand-green-200 p-6">
            <h3 className="text-lg font-bold text-brand-green-900 mb-4">
              <BadgeDollarSign className="w-5 h-5 inline-block mr-2" />
              Example: Hiring an HVAC Technician
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-white rounded-lg p-4 border border-brand-green-100">
                <div className="text-slate-500 text-xs mb-1">Starting wage</div>
                <div className="text-lg font-bold text-slate-900">$20/hour</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-brand-green-100">
                <div className="text-slate-500 text-xs mb-1">OJT training period</div>
                <div className="text-lg font-bold text-slate-900">960 hours (6 months)</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-brand-green-100">
                <div className="text-slate-500 text-xs mb-1">Total wages you pay during training</div>
                <div className="text-lg font-bold text-slate-900">$19,200</div>
              </div>
              <div className="bg-brand-green-600 text-white rounded-lg p-4">
                <div className="text-white text-xs mb-1">OJT reimbursement (75%)</div>
                <div className="text-3xl font-bold">$14,400</div>
                <div className="text-white text-xs mt-1">Your actual training cost: $4,800</div>
              </div>
            </div>
          </div>
          <div className="bg-brand-green-50 rounded-xl border border-brand-green-200 p-6">
            <h3 className="text-lg font-bold text-brand-green-900 mb-4">
              <BadgeDollarSign className="w-5 h-5 inline-block mr-2" />
              Example: Hiring a Barber Apprentice
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-white rounded-lg p-4 border border-brand-green-100">
                <div className="text-slate-500 text-xs mb-1">Starting wage</div>
                <div className="text-lg font-bold text-slate-900">$15/hour</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-brand-green-100">
                <div className="text-slate-500 text-xs mb-1">OJT training period</div>
                <div className="text-lg font-bold text-slate-900">480 hours (3 months)</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-brand-green-100">
                <div className="text-slate-500 text-xs mb-1">Total wages you pay during training</div>
                <div className="text-lg font-bold text-slate-900">$7,200</div>
              </div>
              <div className="bg-brand-green-600 text-white rounded-lg p-4">
                <div className="text-white text-xs mb-1">OJT reimbursement (75%)</div>
                <div className="text-3xl font-bold">$5,400</div>
                <div className="text-white text-xs mt-1">Your actual training cost: $1,800</div>
              </div>
            </div>
          </div>
        </div>

        {/* What OJT Is NOT */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> What OJT Is NOT
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-amber-800 mb-3">
                <strong>It is not an internship.</strong> The person is your employee. They are on your
                payroll, covered by your insurance, and subject to your policies. This is a real job.
              </p>
              <p className="text-amber-800 mb-3">
                <strong>It is not a temp placement.</strong> There is no staffing agency. You hire
                directly. If it does not work out, you handle it like any other employment situation.
              </p>
              <p className="text-amber-800">
                <strong>It is not free labor.</strong> You pay the employee their full wage. The
                government reimburses you afterward. You carry the payroll cost upfront and get
                reimbursed on a schedule.
              </p>
            </div>
            <div>
              <p className="text-amber-800 mb-3">
                <strong>It is not complicated.</strong> Elevate handles the contract setup, progress
                tracking, and reporting. Your job is to train the employee and submit timesheets.
              </p>
              <p className="text-amber-800 mb-3">
                <strong>It is not limited to large companies.</strong> Small businesses, barbershops,
                medical offices, HVAC companies, trucking firms — any employer can participate.
                In fact, small employers often get the highest reimbursement rates (75%).
              </p>
              <p className="text-amber-800">
                <strong>It is not a one-time thing.</strong> You can use OJT for every qualifying
                hire. There is no cap on the number of OJT contracts per employer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
