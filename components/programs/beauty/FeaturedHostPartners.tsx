import { FEATURED_BEAUTY_HOST_PARTNERS, PARTNER_BRAND_ALIASES } from '@/lib/beauty-apprenticeship/host-partners';

export default function FeaturedHostPartners() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2 text-center">
          Training network
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          Approved host barbershops &amp; training partners
        </h2>
        <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto text-sm">
          Including {PARTNER_BRAND_ALIASES.prestigeInstitute},{' '}
          {PARTNER_BRAND_ALIASES.kountryKutz}, {PARTNER_BRAND_ALIASES.corinneStyles} in Sullivan,
          and other DOL-registered Indiana host shops.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURED_BEAUTY_HOST_PARTNERS.map((shop) => (
            <div
              key={shop.name}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold text-slate-900">{shop.dba ?? shop.name}</h3>
              {shop.dba && <p className="text-xs text-slate-500 mt-0.5">{shop.name}</p>}
              <p className="text-sm text-slate-600 mt-2">
                {shop.city}, {shop.state}
              </p>
              {shop.note && <p className="text-sm text-slate-600 mt-2">{shop.note}</p>}
              <p className="text-xs text-brand-blue-600 font-medium mt-3">
                Programs: {shop.programs.map((p) => p.replace(/-apprenticeship$/, '')).join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
