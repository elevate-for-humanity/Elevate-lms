import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BookOpen, MapPin, Clock, Award, DollarSign } from 'lucide-react';
import CatalogFilters from './CatalogFilters';

export const metadata: Metadata = {
  title: 'Program Catalog | Elevate for Humanity',
  description: 'Browse workforce training programs from approved providers. Filter by funding eligibility, credential type, location, and start date.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/catalog' },
};

export const revalidate = 60;

const CATEGORIES = [
  'HVAC / Refrigeration', 'Electrical', 'Plumbing', 'Welding',
  'CDL / Commercial Driving', 'Carpentry / Construction',
  'Healthcare / CNA', 'Medical Assistant', 'Phlebotomy',
  'Barbering / Cosmetology', 'IT Support / Cybersecurity',
  'Business / Office Administration', 'Tax Preparation',
];

type SearchParams = {
  q?: string;
  category?: string;
  wioa?: string;
  provider?: string;
  page?: string;
};

export default async function ProgramCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q ?? '';
  const category = params.category ?? '';
  const wioaOnly = params.wioa === 'true';
  const providerSlug = params.provider ?? '';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const perPage = 18;

  const supabase = await createClient();

  let query = supabase
    .from('program_catalog_index')
    .select(
      'program_id, provider_name, provider_slug, title, slug, category, ' +
      'wioa_eligible, funding_tags, credential_name, duration_weeks, ' +
      'next_start_date, seats_available, delivery_mode, city, state, ' +
      'completion_rate, placement_rate',
      { count: 'exact' }
    )
    .range((page - 1) * perPage, page * perPage - 1)
    .order('next_start_date', { ascending: true, nullsFirst: false });

  if (q) query = query.textSearch('search_vector', q, { type: 'websearch' });
  if (category) query = query.eq('category', category);
  if (wioaOnly) query = query.eq('wioa_eligible', true);
  if (providerSlug) query = query.eq('provider_slug', providerSlug);

  const { data: programs, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / perPage);

  // URL helpers for server-rendered pagination links (not passed to client components)
  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    if (wioaOnly) sp.set('wioa', 'true');
    if (providerSlug) sp.set('provider', providerSlug);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/programs/catalog${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Catalog' },
        ]} />
      </div>

      <div className="bg-white py-10 border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Program Catalog</h1>
          <p className="text-slate-600 text-sm">
            {count ?? 0} program{(count ?? 0) !== 1 ? 's' : ''} from approved providers
            {wioaOnly ? ' · WIOA eligible' : ''}
            {category ? ` · ${category}` : ''}
            {providerSlug ? ` · ${providerSlug}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <CatalogFilters
              categories={CATEGORIES}
              current={{ q, category, wioa: wioaOnly, provider: providerSlug }}
            />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {(programs ?? []).length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No programs match your filters.</p>
                <Link href="/programs/catalog" className="mt-3 inline-block text-sm text-brand-blue-600 hover:underline">
                  Clear filters
                </Link>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                  {(programs ?? []).map(prog => (
                    <ProgramCard key={prog.program_id} prog={prog} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={pageUrl(page - 1)}
                        className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="text-sm text-slate-500">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={pageUrl(page + 1)}
                        className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ProgramRow = {
  program_id: string;
  provider_name: string;
  provider_slug: string;
  title: string;
  slug: string | null;
  category: string | null;
  wioa_eligible: boolean;
  funding_tags: string[];
  credential_name: string | null;
  duration_weeks: number | null;
  next_start_date: string | null;
  seats_available: number | null;
  delivery_mode: string | null;
  city: string | null;
  state: string;
  completion_rate: number | null;
  placement_rate: number | null;
};

function ProgramCard({ prog }: { prog: ProgramRow }) {
  const enrollHref = prog.slug
    ? `/programs/${prog.slug}/enroll`
    : `/programs/${prog.program_id}/enroll`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col hover:shadow-md transition">
      <div className="p-4 flex-1">
        {/* Provider */}
        <div className="text-xs text-slate-400 mb-1.5 truncate">{prog.provider_name}</div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2">{prog.title}</h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {prog.wioa_eligible && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">WIOA</span>
          )}
          {(prog.funding_tags ?? []).filter(t => t !== 'wioa').slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
          {prog.category && (
            <span className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded-full">{prog.category}</span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs text-slate-500">
          {prog.credential_name && (
            <div className="flex items-center gap-1.5">
              <Award className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{prog.credential_name}</span>
            </div>
          )}
          {prog.duration_weeks && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {prog.duration_weeks} weeks
            </div>
          )}
          {(prog.city || prog.state) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {[prog.city, prog.state].filter(Boolean).join(', ')}
              {prog.delivery_mode === 'online' && ' · Online'}
              {prog.delivery_mode === 'hybrid' && ' · Hybrid'}
            </div>
          )}
          {prog.next_start_date && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 flex-shrink-0 text-center">▸</span>
              Starts {new Date(prog.next_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          {prog.seats_available != null && prog.seats_available <= 5 && (
            <div className="text-yellow-600 font-medium">
              {prog.seats_available === 0 ? 'Waitlist only' : `${prog.seats_available} seats left`}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <Link
          href={enrollHref}
          className="block w-full text-center text-sm font-semibold bg-brand-blue-600 text-white py-2 rounded-lg hover:bg-brand-blue-700 transition"
        >
          Enroll
        </Link>
      </div>
    </div>
  );
}
