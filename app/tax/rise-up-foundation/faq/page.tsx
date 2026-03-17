import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import VITAPageHero from '@/components/supersonic/VITAPageHero';

export const metadata: Metadata = {
  title: 'FAQ | Rise Up Foundation VITA Free Tax Preparation',
  description: 'Answers to common questions about free VITA tax preparation — eligibility, what we can prepare, what to bring, and how to get started.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation/faq' },
};

const FAQS = [
  { q: 'Who qualifies for free VITA tax preparation?', a: 'Most individuals and families with household income at or below $67,000 qualify. There is no minimum income requirement. Seniors, people with disabilities, and limited-English-speaking taxpayers are also specifically served by VITA.', image: '/images/pages/subpage-tax-hero.jpg' },
  { q: 'What types of returns can VITA prepare?', a: 'VITA volunteers can prepare most individual federal and state returns including W-2 income, Social Security income, pension income, interest and dividends, unemployment compensation, and basic self-employment income (Schedule C without losses). Complex returns with rental income, farm income, or significant investment activity may not be eligible.', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { q: 'Is there really no cost?', a: 'Correct. VITA services are completely free to qualifying taxpayers. There are no preparation fees, no e-file fees, and no charges for state returns. No products are sold at VITA sites. The program is funded by IRS grants and community partnerships.', image: '/images/pages/finance-accounting.jpg' },
  { q: 'How long does a VITA appointment take?', a: 'Most appointments take 45–90 minutes depending on the complexity of your return and how complete your documents are. Having all required documents ready before your appointment significantly reduces wait time.', image: '/images/pages/supersonic-page-7.jpg' },
  { q: 'Are VITA volunteers qualified to prepare my taxes?', a: 'Yes. All VITA volunteers are certified by the IRS through the Link & Learn program before preparing any returns. Every return is quality-reviewed by a second certified volunteer before filing. Volunteers are trained on current tax law each year.', image: '/images/pages/admin-tax-training-hero.jpg' },
  { q: 'Can I get a refund advance through VITA?', a: 'VITA sites do not offer refund advance products. If you need a same-day refund advance, you would need to use Supersonic Fast Cash paid tax preparation services, which are separate from VITA. VITA prepares your return and e-files it — your refund arrives from the IRS in 10–21 days.', image: '/images/pages/supersonic-page-2.jpg' },
  { q: 'What if I owe taxes?', a: 'VITA can still prepare your return even if you owe. Our volunteers will explain your payment options, including IRS payment plans. There is no charge for this service regardless of whether you receive a refund or owe a balance.', image: '/images/pages/admin-tax-filing-hero.jpg' },
  { q: 'Can VITA help with prior year returns?', a: 'In some cases, yes. VITA sites may be able to prepare prior year returns for qualifying taxpayers. Contact your local site to ask about availability. Filing prior year returns can help you claim refunds you may have missed.', image: '/images/pages/admin-tax-reports-hero.jpg' },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <VITAPageHero
        image="/images/pages/admin-tax-apps-hero.jpg"
        alt="VITA free tax preparation FAQ"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about free VITA tax preparation through Rise Up Foundation."
      />

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid gap-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row">
                <div className="relative h-40 md:h-auto md:w-48 flex-shrink-0">
                  <Image src={faq.image} alt={faq.q} fill className="object-cover" sizes="(max-width: 768px) 100vw, 192px" />
                </div>
                <div className="p-6 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 mb-3 text-lg">{faq.q}</h3>
                  <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/subpage-tax-hero.jpg" alt="Get free tax help" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-emerald-900/75 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Still Have Questions?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tax/rise-up-foundation/free-tax-help" className="px-10 py-4 bg-white text-emerald-900 font-black text-xl rounded-xl hover:bg-emerald-50 transition-colors">Get Free Help</Link>
              <Link href="/tax/rise-up-foundation/site-locator" className="px-10 py-4 bg-emerald-700 text-white font-black text-xl rounded-xl hover:bg-emerald-600 transition-colors">Find a Site</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
