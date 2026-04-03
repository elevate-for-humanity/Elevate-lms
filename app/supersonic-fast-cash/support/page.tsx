import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata: Metadata = {
  title: 'Support | Supersonic Fast Cash',
  description: 'Get help with tax preparation, filing questions, and refund status. Contact our support team.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/supersonic-fast-cash/support' },
};

const FAQS = [
  {
    category: 'Tax Preparation',
    image: '/images/pages/supersonic-tax-prep.jpg',
    questions: [
      { q: 'What documents do I need to file?', a: "You'll need W-2s from all employers, 1099 forms for other income, Social Security numbers for yourself and all dependents, last year's return if available, and bank account information for direct deposit. If you're self-employed, bring your income and expense records." },
      { q: 'How long does filing take?', a: 'Most returns take 15–45 minutes depending on complexity. Simple W-2 returns are faster. Self-employment, rental income, or investment income takes longer. Our preparers work efficiently and will let you know upfront if your return is more complex.' },
      { q: 'When will I get my refund?', a: 'The IRS typically processes e-filed returns in 10–21 days. Direct deposit is faster than a paper check. You can track your refund status at IRS.gov after filing. If you qualify for a refund advance, you can receive funds the same day your return is accepted.' },
    ],
  },
  {
    category: 'Refund Advance',
    image: '/images/pages/supersonic-page-2.jpg',
    questions: [
      { q: 'Is the refund advance required?', a: 'No. The advance is completely optional. You can file your taxes and wait for your standard IRS refund without taking an advance. There is no pressure to use this product.' },
      { q: 'Is this a loan?', a: 'The advance is a financial product offered by a lending partner. It is based on your expected tax refund and is repaid automatically when your IRS refund arrives. You do not make separate monthly payments.' },
      { q: 'How much can I get?', a: 'Advance amounts range from $500 to $7,500 depending on your expected refund and eligibility. The lending partner determines the final amount. Approval is not guaranteed and is subject to eligibility requirements.' },
      { q: 'What if my refund is less than expected?', a: 'If the IRS adjusts your refund downward, you may owe the difference between the advance amount and the actual refund. Advance amounts are typically set below your full expected refund to account for this possibility.' },
    ],
  },
  {
    category: 'Account & Security',
    image: '/images/pages/supersonic-page-4.jpg',
    questions: [
      { q: 'Is my information secure?', a: 'Yes. We use encryption to protect your personal and financial information during transmission and storage. Your data is never sold to third parties. We comply with IRS data security requirements for authorized e-file providers.' },
      { q: 'Can I access my return after filing?', a: 'Yes. You can download a copy of your filed return from your account at any time. We recommend saving a copy for your records. Returns are available for at least three years after filing.' },
    ],
  },
];

const QUICK_LINKS = [
  { label: 'How Tax Filing Works', href: '/supersonic-fast-cash/how-it-works', image: '/images/pages/supersonic-page-6.jpg' },
  { label: 'Pricing', href: '/supersonic-fast-cash/pricing', image: '/images/pages/finance-accounting.jpg' },
  { label: 'About Refund Advances', href: '/supersonic-fast-cash/services/refund-advance', image: '/images/pages/supersonic-page-3.jpg' },
  { label: 'Book Appointment', href: '/supersonic-fast-cash/book-appointment', image: '/images/pages/supersonic-page-7.jpg' },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <SupersonicPageHero
        image="/images/pages/supersonic-page-8.jpg"
        alt="Supersonic Fast Cash support center"
        title="Support Center"
        subtitle="Find answers to common questions or contact our team directly."
      />

      {/* CONTACT OPTIONS — image cards, no icons */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Phone', value: '(317) 314-3757', href: 'tel:+13173143757', image: '/images/pages/contact-page-1.jpg', desc: 'Mon–Fri 9am–8pm, Sat 9am–5pm, Sun 12pm–5pm' },
              { label: 'Email', value: 'support@supersonicfastcash.com', href: 'mailto:support@supersonicfastcash.com', image: '/images/pages/admin-email-hero.jpg', desc: 'Response within 1 business day' },
              { label: 'In Person', value: '8888 Keystone Crossing, Suite 1300', href: '/supersonic-fast-cash/locations', image: '/images/pages/locations-page-1.jpg', desc: 'Indianapolis, IN 46240' },
            ].map((item) => (
              <a key={item.label} href={item.href} className="group rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="relative h-44 w-full">
                  <Image src={item.image} alt={item.label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5 flex-1 bg-white">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
                  <p className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors mb-1">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs — image per category, no icons */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-16">
            {FAQS.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center gap-5 mb-8">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={cat.image} alt={cat.category} fill className="object-cover" sizes="64px" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{cat.category}</h3>
                </div>
                <div className="space-y-4">
                  {cat.questions.map((faq) => (
                    <div key={faq.q} className="bg-white rounded-xl p-6 border border-slate-200">
                      <p className="font-bold text-slate-900 mb-2">{faq.q}</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK LINKS — image cards */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {QUICK_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="group rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-300">
                <div className="relative h-32">
                  <Image src={link.image} alt={link.label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="p-3 bg-white">
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-brand-red-600 transition-colors">{link.label} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative w-full">
        <div className="relative h-[40vh] min-h-[260px] overflow-hidden">
          <Image src="/images/pages/supersonic-page-9.jpg" alt="Start your tax return" fill className="object-cover object-center" sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-12 text-center px-4">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to File?</h2>
          <Link href="/supersonic-fast-cash/start" className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">
            Start Tax Preparation
          </Link>
        </div>
      </section>
    </div>
  );
}
