import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'About Supersonic Fast Cash',
  description:
    'Indianapolis tax preparation, education pathways and tax-office opportunities through HOTT KAMODITTY DBA Supersonic Fast Cash.',
  alternates: { canonical: '/tax-software/about' },
};
export default function About() {
  return (
    <TaxSiteShell>
      <main>
        <section className="bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest !text-white">
            Supersonic Fast Cash · Indianapolis
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight !text-white sm:text-5xl">
            Tax help today.
            <br />A path into the profession.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 !text-white">
            We connect tax preparation services with clear next steps for people who want to learn
            financial skills, explore a tax career or plan their own business.
          </p>
          <Link
            href="/tax-software/contact"
            className={taxButton + ' mt-8 bg-[#c8102e] !text-white'}
          >
            Talk with our team →
          </Link>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#c8102e]">
                Who we are
              </p>
              <h2 className="mt-3 text-3xl font-black">HOTT KAMODITTY DBA Supersonic Fast Cash</h2>
              <p className="mt-5 leading-8 text-slate-600">
                Supersonic Fast Cash serves individuals, self-employed clients and businesses
                seeking tax preparation help. Our website also connects future tax professionals
                with education and employment information.
              </p>
              <p className="mt-5 leading-8 text-slate-600">
                Each path has its own process. A request for tax help is a service inquiry; a
                program application is an education step; a job application is reviewed by our
                hiring team.
              </p>
            </div>
            <aside className="rounded-2xl bg-[#f0f5ff] p-8">
              <h3 className="text-2xl font-black">Reach our Indianapolis team.</h3>
              <address className="mt-5 not-italic leading-8">
                120 Market, Suite 930
                <br />
                Indianapolis, IN 46204
              </address>
              <a
                href="tel:+13179999620"
                className="mt-5 inline-block text-xl font-bold text-[#082b66]"
              >
                (317) 999-9620
              </a>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Contact us to confirm the appropriate service or appointment before visiting. Keep
                tax documents and identity information out of public inquiry forms.
              </p>
            </aside>
          </div>
        </section>
        <section className="bg-slate-50 px-6 py-14 sm:px-10 lg:px-14">
          <h2 className="text-3xl font-black">Start where you are.</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              [
                'Get your taxes prepared',
                'Discuss your return, documents, service scope and pricing with our team.',
                '/tax-software/contact',
                'Get tax help',
              ],
              [
                'Learn taxes or plan a business',
                'Compare bookkeeping and accounting with business administration, and ask about WorkOne funding.',
                '/tax-software/professional',
                'Explore training',
              ],
              [
                'Apply for work',
                'Review office and remote opportunities, the skills assessment, online system training and hiring process.',
                '/tax-software/careers',
                'Explore careers',
              ],
            ].map(([title, body, href, label]) => (
              <article key={title} className="flex flex-col border-t-4 border-[#073ca2] pt-5">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="my-5 text-sm leading-8 text-slate-600">{body}</p>
                <Link
                  href={href}
                  className="mt-auto font-bold text-[#073ca2] underline underline-offset-4"
                >
                  {label} →
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </TaxSiteShell>
  );
}
