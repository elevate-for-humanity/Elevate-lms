import { Calendar, Phone } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { organization } from '@/lib/config/organization';
import { loadApplyProgramOptions } from '@/lib/programs/public-program-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Book an Enrollment Consultation',
  description: 'Choose your program and schedule an enrollment consultation with Elevate.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/booking/enrollment' },
};

export default async function EnrollmentBookingPage() {
  const { options } = await loadApplyProgramOptions();

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/hero/hero-early-childhood.webp"
        alt="Enrollment advisor meeting with a prospective student"
        eyebrow="Enrollment Support"
        title="Book an Enrollment Consultation"
        description="Choose the career program you are interested in, begin the application, or schedule time with an enrollment advisor."
        actions={
          <>
            <a
              href={organization.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-bold text-white transition hover:bg-brand-red-700"
            >
              <Calendar className="h-5 w-5" /> Schedule a Meeting
            </a>
            <a
              href={`tel:${organization.phone.replace(/[^+\d]/g, '')}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-slate-900 px-6 py-3 font-bold text-slate-950 transition hover:bg-slate-50"
            >
              <Phone className="h-5 w-5" /> {organization.phone}
            </a>
          </>
        }
      />

      <section className="px-4 py-14 sm:py-16" aria-labelledby="enrollment-program-heading">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-10">
          <h2
            id="enrollment-program-heading"
            className="text-2xl font-black text-slate-950 sm:text-3xl"
          >
            Start with your program
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Selecting a program lets the application show the correct enrollment and funding
            questions.
          </p>

          <form action="/apply" method="get" className="mt-7 space-y-5">
            <input type="hidden" name="source" value="enrollment-booking" />
            <div>
              <label htmlFor="program" className="mb-2 block text-sm font-bold text-slate-900">
                Program of interest
              </label>
              <select
                id="program"
                name="program"
                required
                defaultValue=""
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 focus:border-brand-red-500 focus:outline-none focus:ring-2 focus:ring-brand-red-200"
              >
                <option value="" disabled>
                  Select a program
                </option>
                {options.map((program) => (
                  <option key={program.id} value={program.slug}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Continue to Application
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
