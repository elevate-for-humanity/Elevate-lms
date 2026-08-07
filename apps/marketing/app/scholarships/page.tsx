import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Scholarships & Funding | Elevate for Humanity',
  description: 'Review funding and scholarship options for Elevate for Humanity training programs.',
};

export default function ScholarshipsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-red-300">Funding</p>
          <h1 className="text-4xl font-black md:text-6xl">Scholarships & Training Funding</h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-200">
            Funding availability depends on the program, participant eligibility, and the funding source. Elevate helps applicants review WIOA, Workforce Ready Grant, employer-sponsored, scholarship, and self-pay options without guaranteeing funding approval.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {[
            ['WIOA / WorkOne', 'Some approved training programs may qualify for WIOA funding for eligible participants.', '/funding/wioa'],
            ['Workforce Ready Grant', 'Qualifying Indiana residents may be eligible for Workforce Ready Grant funding for approved programs.', '/funding/wrg'],
            ['Scholarship Review', 'Applicants who need additional assistance can ask admissions whether any current scholarship or partner-supported funding is available.', '/contact'],
            ['Self-Pay & Payment Options', 'Programs that are not funded, or applicants who are not eligible for public funding, may use approved self-pay options where available.', '/funding'],
          ].map(([title, body, href]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-slate-600">{body}</p>
              <Link href={href} className="mt-5 inline-flex font-bold text-brand-blue-700 hover:underline">
                Learn more →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-slate-50 px-4 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row">
          <Link href="/eligibility/quiz" className="rounded-xl bg-brand-red-600 px-6 py-3 text-center font-bold text-white hover:bg-brand-red-700">
            Check Eligibility
          </Link>
          <Link href="/apply" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-bold text-slate-900 hover:bg-slate-100">
            Apply
          </Link>
          <Link href="/contact" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-bold text-slate-900 hover:bg-slate-100">
            Contact Admissions
          </Link>
        </div>
      </section>
    </main>
  );
}
