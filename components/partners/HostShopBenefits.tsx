import Image from 'next/image';
import Link from 'next/link';

const benefits = [
  { title: 'Showcase your business', text: 'A free public shop profile features your portfolio, location, and business links so customers can discover your work.', image: '/images/partners/top-shelf-barber-lounge/top-shelf-fade-profile-enhanced-2026.webp' },
  { title: 'Turn interest into visits', text: 'Customers can view your services, get directions, call your shop, and follow your booking links. Confirm walk-in availability directly with your shop.', image: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp' },
  { title: 'Develop your next team member', text: 'Connect with apprenticeship applicants and mentor future professionals. Placement depends on occupation approval, supervision, and available capacity.', image: '/images/pages/barber-hands-on-bright.webp' },
  { title: 'Keep your business growing', text: 'Your shop keeps its service and retail revenue. Elevate supports related instruction and training records; the shop provides wages and licensed supervision.', image: '/images/partners/salon-saloon/team-interior-enhanced-2026.webp' },
];

export default function HostShopBenefits() {
  return <section className="bg-sky-50 px-4 py-10 sm:py-14" aria-labelledby="host-benefits-heading">
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-black uppercase tracking-wide text-brand-red-700">Licensed shops: join free</p>
      <h2 id="host-benefits-heading" className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Promote your shop. Build your team.</h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-700">We’re recruiting barbershops, salons, nail studios, and esthetics businesses across Indiana. Give your work a home in the Barber &amp; Beauty Network.</p>
      <div data-mobile-grid="2" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{benefits.map((benefit) => <article key={benefit.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative aspect-[4/3]"><Image src={benefit.image} alt={benefit.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div>
        <div className="p-4"><h3 className="text-base sm:text-lg font-black text-slate-950">{benefit.title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{benefit.text}</p></div>
      </article>)}</div>
      <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white sm:p-7">
        <p className="text-xs font-black uppercase tracking-wide text-amber-300">For future barbers and beauty professionals</p>
        <h3 className="mt-2 text-2xl font-black">Earn while you learn.</h3>
        <p className="mt-3 max-w-3xl leading-7">Build practical skills through paid employment and supervised training at an approved Host Shop. Employment, placement, and the applicable wage schedule must be confirmed before you begin. Apprenticeship tuition is self-pay only.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link href="/partners/host-shop/apply" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-3 font-black text-white">Shop owners: apply free</Link><Link href="/barber-and-beauty-apprenticeships" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white px-5 py-3 font-black !text-white hover:!text-white">Students: explore training</Link></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">No listing, application, or placement fee. Shops cover wages, insurance, and business expenses. Listing does not guarantee customers, bookings, or apprentice placement.</p>
    </div>
  </section>;
}
