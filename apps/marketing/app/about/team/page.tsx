import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { TEAM } from '@/data/team';
import { teamProfileHref } from '@/lib/navigation/team-profile';
import { PublicEditorialHero } from '@/components/marketing/PublicEditorialHero';

// Load the active staff roster at request time; cookies() cannot run during prerendering.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Team | Elevate for Humanity',
  alternates: { canonical: 'https://www.elevateforhumanity.org/about/team' },
  description:
    'Meet the executive leaders, credentialed educators, workforce specialists, and community advocates behind Elevate for Humanity.',
};

export default async function TeamPage() {
  let members = TEAM;

  try {
    const supabase = await createClient();
    const { data: dbStaff, error } = await supabase
      .from('team_members')
      .select('id, name, title, bio, image_url, email')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('[team] Supabase query failed:', error.message);
    } else if (dbStaff && dbStaff.length > 0) {
      members = dbStaff.map((p) => ({
        id: p.id,
        name: p.name ?? 'Team Member',
        title: p.title ?? '',
        bio: p.bio ?? '',
        headshotSrc: p.image_url || TEAM.find(member => member.name === p.name)?.headshotSrc,
        email: p.email ?? '',
      }));
    }
  } catch (err) {
    console.error('[team] Failed to load team members:', err);
    // Fall back to static data on any failure
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Team' }]} />
        </div>
      </div>

      <PublicEditorialHero
        eyebrow="Our team & staff"
        title="People who help you move forward."
        description="Meet the educators, program leaders, and staff behind Elevate for Humanity. Explore their roles and experience, and find the people supporting your next step."
        image="/images/about-training-20261102.webp"
        imageAlt="Illustrative scene of adult learners working with an instructor"
      >
        <Link href="/about/elizabeth-greene" className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Meet our founder</Link>
        <Link href="/contact" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-950">Contact our team</Link>
      </PublicEditorialHero>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <article
              key={member.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              {member.headshotSrc && (
                <Image
                  src={member.headshotSrc}
                  alt={member.name}
                  width={400}
                  height={400}
                  className="aspect-[4/5] w-full object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold text-slate-900">{member.name}</h2>
                <p className="text-sm leading-6 text-slate-700 mb-2">{member.title}</p>
                <p className="text-sm text-slate-700 line-clamp-3">{member.bio}</p>
                {member.id && (
                  <Link
                    href={teamProfileHref(member)}
                    className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-red-600 hover:underline"
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
            We&apos;re always looking for passionate educators and workforce professionals.
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
