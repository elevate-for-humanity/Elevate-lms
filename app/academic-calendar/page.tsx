import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, BookOpen, GraduationCap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Academic Calendar | Elevate For Humanity',
  description: 'View important dates, program schedules, and enrollment deadlines.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/academic-calendar',
  },
};

export default function AcademicCalendarPage() {
  const currentYear = new Date().getFullYear();
  
  const terms = [
    {
      name: 'Winter Term',
      startDate: `January 6, ${currentYear}`,
      endDate: `March 28, ${currentYear}`,
      enrollmentDeadline: `December 20, ${currentYear - 1}`,
    },
    {
      name: 'Spring Term',
      startDate: `April 7, ${currentYear}`,
      endDate: `June 27, ${currentYear}`,
      enrollmentDeadline: `March 21, ${currentYear}`,
    },
    {
      name: 'Summer Term',
      startDate: `July 7, ${currentYear}`,
      endDate: `September 26, ${currentYear}`,
      enrollmentDeadline: `June 20, ${currentYear}`,
    },
    {
      name: 'Fall Term',
      startDate: `October 6, ${currentYear}`,
      endDate: `December 19, ${currentYear}`,
      enrollmentDeadline: `September 19, ${currentYear}`,
    },
  ];

  const holidays = [
    { name: 'New Year\'s Day', date: `January 1, ${currentYear}` },
    { name: 'Martin Luther King Jr. Day', date: `January 20, ${currentYear}` },
    { name: 'Presidents\' Day', date: `February 17, ${currentYear}` },
    { name: 'Memorial Day', date: `May 26, ${currentYear}` },
    { name: 'Independence Day', date: `July 4, ${currentYear}` },
    { name: 'Labor Day', date: `September 1, ${currentYear}` },
    { name: 'Thanksgiving', date: `November 27-28, ${currentYear}` },
    { name: 'Winter Break', date: `December 23 - January 3, ${currentYear + 1}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Academic Calendar' }]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[200px] sm:h-[280px] md:h-[340px]">
        <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Academic calendar and important dates" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Title */}
      <section className="bg-brand-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Academic Calendar</h1>
          <p className="text-xl text-brand-blue-100">
            Important dates and schedules for {currentYear}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-blue-600" />
            {currentYear} Terms
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {terms.map((term) => (
              <div key={term.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{term.name}</h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-green-600" />
                    <span><strong>Start:</strong> {term.startDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-red-600" />
                    <span><strong>End:</strong> {term.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-orange-600" />
                    <span><strong>Enrollment Deadline:</strong> {term.enrollmentDeadline}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Holidays */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-blue-600" />
            Holidays & Breaks
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Holiday</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holidays.map((holiday) => (
                  <tr key={holiday.name}>
                    <td className="px-6 py-4 text-gray-900">{holiday.name}</td>
                    <td className="px-6 py-4 text-gray-600">{holiday.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-blue-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Enroll?</h2>
          <p className="text-gray-600 mb-6">
            Start your career training journey today. Most programs are FREE through WIOA funding.
          </p>
          <Link
            href="/apply"
            className="inline-block px-8 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            Apply Now
          </Link>
        </section>
      </div>
    </div>
  );
}
