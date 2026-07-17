export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getTeamMembers } from '@/lib/content';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Our Team',
  description:
    `Meet the ${PLATFORM_DEFAULTS.orgName} team — educators, workforce specialists, and community advocates.`,
};

export default async function TeamPage() {
  const teamMembers = await getTeamMembers();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Our Team</h1>
      <p className="mt-4 text-slate-700">
        Educators, workforce specialists, and community advocates committed to learner success.
      </p>
      {teamMembers.length === 0 ? (
        <p className="mt-10 text-slate-500">Team information coming soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {teamMembers.map((member) => (
            <article key={member.id} className="flex gap-4 rounded border p-6 hover:bg-slate-50">
              {member.image_url && (
                <Image
                  sizes="72px"
                  src={member.image_url}
                  alt={member.name}
                  width={72}
                  height={72}
                  className="rounded-full object-cover shrink-0"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{member.name}</h2>
                <p className="text-sm text-slate-500">{member.title}</p>
                {member.bio && (
                  <p className="mt-2 text-sm text-slate-700 line-clamp-3">{member.bio}</p>
                )}
                <Link
                  href={`/about/team/${member.id}`}
                  className="mt-3 inline-block text-sm font-medium text-brand-red-600 underline hover:text-brand-red-700"
                >
                  Read more
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
