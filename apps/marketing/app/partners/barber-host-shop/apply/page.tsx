import { Metadata } from 'next';
import Link from 'next/link';
import { STATIC_PROGRAM_MAP, getStaticProgram } from '@/data/programs/index';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { getAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Host Shop Application | Barber Apprenticeship | Elevate for Humanity',
  description: 'Apply to become a host shop for our barber apprenticeship program. Train the next generation of barbers while growing your business.',
};

const staticProgramOptions = Array.from(STATIC_PROGRAM_MAP.values())
  .map((program) => ({
    id: program.slug,
    title: program.title,
    slug: program.slug,
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

export default async function ApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ program?: string; payment?: string }>;
}) {
  const params = await searchParams;

  // Note: ?program=barber-apprenticeship is 301'd to /programs/barber-apprenticeship/apply
  // by next.config.mjs before this page renders. No barber-specific branch needed here.
  const programSlug = normalizeProgramInterest(params?.program) ?? '';

  // Resolve a human-readable program name for the hero: try static catalog first,
  // then fall back to slug-to-title formatting so the hero is never blank.
  const staticProg = programSlug ? getStaticProgram(programSlug) : null;
  const programTitle = staticProg?.title
    ?? (programSlug
      ? programSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '');

  let programs = staticProgramOptions;

  // Use admin client to bypass RLS when available. CI and local preview jobs often
  // do not have SUPABASE_SERVICE_ROLE_KEY, so fall back to the static catalog
  // instead of crashing the entire intake page.
  const db = await getAdminClient();
  if (db) {
    const { data, error } = await db
      .from('programs')
      .select('id, title, slug')
      .eq('published', true)
      .eq('is_active', true)
      .neq('status', 'archived')
      .order('title');

    if (!error && data?.length) {
      programs = data;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Apply</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
