import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Contact Us | Elevate Support',
  description: 'Get in touch with our support team for questions about programs, enrollment, payments, and technical support.',
};

export default function SupportContactPage() {
  const phoneHref = `tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`;

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/hero-images/contact-hero.webp"
        alt="Elevate support and customer assistance"
        eyebrow="Support"
        title="Contact Support"
        description="Questions about programs, enrollment, payments, or your account? Use the support channels below and we will route your request to the correct team."
        actions={(
          <>
            <a href={phoneHref} className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700"><Phone className="mr-2 h-4 w-4" /> Call {PLATFORM_DEFAULTS.supportPhone}</a>
            <Link href="/contact" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Send a Request <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Phone className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Call Us</h3>
              <p className="mb-4 text-sm text-slate-700">Speak with the Elevate team during business hours.</p>
              <a href={phoneHref} className="text-sm font-semibold text-brand-blue-700 hover:underline">{PLATFORM_DEFAULTS.supportPhone}</a>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Mail className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Email Support</h3>
              <p className="mb-4 text-sm text-slate-700">Send account, program, enrollment, or technical questions.</p>
              <a href="mailto:support@elevateforhumanity.org" className="text-sm font-semibold text-brand-blue-700 hover:underline">support@elevateforhumanity.org</a>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Clock className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Support Options</h3>
              <p className="mb-4 text-sm text-slate-700">Phone, email, and virtual assistance are available.</p>
              <Link href="/contact" className="text-sm font-semibold text-brand-blue-700 hover:underline">Open Contact Page</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Choose the right support path</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Enrollment or program question', '/contact'],
                ['Application status', '/apply/track'],
                ['Funding question', '/funding'],
                ['Technical or account support', '/contact'],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="rounded-xl border border-slate-200 bg-slate-50 p-5 font-bold text-slate-900 transition-colors hover:border-brand-blue-300 hover:bg-brand-blue-50">{label} <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">Service Area</h2>
          <div className="mb-2 flex items-center justify-center gap-2 text-slate-700"><MapPin className="h-4 w-4" /> Indianapolis, Indiana</div>
          <p className="text-sm text-slate-700">Virtual support is available for learners and partners outside the office.</p>
        </div>
      </section>
    </div>
  );
}
