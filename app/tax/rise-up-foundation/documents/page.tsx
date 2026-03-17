import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import VITAPageHero from '@/components/supersonic/VITAPageHero';

export const metadata: Metadata = {
  title: 'Required Documents | Rise Up Foundation VITA',
  description: 'What to bring to your free VITA tax preparation appointment. Complete document checklist for individuals, families, and self-employed filers.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation/documents' },
};

const DOCS = [
  { label: 'Valid Photo ID', desc: 'Driver\'s license, state ID, or passport for the primary filer and spouse if filing jointly.', image: '/images/pages/admin-documents-hero.jpg' },
  { label: 'Social Security Cards', desc: 'Original Social Security cards or ITIN letters for yourself, your spouse, and all dependents listed on the return.', image: '/images/pages/supersonic-page-6.jpg' },
  { label: 'W-2 Forms', desc: 'W-2 from every employer you worked for during the tax year. If you have multiple jobs, bring all W-2s.', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { label: '1099 Forms', desc: 'Any 1099-NEC, 1099-MISC, 1099-INT, 1099-DIV, 1099-R, SSA-1099, or 1099-G forms you received.', image: '/images/pages/finance-accounting.jpg' },
  { label: 'Last Year\'s Return', desc: 'A copy of your prior year federal and state tax return, if available. Helps verify identity and carry-forward amounts.', image: '/images/pages/admin-tax-filing-hero.jpg' },
  { label: 'Bank Account Information', desc: 'Routing number and account number for direct deposit of your refund. Direct deposit is faster and more secure than a paper check.', image: '/images/pages/supersonic-page-2.jpg' },
  { label: 'Health Insurance Forms', desc: '1095-A if you purchased coverage through the Marketplace. 1095-B or 1095-C if provided by your employer or insurer.', image: '/images/pages/admin-compliance-hero.jpg' },
  { label: 'Childcare Records', desc: 'Name, address, and Tax ID number of your childcare provider if you paid for childcare and want to claim the Child and Dependent Care Credit.', image: '/images/pages/supersonic-page-7.jpg' },
];

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-white">
      <VITAPageHero
        image="/images/pages/admin-documents-upload-hero.jpg"
        alt="Required documents for VITA free tax preparation"
        title="What to Bring to Your Appointment"
        subtitle="Having the right documents ready ensures your return is complete and accurate the first time."
      />

      {/* DOCUMENT CARDS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Required Documents</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Bring all applicable documents to your VITA appointment. Missing documents may delay your filing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DOCS.map((doc) => (
              <div key={doc.label} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44 w-full flex-shrink-0">
                  <Image src={doc.image} alt={doc.label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="p-5 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 mb-2">{doc.label}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{doc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELF-EMPLOYED SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image src="/images/pages/supersonic-tax-prep.jpg" alt="Self-employed tax documents" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">If You Are Self-Employed</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Self-employed individuals and gig workers need additional records. VITA can prepare Schedule C returns for qualifying filers with straightforward self-employment income.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Income Records', desc: 'All 1099-NEC forms, payment app records (Venmo, Cash App, PayPal), and any other income documentation.', image: '/images/pages/admin-tax-reports-hero.jpg' },
                  { label: 'Business Expense Records', desc: 'Receipts or records for deductible business expenses — mileage log, supplies, home office, phone, etc.', image: '/images/pages/finance-accounting.jpg' },
                  { label: 'Estimated Tax Payments', desc: 'Records of any quarterly estimated tax payments made to the IRS or state during the year.', image: '/images/pages/admin-tax-filing-hero.jpg' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 items-start">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.label} fill className="object-cover" sizes="56px" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm mb-1">{item.label}</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/subpage-tax-hero.jpg" alt="Book your free VITA appointment" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-emerald-900/75 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to File for Free?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tax/rise-up-foundation/site-locator" className="px-10 py-4 bg-white text-emerald-900 font-black text-xl rounded-xl hover:bg-emerald-50 transition-colors">Find a Site</Link>
              <Link href="/tax/rise-up-foundation/faq" className="px-10 py-4 bg-emerald-700 text-white font-black text-xl rounded-xl hover:bg-emerald-600 transition-colors">Check Eligibility</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
