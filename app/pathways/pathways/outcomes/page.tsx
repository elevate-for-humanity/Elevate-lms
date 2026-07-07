import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Briefcase, DollarSign, Clock, Award } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PathwayCTA from '@/components/pathways/PathwayCTA';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Outcomes & What You Can Expect | Career Pathways',
  description:
    'What each Elevate training program leads to: credentials, salaries, employers, and funding coverage.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pathways/outcomes' },
};

export const revalidate = 3600;

async function getPrograms() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('programs')
      .select(
        'id,slug,title,credential,duration,duration_weeks,salary_min,salary_max,employers,career_outcomes,funding,cover_image_url,hero_image_url,image_url,description,category'
      )
      .eq('is_active', true)
      .eq('published', true)
      .not('salary_min', 'is', null)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export default async function OutcomesPage() {
  const programs = await getPrograms();

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Career Pathways', href: '/pathways' },
              { label: 'Outcomes & What You Can Expect' },
            ]}
          />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Outcomes & What You Can Expect</h1>
          <p className="text-xl text-slate-300">
            Real credentials. Real employers. Real pay. Every program leads to a
            third-party-issued credential — not a certificate of completion from us.
          </p>
        </div>
      </section>

      {programs.length === 0 ? (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-slate-500 text-lg">Program outcomes data is being updated. Check back soon.</p>
          <Link href="/programs" className="mt-6 inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition">
            View All Programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 space-y-10">
            {programs.map((p) => {
              const image = p.cover_image_url || p.hero_image_url || p.image_url;
              const employers: { name: string; pay: string }[] =
                typeof p.employers === 'string'
                  ? JSON.parse(p.employers)
                  : Array.isArray(p.employers)
                  ? p.employers
                  : [];
              const salary = formatSalary(p.salary_min, p.salary_max);

              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {image && (
                    <div className="relative h-48 sm:h-64 overflow-hidden">
                      <Image src={image} alt={p.title} fill sizes="100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{p.title}</h2>
                        {p.credential && (
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <Award aria-label="award" className="w-4 h-4" /> {p.credential}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {p.duration && (
                          <span className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> {p.duration}
                          </span>
                        )}
                        {salary && (
                          <span className="flex items-center gap-1 text-sm bg-brand-green-50 text-brand-green-700 px-3 py-1 rounded-full font-semibold">
                            <DollarSign className="w-3.5 h-3.5" /> {salary}
                          </span>
                        )}
                      </div>
                    </div>

                    {p.career_outcomes && (
                      <p className="text-slate-700 mb-6">{p.career_outcomes}</p>
                    )}

                    {employers.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" /> Who hires you
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {employers.map((e) => (
                            <div key={e.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                              <span className="text-sm text-slate-700">{e.name}</span>
                              <span className="text-sm font-semibold text-brand-green-700">{e.pay}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.funding && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
                        <p className="text-sm text-blue-800"><span className="font-semibold">Funding: </span>{p.funding}</p>
                      </div>
                    )}

                    <Link
                      href={`/programs/${p.slug}`}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
                    >
                      View Program <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <PathwayCTA
        heading="Ready to Start?"
        body="Check your eligibility for free or funded training today."
        secondary={{ label: 'View All Programs', href: '/programs' }}
      />
    </div>
  );
}
