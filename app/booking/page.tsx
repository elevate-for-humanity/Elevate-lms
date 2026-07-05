import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Calendar, Phone, Mail, Video, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: `Book an Appointment | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Schedule an appointment with Elevate for Humanity. Book enrollment advising, campus tours, or career consultations.',
};

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Book an Appointment</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Schedule a one-on-one with our team
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Video,
                title: 'Virtual Consultation',
                description: 'Meet with an advisor from anywhere. Video call appointments available.',
                href: '/contact',
                cta: 'Schedule Virtual',
              },
              {
                icon: MapPin,
                title: 'In-Person Visit',
                description: 'Tour our campus, meet instructors, and explore our facilities.',
                href: '/locations',
                cta: 'Schedule Visit',
              },
              {
                icon: Calendar,
                title: 'Enrollment Advising',
                description: 'One-on-one session to discuss programs, funding, and enrollment.',
                href: '/apply',
                cta: 'Book Advising',
              },
            ].map((type) => (
              <div key={type.title} className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <type.icon className="w-12 h-12 text-brand-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">{type.title}</h3>
                <p className="text-slate-600 mb-6">{type.description}</p>
                <Link
                  href={type.href}
                  className="inline-flex items-center justify-center px-6 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors"
                >
                  {type.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Prefer to Call?</h2>
            <p className="text-slate-300 mb-6">Our team is available Monday-Friday, 9am-5pm EST</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="tel:3173143757" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors">
                <Phone className="w-5 h-5" />
                (317) 314-3757
              </a>
              <a href="mailto:info@elevateforhumanity.org" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                <Mail className="w-5 h-5" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
