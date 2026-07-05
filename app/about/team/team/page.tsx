export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { teamMembers } from '@/content/cf-team';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Our Team',
  description:
    `Meet the ${PLATFORM_DEFAULTS.orgName} team — educators, workforce specialists, and community advocates.`,
};

export default function TeamPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Our Team</h1>
      <p className="mt-4 text-slate-700">
        Educators, workforce specialists, and community advocates committed to learner success.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {teamMembers.map((member) => (
          <article key={member.slug} className="flex gap-4 rounded border p-6 hover:bg-slate-50">
            {member.headshotSrc && (
              <Image
                sizes="72px"
                src={member.headshotSrc}
                alt={member.name}
                width={72}
                height={72}
                className="rounded-full object-cover shrink-0"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{member.name}</h2>
              <p className="text-sm text-slate-500">{member.title}</p>
              <p className="mt-2 text-sm text-slate-700 line-clamp-3">{member.bio}</p>
              <Link
                href={`/about/team/${member.slug}`}
                className="mt-3 inline-block text-sm font-medium text-brand-red-600 underline hover:text-brand-red-700"
              >
                Read more
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
