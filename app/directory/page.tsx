import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Building2, MapPin, Phone, Globe, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Directory | Elevate for Humanity',
  description: 'Workforce development partners, employer partners, and community resources in Indianapolis. WorkOne, Indiana DWD, EmployIndy, and more.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/directory' },
};

const partners = [
  {
    name: 'WorkOne Indy',
    type: 'Workforce Center',
    desc: 'WIOA and WRG funding eligibility, career counseling, and job search assistance.',
    address: 'Indianapolis, IN',
    url: 'https://www.workoneindy.com',
    logo: '/images/partners/workone.svg',
  },
  {
    name: 'Indiana DWD',
    type: 'State Agency',
    desc: 'Indiana Department of Workforce Development. Administers WIOA, WRG, JRI, and Next Level Jobs.',
    address: 'Indianapolis, IN',
    url: 'https://www.in.gov/dwd',
    logo: '/images/partners/dwd.svg',
  },
  {
    name: 'EmployIndy',
    type: 'Workforce Board',
    desc: 'Marion County workforce development board. Oversees local WIOA funding and employer partnerships.',
    address: 'Indianapolis, IN',
    url: 'https://employindy.org',
    logo: null,
  },
  {
    name: 'U.S. Department of Labor',
    type: 'Federal Agency',
    desc: 'Registered Apprenticeship oversight and national workforce policy.',
    address: 'Washington, DC',
    url: 'https://www.dol.gov',
    logo: '/images/partners/usdol.webp',
  },
  {
    name: 'Next Level Jobs',
    type: 'State Program',
    desc: 'Workforce Ready Grant and Employer Training Grant programs for Indiana residents.',
    address: 'Indiana',
    url: 'https://nextleveljobs.org',
    logo: '/images/partners/nextleveljobs.webp',
  },
];

const resources = [
  { name: 'Indiana Career Connect', desc: 'State job board and career services portal', url: 'https://www.indianacareerconnect.com' },
  { name: 'OSHA Training', desc: 'Workplace safety certification information', url: 'https://www.osha.gov' },
  { name: 'HSI (Health & Safety Institute)', desc: 'CPR/AED/First Aid certification', url: 'https://hsi.com' },
  { name: 'Indiana PLA', desc: 'Professional Licensing Agency — barber and cosmetology licensing', url: 'https://www.in.gov/pla' },
];

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner Directory' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">Partner Directory</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Workforce development partners, government agencies, and community resources.</p>
        </div>
      </section>

      {/* Partners */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Workforce Partners</h2>
          <div className="space-y-4">
            {partners.map((p) => (
              <div key={p.name} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {p.logo ? (
                      <Image src={p.logo} alt={p.name} width={40} height={40} className="w-10 h-10 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                        <p className="text-sm text-blue-600 font-medium">{p.type}</p>
                      </div>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0">
                          <Globe className="w-4 h-4" /> Website
                        </a>
                      )}
                    </div>
                    <p className="text-slate-600 mt-2">{p.desc}</p>
                    <p className="text-sm text-slate-400 mt-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* External Resources */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">External Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {resources.map((r) => (
              <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition group">
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{r.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Want to Partner With Us?</h2>
          <p className="text-slate-600 mb-8">Employers, workforce agencies, and community organizations — let&apos;s connect.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold transition">Contact Us <ArrowRight className="w-5 h-5" /></Link>
            <Link href="/employer" className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-full font-bold hover:border-slate-400 transition">Employer Portal</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
