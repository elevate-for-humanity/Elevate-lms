import { FEATURED_BEAUTY_HOST_PARTNERS, PARTNER_BRAND_ALIASES } from '@/lib/apprenticeship-programs/host-partners';

export default function FeaturedHostPartners() {
  return (
    <section className="py-12 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-700 mb-2 text-center">
          Training network
        </p>
        <h2 className="text-3xl font-extrabold text-slate-950 mb-2 text-center">
          Approved host barbershops &amp; training partners
        </h2>
        <p className="text-slate-800 font-medium text-center mb-8 max-w-2xl mx-auto text-base leading-relaxed">
          Including {PARTNER_BRAND_ALIASES.kountryKutz}, {PARTNER_BRAND_ALIASES.corinneStyles} in Sullivan,
          and other currently approved Indiana host shops.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURED_BEAUTY_HOST_PARTNERS.map((shop) => (
            <div
              key={shop.name}
              className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm"
            >
              <h3 className="font-extrabold text-slate-950">{shop.dba ?? shop.name}</h3>
              {shop.dba && <p className="text-xs text-slate-700 font-medium mt-0.5">{shop.name}</p>}
              <p className="text-sm text-slate-800 font-medium mt-2">
                {shop.city}, {shop.state}
              </p>
              {shop.note && <p className="text-sm text-slate-800 font-medium mt-2">{shop.note}</p>}
              <p className="text-xs text-brand-blue-800 font-bold mt-3">
                Programs: {shop.programs.map((p) => p.replace(/-apprenticeship$/, '')).join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
