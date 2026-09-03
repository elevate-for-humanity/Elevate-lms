import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Contact Career Services',
  keywords: ['career services', 'contact', 'support', 'questions'],
  description: 'Get in touch with our career services team for resume, interview, job-search, and career support.',
};

export default function CareerServicesContactPage() {
  const phoneHref = `tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`;

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/career-services-page-10.webp"
        alt="Career services team supporting job seekers"
        eyebrow="Career Services"
        title="Contact Career Services"
        description="Have questions about resume building, interview prep, job search, or career planning? Use the working contact channels below."
        actions={(
          <>
            <a href={phoneHref} className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700"><Phone className="mr-2 h-4 w-4" /> Call {PLATFORM_DEFAULTS.supportPhone}</a>
            <Link href="/contact?topic=career-services" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 hover:border-slate-500">Send a Request <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Phone className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Call Us</h3>
              <p className="mb-4 text-sm text-slate-700">Speak with the Elevate team about career support.</p>
              <a href={phoneHref} className="text-sm font-semibold text-brand-blue-700 hover:underline">{PLATFORM_DEFAULTS.supportPhone}</a>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Mail className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Email Career Services</h3>
              <p className="mb-4 text-sm text-slate-700">Send resume, interview, or job-search questions.</p>
              <a href="mailto:careers@elevateforhumanity.org" className="text-sm font-semibold text-brand-blue-700 hover:underline">careers@elevateforhumanity.org</a>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Clock className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Request Follow-Up</h3>
              <p className="mb-4 text-sm text-slate-700">Use the canonical contact form so your request reaches the correct team.</p>
              <Link href="/contact?topic=career-services" className="text-sm font-semibold text-brand-blue-700 hover:underline">Open Contact Form</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Career Services Topics</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Resume review', '/career-services/resume-building'],
                ['Job placement support', '/career-services/job-placement'],
                ['Professional development', '/career-services/courses'],
                ['General career-services request', '/contact?topic=career-services'],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="rounded-xl border border-slate-200 bg-slate-50 p-5 font-bold text-slate-900 hover:border-brand-blue-300 hover:bg-brand-blue-50">{label} <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">Service Area</h2>
          <div className="mb-2 flex items-center justify-center gap-2 text-slate-700"><MapPin className="h-4 w-4" /> Indianapolis, Indiana</div>
          <p className="text-sm text-slate-700">Virtual career support may be available depending on the service requested.</p>
        </div>
      </section>
    </div>
  );
}
