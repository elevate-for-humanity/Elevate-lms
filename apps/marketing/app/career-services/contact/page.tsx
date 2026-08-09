import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Contact Career Services',
  keywords: ['career services', 'contact', 'support', 'questions'],
  description: 'Get in touch with our career services team. We\'re here to help with resume building, job placement, and career counseling.',
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
        description="Have questions about resume building, interview prep, or job placement? Our career services team is here to help."
        actions={(
          <a href={phoneHref} className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">
            <Phone className="mr-2 h-4 w-4" /> Call {PLATFORM_DEFAULTS.supportPhone}
          </a>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Phone className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Call Us</h3>
              <p className="mb-4 text-sm text-slate-700">Speak directly with a career counselor</p>
              <a href={phoneHref} className="text-sm font-semibold text-brand-blue-700 hover:underline">{PLATFORM_DEFAULTS.supportPhone}</a>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Mail className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Email Us</h3>
              <p className="mb-4 text-sm text-slate-700">Send your questions anytime</p>
              <a href="mailto:careers@elevateforhumanity.org" className="text-sm font-semibold text-brand-blue-700 hover:underline">careers@elevateforhumanity.org</a>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Clock className="mx-auto mb-4 h-8 w-8 text-brand-blue-700" />
              <h3 className="mb-2 font-bold text-slate-950">Office Hours</h3>
              <p className="mb-4 text-sm text-slate-700">Monday–Friday, 8 AM–5 PM ET</p>
              <span className="text-sm font-semibold text-brand-blue-700">Virtual appointments available</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950">Send Us a Message</h2>
          <p className="mb-8 text-center text-slate-700">Fill out the form below and we&apos;ll get back to you within one business day.</p>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <form className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Your Name</label>
                <input type="text" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-500" placeholder="Your name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Email Address</label>
                <input type="email" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-500" placeholder="you@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">How Can We Help?</label>
                <select className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-500">
                  <option>Select a topic</option>
                  <option>Resume Building Help</option>
                  <option>Interview Preparation</option>
                  <option>Job Search Support</option>
                  <option>Career Counseling</option>
                  <option>Other Question</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Message</label>
                <textarea rows={4} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-500" placeholder="Tell us how we can help..." />
              </div>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue-700 py-3 font-bold text-white transition-colors hover:bg-brand-blue-800">
                Send Message <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">Visit Us</h2>
          <div className="mb-2 flex items-center justify-center gap-2 text-slate-700"><MapPin className="h-4 w-4" /> Indianapolis, Indiana</div>
          <p className="text-sm text-slate-700">Virtual services are available throughout Indiana.</p>
        </div>
      </section>
    </div>
  );
}
