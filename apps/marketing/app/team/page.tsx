import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = false;

export const metadata: Metadata = {
  title: 'Our Team | Elevate for Humanity',
  description:
    'Meet the leadership and team supporting Elevate for Humanity programs and services.',
};

const TEAM_MEMBERS = [
  {
    id: 'elizabeth-greene',
    name: 'Elizabeth Greene',
    title: 'CEO and Executive Director',
    bio: 'Provides organizational leadership, workforce-development strategy, program oversight, and community partnership development.',
  },
];

export default function TeamPage() {
  return (
    <main>
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide">Leadership</p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Our Team</h1>

          <p className="mt-6 text-lg leading-8">
            Meet the people supporting Elevate for Humanity&apos;s education,
            workforce, apprenticeship, and community-development programs.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border p-6 shadow-sm"
            >
              <div
                aria-hidden="true"
                className="flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-bold"
              >
                {member.name
                  .split(' ')
                  .map((part) => part.charAt(0))
                  .join('')
                  .slice(0, 2)}
              </div>

              <h2 className="mt-6 text-2xl font-semibold">{member.name}</h2>

              <p className="mt-2 font-medium">{member.title}</p>

              <p className="mt-4 leading-7">{member.bio}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
