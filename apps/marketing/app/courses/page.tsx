import { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Explore our training courses in healthcare, skilled trades, technology, and more. Short courses and certification prep programs.',
};

const courses = [
  { title: 'CPR / First Aid', provider: 'HSI', duration: '1 day', price: '$65-85' },
  { title: 'ServSafe Food Handler', provider: 'NRF', duration: '4 hours', price: '$25' },
  { title: 'OSHA 10-Hour', provider: 'General Industry', duration: '2 days', price: '$100' },
  { title: 'Forklift Certification', provider: 'OSHA', duration: '1 day', price: '$150' },
];

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Short Courses & Certifications</h1>
          <p className="text-xl text-blue-100">Quick training programs and industry certifications to boost your skills and credentials.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Available Courses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4">Provider: {course.provider}</p>
                <div className="flex gap-4 text-sm text-slate-600 mb-4">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{course.price}</span>
                </div>
                <Link href="/contact" className="text-brand-blue-600 font-semibold hover:underline">Learn More →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
