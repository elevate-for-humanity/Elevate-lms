import { Shield, CheckCircle, Receipt } from 'lucide-react';

export default function WOTCSection() {
  return (
    <section id="wotc" className="py-16 bg-slate-50 border-y border-slate-200 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Intro */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue-100 text-brand-blue-800 rounded-full text-xs font-bold mb-4">
            <Shield className="w-3.5 h-3.5" /> FEDERAL TAX CREDIT
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Work Opportunity Tax Credit (WOTC): A Tax Credit for Every Qualifying Hire
          </h2>
          <p className="text-lg text-slate-600">
            Most employers have never heard of WOTC. The ones who have are saving thousands
            per hire. This is not a deduction — it is a dollar-for-dollar credit that directly
            reduces your federal tax bill.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-12">
          {/* Explanation */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">How WOTC Works</h3>
            <p className="text-slate-600 mb-4">
              When you hire someone from a &quot;targeted group&quot; — veterans, ex-felons, SNAP recipients,
              long-term unemployed, and others — the IRS gives you a tax credit based on the wages
              you pay them in the first year. The credit ranges from <strong>$2,400 to $9,600 per
              employee</strong> depending on the category.
            </p>
            <p className="text-slate-600 mb-4">
              Here is what makes WOTC different from a deduction: if you owe $50,000 in federal
              taxes and you have $9,600 in WOTC credits, you now owe <strong>$40,400</strong>.
              That is real money off your tax bill, not a reduction in taxable income.
            </p>
            <p className="text-slate-600 mb-4">
              The credit is calculated as <strong>40% of the first $6,000 in wages</strong> for most
              categories (= $2,400). For certain veterans and long-term TANF recipients, the
              qualifying wage base is higher, pushing the credit up to $9,600.
            </p>
            <p className="text-slate-600">
              There is one catch: you must file <strong>IRS Form 8850</strong> within 28 days of the
              hire date. Miss that window and you lose the credit for that employee. Elevate
              pre-screens candidates for WOTC eligibility and helps you file on time.
            </p>

            <div className="mt-6 space-y-3">
              <h4 className="font-bold text-slate-900">What Elevate does for you:</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  Identifies which candidates qualify before you interview them
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  Provides WOTC pre-screening documentation with each referral
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  Assists with Form 8850 filing to meet the 28-day deadline
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  Coordinates with your tax preparer or CPA on credit documentation
                </li>
              </ul>
            </div>
          </div>

          {/* Credit Table */}
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                <Receipt className="w-5 h-5 inline-block mr-2 text-brand-blue-600" />
                WOTC Credit Amounts
              </h3>
              <div className="space-y-3">
                {[
                  { category: 'Veterans with service-connected disability (unemployed 6+ months)', credit: '$9,600', highlight: true },
                  { category: 'Long-term TANF recipients (18+ months)', credit: '$9,000', highlight: true },
                  { category: 'Veterans (unemployed 4+ weeks)', credit: '$2,400', highlight: false },
                  { category: 'Ex-felons (hired within 1 year of conviction/release)', credit: '$2,400', highlight: false },
                  { category: 'SNAP recipients (ages 18-39)', credit: '$2,400', highlight: false },
                  { category: 'SSI recipients', credit: '$2,400', highlight: false },
                  { category: 'Long-term unemployed (27+ weeks)', credit: '$2,400', highlight: false },
                  { category: 'Designated community residents', credit: '$2,400', highlight: false },
                  { category: 'Vocational rehabilitation referrals', credit: '$2,400', highlight: false },
                  { category: 'Summer youth employees (16-17, Empowerment Zone)', credit: '$1,200', highlight: false },
                ].map((item) => (
                  <div
                    key={item.category}
                    className={`flex justify-between items-start gap-4 text-sm border-b border-slate-100 pb-2 last:border-0 ${
                      item.highlight ? 'bg-brand-green-50 -mx-2 px-2 py-1 rounded' : ''
                    }`}
                  >
                    <span className="text-slate-600">{item.category}</span>
                    <span className={`font-bold whitespace-nowrap ${item.highlight ? 'text-brand-green-700 text-base' : 'text-brand-green-700'}`}>
                      {item.credit}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Credits are per qualifying employee, per year. No cap on number of WOTC hires.
                Employee must work at least 120 hours to qualify (400 hours for full credit).
              </p>
            </div>

            {/* Stacking callout */}
            <div className="bg-brand-blue-700 text-white rounded-xl p-6">
              <h4 className="font-bold text-lg mb-2">WOTC + OJT = Maximum Savings</h4>
              <p className="text-brand-blue-100 text-sm mb-3">
                These two programs can be used on the <strong>same hire</strong>. That means you get
                wage reimbursement from OJT <em>and</em> a federal tax credit from WOTC on the same
                employee.
              </p>
              <div className="bg-white/10 rounded-lg p-4 text-sm">
                <div className="font-semibold mb-2">Example: Hiring a veteran CNA graduate</div>
                <div className="space-y-1 text-brand-blue-100">
                  <div className="flex justify-between">
                    <span>OJT reimbursement (75% of wages, 3 months)</span>
                    <span className="font-bold text-white">$6,480</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WOTC tax credit (veteran, service-connected)</span>
                    <span className="font-bold text-white">$9,600</span>
                  </div>
                  <div className="border-t border-white/20 pt-1 mt-1 flex justify-between">
                    <span className="font-bold text-white">Total employer benefit</span>
                    <span className="font-bold text-brand-orange-300 text-lg">$16,080</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-brand-blue-200 mt-3 italic">
                Consult your tax advisor for specifics on combining WOTC and OJT for the same employee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
