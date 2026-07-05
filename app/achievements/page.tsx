import { Metadata } from 'next';
import Link from 'next/link';
import { Award, TrendingUp, Users, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Achievements | Elevate for Humanity',
  description: 'Celebrating student milestones and achievements at Elevate for Humanity.',
};

export default function AchievementsPage() {
  const milestones = [
    { label: 'Programs Completed', value: '1,200+', icon: Award },
    { label: 'Credentials Earned', value: '2,500+', icon: CheckCircle },
    { label: 'Job Placements', value: '950+', icon: TrendingUp },
    { label: 'Active Students', value: '400+', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Student Achievements</h1>
          <p className="text-xl text-blue-100">Celebrating the milestones and successes of our students.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {milestones.map((m) => (
              <div key={m.label} className="text-center bg-brand-blue-50 rounded-xl p-6">
                <m.icon className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-brand-blue-700">{m.value}</p>
                <p className="text-sm text-gray-600">{m.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Graduates</h2>
          <p className="text-gray-600 mb-8">Our graduates are earning certifications and starting new careers.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { program: 'CNA', cohort: 'Spring 2024', count: 45 },
              { program: 'HVAC Technician', cohort: 'Spring 2024', count: 28 },
              { program: 'Barber Apprenticeship', cohort: 'Spring 2024', count: 32 },
            ].map((g) => (
              <div key={g.program} className="bg-slate-50 rounded-xl p-6">
                <Award className="w-8 h-8 text-brand-blue-600 mb-2" />
                <h3 className="font-bold text-gray-900">{g.program}</h3>
                <p className="text-gray-600 text-sm">{g.cohort} - {g.count} graduates</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Achievement Awaits</h2>
          <p className="text-gray-600 mb-8">Start your journey toward your own achievement.</p>
          <Link href="/apply" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">Apply Now</Link>
        </div>
      </section>
    </div>
  );
}
