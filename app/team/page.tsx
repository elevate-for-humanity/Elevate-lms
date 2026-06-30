import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { TEAM } from '@/data/team';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Our Team',
  description:
    `Meet the educators, workforce specialists, and community advocates behind ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/team' },
};

export default async function TeamPage() {
  // Pull staff profiles from DB; fall back to static data if table is empty
  const supabase = await createClient();
  const { data: dbStaff } = await supabase
    .from('team_members')
    .select('id, name, title, bio, image_url, email')
    .eq('is_active', true)
    .order('display_order');

  const members =
    dbStaff && dbStaff.length > 0
      ? dbStaff.map((p) => ({
          id: p.id,
          name: p.name ?? 'Team Member',
          title: p.title ?? '',
          bio: p.bio ?? '',
          headshotSrc: p.image_url ?? null,
          email: p.email ?? '',
        }))
      : TEAM;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Team' }]} />
        </div>
      </div>

      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            {PLATFORM_DEFAULTS.orgName}
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Our Team</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Educators, workforce specialists, and community advocates committed to learner success.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
          {members.map((member) => (
            <article
              key={member.id}
              className="flex gap-4 rounded-xl border p-6 hover:bg-slate-50 transition"
            >
              {member.headshotSrc && (
                <Image sizes="100vw"
                  src={member.headshotSrc}
                  alt={member.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover shrink-0 self-start"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{member.name}</h2>
                <p className="text-sm text-slate-500 mb-2">{member.title}</p>
                <p className="text-sm text-slate-700 line-clamp-3">{member.bio}</p>
                {'id' in member && (
                  <Link
                    href={`/about/team/${member.id}`}
                    className="mt-3 inline-block text-sm font-medium text-brand-red-600 hover:underline"
                  >
                    Read more →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Join Our Team</h2>
          <p className="text-slate-600 mb-6">
            We're always looking for passionate educators and workforce professionals.
          </p>
          <Link
            href="/careers"
            className="rounded-lg bg-brand-red-600 px-6 py-3 text-white font-semibold hover:bg-brand-red-700"
          >
            View Open Positions
          </Link>
        </div>
      </section>
    </div>
  );
}
