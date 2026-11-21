import type { Metadata } from 'next';
import Link from 'next/link';
import { HOST_SHOP_REGIONS } from '@/lib/marketing/host-shop-regions';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import { PROGRAM_LABELS, PROGRAM_SLUGS } from '@/lib/programs/host-shop-programs';
import { PUBLIC_SITE_ORIGIN } from '@/lib/navigation/public-route-registry';

const path = '/apprenticeships/indiana';
const canonical = PUBLIC_SITE_ORIGIN + path;
const description = 'Search Elevate’s approved Indiana apprenticeship Host Shops and ask about training opportunities in your community.';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Indiana Apprenticeships and Host Shop Directory',
  description,
  alternates: { canonical },
};

const positions: Record<string, string> = {
  gary: 'col-start-1 row-start-1',
  'south-bend': 'col-start-2 row-start-1',
  'fort-wayne': 'col-start-3 row-start-2',
  indianapolis: 'col-start-2 row-start-3',
  bloomington: 'col-start-2 row-start-4',
  evansville: 'col-start-1 row-start-5',
};

// Municipalities verified from the public profiles and Indiana’s county directory.
const publicHostCounties: Readonly<Record<string, string>> = {
  carmel: 'Hamilton',
  elkhart: 'Elkhart',
  indianapolis: 'Marion',
  lafayette: 'Tippecanoe',
  'new castle': 'Henry',
  'new palestine': 'Hancock',
  plainfield: 'Hendricks',
  'south bend': 'St. Joseph',
  sullivan: 'Sullivan',
  'west lafayette': 'Tippecanoe',
};

