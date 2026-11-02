import Image from 'next/image';
import Link from 'next/link';
import { teamProfileHref } from '@/lib/navigation/team-profile';
import { notFound } from 'next/navigation';
import { getTeamMembers } from '@/lib/content';
import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { TEAM } from '@/data/team';

export const dynamic = 'force-dynamic';

function teamMemberSlug(member: { name: string }): string {
  return member.name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function findTeamMember(slug: string) {
  const databaseMembers = await getTeamMembers().catch(() => []);
  return (
    databaseMembers.find((member) =>
      member.id === slug || teamMemberSlug(member) === slug || teamProfileHref(member).endsWith(`/${slug}`),
    ) ?? TEAM.find((member) => member.id === slug || teamMemberSlug(member) === slug || teamProfileHref(member).endsWith(`/${slug}`))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await findTeamMember(slug);
  if (!member) return {};
  return buildMetadata({
    title: member.name,
    description: `${member.name} — ${member.title} at ${PLATFORM_DEFAULTS.orgName}.`,
    path: `/about/team/${slug}`,
  });
}

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await findTeamMember(slug);
  if (!member) return notFound();
  const portrait = 'image_url' in member ? member.image_url : member.headshotSrc;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/about/team" className="mb-6 inline-flex min-h-11 items-center font-bold text-brand-red-700 hover:underline">← Back to team</Link>
      {portrait ? <Image src={portrait} alt={member.name} width={400} height={500} className="mb-6 w-full max-w-sm rounded-2xl object-cover object-top" /> : null}
      <h1 className="text-3xl font-bold">{member.name}</h1>
      <p className="mt-1 text-lg text-slate-600">{member.title}</p>
      <div className="mt-6 space-y-4 text-slate-700">{(member.bio ?? '').split(/\n\n/).map((paragraph, index) => <p key={index} className="leading-7">{paragraph}</p>)}</div>
      <div className="mt-10">
        <a
          href={siteConfig.handoff.apply}
          className="rounded bg-black px-5 py-3 text-white hover:bg-slate-800"
        >
          Apply Now
        </a>
      </div>
    </section>
  );
}
