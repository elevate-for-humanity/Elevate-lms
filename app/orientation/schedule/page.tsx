import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/orientation/schedule' },
  title: 'Orientation Schedule | Elevate For Humanity',
  description: 'View upcoming orientation sessions and schedule your program orientation. Required before enrollment in any training program.',
};

const SESSIONS = [
  { day: 'Monday', time: '9:00 AM – 11:00 AM', format: 'In-Person', location: 'Indianapolis Training Center' },
  { day: 'Wednesday', time: '1:00 PM – 3:00 PM', format: 'Virtual (Zoom)', location: 'Online' },
  { day: 'Friday', time: '10:00 AM – 12:00 PM', format: 'In-Person', location: 'Indianapolis Training Center' },
];

const WHAT_TO_EXPECT = [
  'Overview of available training programs and career pathways',
  'Eligibility requirements and funding options (WIOA, DOL, JRI)',
  'Document checklist and enrollment process walkthrough',
  'Meet your enrollment advisor and ask questions',
  'Tour of training facilities (in-person sessions)',
  'Next steps and timeline to start your program',
];

export default function OrientationSchedulePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Orientation', href: '/orientation' }, { label: 'Schedule' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/getting-started-hero.jpg" alt="Students attending orientation session" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Orientation Schedule</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Attend an orientation session before enrolling in any training program.</p>
          </div>
        </div>
      </section>

      {/* Weekly Sessions */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Weekly Sessions</h2>
          <p className="text-gray-600 mb-8">Orientation is offered multiple times per week. Choose the session that works for you.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {SESSIONS.map((s) => (
              <div key={s.day} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-brand-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">{s.day}</h3>
                </div>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{s.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{s.location}</span>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    s.format.includes('Virtual') ? 'bg-brand-blue-50 text-brand-blue-700' : 'bg-brand-green-50 text-brand-green-700'
                  }`}>
                    {s.format}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">What to Expect</h2>
              <ul className="space-y-4">
                {WHAT_TO_EXPECT.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/gallery/image7.jpg"
                alt="Students in orientation session"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What to Bring */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">What to Bring</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['Government-issued photo ID', 'Social Security card or proof of eligibility', 'Proof of address (utility bill, lease)', 'Any prior transcripts or certifications'].map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-800 font-medium text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Attend Orientation?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">
            No registration required for weekly sessions. Walk-ins welcome, or call to confirm your spot.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
            >
              Contact Us
            </Link>
            <a
              href="tel:+13175551234"
              className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg inline-flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call to Schedule
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