export default async function IndianaApprenticeships({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const region = HOST_SHOP_REGIONS.find((entry) => entry.slug === params.region);
  const occupation = typeof params.occupation === 'string' && Object.hasOwn(PROGRAM_LABELS, params.occupation)
    ? params.occupation
    : '';
  const search = typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '';
  const availability = params.availability === 'inquiry' ? 'inquiry' : params.availability === 'hosts' ? 'hosts' : '';
  const shops = (await getHostShopNetwork()).filter((shop) => /^(IN|Indiana)$/i.test(shop.state));
  const counties = [...new Set([
    ...HOST_SHOP_REGIONS.flatMap((area) => area.counties),
    ...Object.values(publicHostCounties),
  ])].sort();
  const county = counties.find((entry) => entry === params.county) ?? '';
  const requestedRegion = region?.slug ?? '';
  const filterKey = new URLSearchParams({ q: search, county, region: requestedRegion, occupation, availability }).toString();
  const searchTerms = search.toLowerCase().split(/\s+/);
  if (searchTerms.length > 1 && searchTerms.at(-1) === 'county') searchTerms.pop();
  const inquiries = new URLSearchParams({ apprenticeship: occupation || 'general', region: requestedRegion, community: county ? county + ' County' : search });
  const results = shops.filter((shop) => {
    const city = shop.city.trim().toLowerCase();
    const shopCounty = publicHostCounties[city] ?? '';
    const inRegion = !region || region.counties.includes(shopCounty) ||
      [region.city, ...region.nearbyCities].some((name) => name.toLowerCase() === city);
    const searchable = [shop.name, shop.city, shopCounty].join(' ').toLowerCase();
    return availability !== 'inquiry' &&
      inRegion &&
      (!county || shopCounty === county) &&
      (!occupation || shop.programs.includes(occupation)) &&
      searchTerms.every((term) => searchable.includes(term));
  });
  const matchingHosts = results.length;
  const apply = matchingHosts > 0 && occupation === 'barber-apprenticeship'
    ? '/apply/student?' + new URLSearchParams({ program: occupation })
    : '';
  const hostProgram = Object.entries(PROGRAM_SLUGS).find(([, slug]) => slug === occupation)?.[0];
  const hostQuery = new URLSearchParams();
  if (requestedRegion) hostQuery.set('region', requestedRegion);
  if (hostProgram) hostQuery.set('program', hostProgram);
  const becomeHost = '/partners/host-shop/apply' + (hostQuery.size ? '?' + hostQuery : '');

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Apprenticeships', item: PUBLIC_SITE_ORIGIN + '/apprenticeships' },
      { '@type': 'ListItem', position: 2, name: 'Indiana Host Shops', item: canonical },
    ],
  };
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }} />
      <header className="bg-slate-950 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Find an apprenticeship Host Shop in Indiana</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">{description}</p>
          <p className="mt-3 max-w-2xl text-slate-300">An approved shop may be able to host apprentices. Ask Elevate to confirm openings, supervision, and program eligibility.</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[20rem_1fr]">
        <section aria-labelledby="region-map">
          <h2 id="region-map" className="text-2xl font-black">Indiana regions</h2>
          <p className="my-3 text-sm text-slate-600">Select a region on the schematic map or use the directory filters. Map labels show regional hubs.</p>
          <div className="grid grid-cols-3 grid-rows-5 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-2">
            {HOST_SHOP_REGIONS.map((area) => {
              const query = new URLSearchParams({ region: area.slug });
              if (occupation) query.set('occupation', occupation);
              if (availability) query.set('availability', availability);
              return (
                <Link key={area.slug} href={path + '?' + query + '#directory'}
                  aria-current={region === area ? 'true' : undefined}
                  className={`flex min-h-11 items-center justify-center rounded-lg border border-slate-300 p-1 text-center text-xs font-bold hover:bg-blue-100 aria-[current=true]:bg-blue-900 aria-[current=true]:text-white ${positions[area.slug]}`}>
                  {area.city}
                </Link>
              );
            })}
          </div>
        </section>
        <section id="directory" aria-labelledby="directory-title">
          <h2 id="directory-title" className="text-2xl font-black">Search the public directory</h2>
          <form key={filterKey} action={path + '#directory'} className="my-5 grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
            <label className="grid gap-1 font-semibold">Shop, city or county
              <input name="q" maxLength={80} defaultValue={search} className="min-h-11 rounded-lg border border-slate-400 px-3" />
            </label>
            <label className="grid gap-1 font-semibold">County
              <select name="county" defaultValue={county} className="min-h-11 rounded-lg border border-slate-400 px-3">
                <option value="">All counties</option>
                {counties.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-semibold">Region
              <select name="region" defaultValue={requestedRegion} className="min-h-11 rounded-lg border border-slate-400 px-3">
                <option value="">All Indiana</option>
                {HOST_SHOP_REGIONS.map((area) => <option key={area.slug} value={area.slug}>{area.city}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-semibold">Occupation
              <select name="occupation" defaultValue={occupation} className="min-h-11 rounded-lg border border-slate-400 px-3">
                <option value="">All occupations</option>
                {Object.entries(PROGRAM_LABELS).map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-semibold">Availability
              <select name="availability" defaultValue={availability} className="min-h-11 rounded-lg border border-slate-400 px-3">
                <option value="">All options</option>
                <option value="hosts">Approved public hosts</option>
                <option value="inquiry">Request placement information</option>
              </select>
            </label>
            <button className="min-h-11 rounded-lg bg-slate-950 px-4 font-bold text-white">Search</button>
            <button type="submit" form="clear-indiana-filters" className="min-h-11 text-left font-semibold underline">Clear filters</button>
          </form>
          <form id="clear-indiana-filters" action={path + '#directory'} />
          <p className="mb-4 font-semibold">{matchingHosts} matching {matchingHosts === 1 ? 'Host Shop' : 'Host Shops'}</p>
          {results.length > 0 ? (
            <ul className="grid gap-3">
              {results.map((shop) => (
                <li key={shop.id} className="rounded-xl border border-slate-200 p-4">
                  <Link href={`/host-shops/${shop.slug}`} className="font-black underline">{shop.name}</Link>
                  <p className="text-sm text-slate-700">
                    {shop.city}, Indiana{publicHostCounties[shop.city.trim().toLowerCase()] ? ` · ${publicHostCounties[shop.city.trim().toLowerCase()]} County` : ''}
                  </p>
                  <p className="mt-1 text-sm">{shop.programs.map((program) => PROGRAM_LABELS[program]).filter(Boolean).join(', ')}</p>
                </li>
              ))}
            </ul>
          ) : <p>{availability === 'inquiry' ? 'Tell Elevate where you want to train.' : 'No matching approved public hosts are listed. Ask about options in your community.'}</p>}
          <div className="mt-6 flex flex-wrap gap-4 font-bold">
            {apply && <Link href={apply} className="underline">Apply for barber apprenticeship</Link>}
            {!occupation && <Link href="/apprenticeships#programs" className="underline">Explore apprenticeship programs</Link>}
            <Link href={'/contact?' + inquiries + '#contact-form'} className="underline">Request information</Link>
            <Link href={becomeHost} className="underline">Become a Host Shop</Link>
            {region && matchingHosts > 0 && <Link href={`/partners/host-shops/indiana/${region.slug}`} className="underline">Visit the {region.city} regional guide</Link>}
          </div>
        </section>
      </div>
    </main>
  );
}
