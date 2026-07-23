import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Distance Learning Solutions',
  description: 'Online and hybrid workforce training programs for remote learners.',
};

export default function DistanceLearningPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Distance Learning</h1>
          <p className="text-xl text-blue-100">Online and hybrid workforce training programs.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learn From Anywhere</h2>
          <p className="text-gray-600 mb-8">
            Elevate for Humanity offers online and hybrid training options for students who need flexibility.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Online Theory', desc: 'Complete classroom instruction from anywhere.' },
              { title: 'Hybrid Format', desc: 'Mix of online learning and in-person labs.' },
              { title: 'Flexible Scheduling', desc: 'Evening and weekend options for working adults.' },
              { title: 'Same Credentials', desc: 'Earn the same industry-recognized certifications.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-slate-50 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/programs" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">
            View Programs
          </Link>
        </div>
      </section>
    </div>
  );
}
