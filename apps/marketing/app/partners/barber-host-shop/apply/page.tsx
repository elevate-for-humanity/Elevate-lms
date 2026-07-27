import { Metadata } from 'next';
import Link from 'next/link';
import { STATIC_PROGRAM_MAP, getStaticProgram } from '@/data/programs/index';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { getAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Host Shop Application | Barber Apprenticeship',
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
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Host Shop Application</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Barber Host Shop</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Apply to host barber apprentices in your barbershop. Train future professionals while building your team.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Host Shop Benefits</h2>
              <div className="space-y-4">
                <div className="flex gap-4 bg-white rounded-xl p-6 shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Tax Incentives</h4>
                    <p className="text-slate-600 text-sm">Receive tax credits for hosting registered apprentices</p>
                  </div>
                </div>
                <div className="flex gap-4 bg-white rounded-xl p-6 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">👥</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Build Your Team</h4>
                    <p className="text-slate-600 text-sm">Pre-trained talent ready to hire after completing their apprenticeship</p>
                  </div>
                </div>
                <div className="flex gap-4 bg-white rounded-xl p-6 shadow-sm">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📚</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">No Training Burden</h4>
                    <p className="text-slate-600 text-sm">We handle classroom instruction; you provide hands-on experience</p>
                  </div>
                </div>
                <div className="flex gap-4 bg-white rounded-xl p-6 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Shape the Industry</h4>
                    <p className="text-slate-600 text-sm">Mentor the next generation of professional barbers</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Apply Now</h2>
              <p className="text-slate-600 mb-6">Complete the form below and our team will contact you within 2-3 business days to discuss next steps.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-3" placeholder="Your barbershop name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-3" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" className="w-full border border-slate-300 rounded-lg px-4 py-3" placeholder="(317) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" className="w-full border border-slate-300 rounded-lg px-4 py-3" placeholder="you@barbershop.com" />
                </div>
                <Link href="/contact" className="block w-full text-center bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors">
                  Submit Application
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
