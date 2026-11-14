import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'View upcoming events, orientations, and training schedules at Elevate for Humanity.',
};

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Training Schedule</h1>
          <p className="text-xl text-blue-200">
            View upcoming orientations, classes, and training sessions
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-brand-blue-600 font-semibold mb-2">Upcoming</div>
              <h3 className="text-xl font-bold mb-4">Orientation Sessions</h3>
              <p className="text-gray-600 mb-4">
                Weekly orientation sessions for new students and program participants.
              </p>
              <Link href="/schedule/meeting" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                View Schedule →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-brand-blue-600 font-semibold mb-2">Weekly</div>
              <h3 className="text-xl font-bold mb-4">Class Schedule</h3>
              <p className="text-gray-600 mb-4">
                Browse our weekly class schedules for all programs.
              </p>
              <Link href="https://app.elevateforhumanity.org/lms/schedule" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                View Schedule →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-brand-blue-600 font-semibold mb-2">Events</div>
              <h3 className="text-xl font-bold mb-4">Upcoming Events</h3>
              <p className="text-gray-600 mb-4">
                Career fairs, employer meetups, and special events.
              </p>
              <Link href="/events" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                View Events →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Ready to Get Started?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition">
              Apply Now
            </Link>
            <Link href="/contact" className="border-2 border-brand-blue-600 text-brand-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-50 transition">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
