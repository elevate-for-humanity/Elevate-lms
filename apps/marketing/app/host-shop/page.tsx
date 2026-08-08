import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host Shop Partnerships | Elevate for Humanity',
  description:
    'Apply to become an approved apprenticeship host shop for barber, cosmetology, esthetics, and nail programs in Indiana.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/host-shop' },
};

const benefits = [
  {
    title: 'Build your workforce',
    text: 'Train an apprentice inside your business with a structured on-the-job learning plan.',
  },
  {
    title: 'Digital hour tracking',
    text: 'Supervisors review hours, attendance, and competency progress through the host shop portal.',
  },
  {
    title: 'Compliance support',
    text: 'Elevate coordinates program administration, related instruction, and apprenticeship documentation.',
  },
  {
    title: 'Employer partnership',
    text: 'Approved host shops can participate in the training network and receive matched apprentice candidates.',
  },
] as const;

const requirements = [
  'Indiana business or shop license in good standing for the occupation being hosted',
  'Qualified licensed supervisor or mentor available for apprentice oversight',
  'Safe physical workspace with appropriate tools and equipment',
  'Commercial liability insurance and required employment coverage',
  'Ability to verify hours, attendance, skills, and workplace progress',
  'Agreement to complete Elevate host-shop onboarding and compliance documentation',
] as const;

export default function HostShopPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-red-300">
            Apprenticeship Employer Network
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Become an approved Host Shop.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
            Host shops are employers and training sites. Shop owners complete a separate host-shop
            application, verification, and onboarding before supervising apprentices through the
            host-shop portal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/host-shop/apply"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-6 py-3 font-extrabold text-white hover:bg-red-700"
            >
              Apply to become a Host Shop
            </a>
            <a
              href="https://app.elevateforhumanity.org/host-shop/login"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-500 px-6 py-3 font-extrabold text-white hover:bg-slate-900"
            >
              Existing Host Shop Login
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight">What the partnership includes</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              The approved shop provides supervised on-the-job learning while Elevate coordinates
              related instruction, records, progress systems, and registered-program administration.
            </p>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xl font-black">{benefit.title}</h3>
                <p className="mt-2 leading-7 text-slate-700">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-red-700">Eligibility</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Host Shop requirements</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Submitting an application does not automatically approve a business. Elevate verifies
              the shop, licensing, supervisor, insurance, and program fit before activation.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <li
                key={requirement}
                className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800"
              >
                {requirement}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
          <h2 className="text-3xl font-black">Ready to host apprentices?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-200">
            Complete the dedicated host-shop application. Apprentice enrollment uses a separate
            learner workflow.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/host-shop/apply"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-6 py-3 font-extrabold text-white hover:bg-red-700"
            >
              Start Host Shop Application
            </a>
            <a
              href="tel:3173143757"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 px-6 py-3 font-bold text-white hover:bg-slate-900"
            >
              Call (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
