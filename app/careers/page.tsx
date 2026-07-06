import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Users, Award } from 'lucide-react';
export const metadata: Metadata = { 
  title: 'Career Training Programs | Elevate for Humanity',
  description: 'Job-ready skills training programs with WIOA funding available. Healthcare, skilled trades, IT certifications. Start your career journey today.',
  keywords: ['career training', 'workforce development', 'job training', 'WIOA training', 'healthcare careers', 'skilled trades', 'employment'],
};
export default function CareersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Career Training</h1>
          <p className="text-blue-200">Job-ready skills training programs with WIOA funding available.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-6">Start Your Career Journey</h2>
          <p className="text-slate-600 mb-6">Explore our workforce training programs designed to help you get hired.</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow"><Award className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" /><h3 className="font-bold">Healthcare</h3></div>
            <div className="bg-white rounded-xl p-6 shadow"><Award className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" /><h3 className="font-bold">Skilled Trades</h3></div>
            <div className="bg-white rounded-xl p-6 shadow"><Award className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" /><h3 className="font-bold">Technology</h3></div>
          </div>
          <Link href="/programs" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700">View All Programs</Link>
        </div>
      </section>
    </div>
  );
}
