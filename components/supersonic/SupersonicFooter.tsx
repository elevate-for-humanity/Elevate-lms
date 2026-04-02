import Image from 'next/image';
import Link from 'next/link';

const LINKS = [
  {
    heading: 'Tax Services',
    items: [
      { label: 'Tax Preparation', href: '/supersonic-fast-cash/services/tax-preparation' },
      { label: 'Refund Advance', href: '/supersonic-fast-cash/services/refund-advance' },
      { label: 'DIY Tax Filing', href: '/supersonic-fast-cash/diy-taxes' },
      { label: 'Audit Protection', href: '/supersonic-fast-cash/services/audit-protection' },
      { label: 'Bookkeeping', href: '/supersonic-fast-cash/services/bookkeeping' },
      { label: 'Payroll', href: '/supersonic-fast-cash/services/payroll' },
    ],
  },
  {
    heading: 'Free VITA Help',
    items: [
      { label: 'Free Tax Preparation', href: '/tax/rise-up-foundation/free-tax-help' },
      { label: 'Find a VITA Site', href: '/tax/rise-up-foundation/site-locator' },
      { label: 'Eligibility & FAQ', href: '/tax/rise-up-foundation/faq' },
      { label: 'Required Documents', href: '/tax/rise-up-foundation/documents' },
      { label: 'Volunteer', href: '/tax/rise-up-foundation/volunteer' },
    ],
  },
  {
    heading: 'Service Areas',
    items: [
      { label: 'Indiana', href: '/supersonic-fast-cash/tax-preparation-indiana' },
      { label: 'Illinois', href: '/supersonic-fast-cash/tax-preparation-illinois' },
      { label: 'Ohio', href: '/supersonic-fast-cash/tax-preparation-ohio' },
      { label: 'Tennessee', href: '/supersonic-fast-cash/tax-preparation-tennessee' },
      { label: 'Texas', href: '/supersonic-fast-cash/tax-preparation-texas' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About', href: '/supersonic-fast-cash/about' },
      { label: 'Careers', href: '/supersonic-fast-cash/careers' },
      { label: 'Training Program', href: '/supersonic-fast-cash/training' },
      { label: 'Locations', href: '/supersonic-fast-cash/locations' },
      { label: 'Contact', href: '/supersonic-fast-cash/contact' },
      { label: 'Support', href: '/supersonic-fast-cash/support' },
    ],
  },
];

export default function SupersonicFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Logo + tagline */}
        <div className="flex flex-col md:flex-row gap-12 mb-12">
          <div className="md:w-64 flex-shrink-0">
            <div className="relative w-48 h-16 mb-4 rounded-xl overflow-hidden">
              <Image
                src="/images/pages/supersonic-tax-prep.jpg"
                alt="Supersonic Fast Cash"
                fill
                className="object-cover"
                sizes="192px"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Professional tax preparation and free VITA services. PTIN-credentialed preparers.
              Serving Indiana, Illinois, Ohio, Tennessee, and Texas.
            </p>
            <a href="tel:+13173143757" className="text-brand-red-400 font-bold text-lg hover:text-brand-red-300 transition-colors">
              (317) 314-3757
            </a>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
            {LINKS.map((col) => (
              <div key={col.heading}>
                <p className="font-bold text-white text-sm uppercase tracking-wide mb-4">{col.heading}</p>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-slate-400 text-sm hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-start gap-4">
          <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
            Supersonic Fast Cash is a d/b/a of 2Exclusive LLC-S. PTIN-credentialed preparers.
            Refund advance is a financial product offered by a lending partner subject to eligibility.
            Rise Up Foundation VITA services are provided by IRS-certified volunteers at no cost to qualifying taxpayers.
          </p>
          <div className="flex gap-4 flex-shrink-0">
            <Link href="/supersonic-fast-cash/legal/privacy" className="text-slate-500 text-xs hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/supersonic-fast-cash/legal/terms" className="text-slate-500 text-xs hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
