import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Interview Prep,
  description: 'Get ready for your job interview with our free interview preparation resources and coaching.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Interview Preparation</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Get ready to ace your interview with our free resources, practice questions, and coaching.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Common Interview Questions', desc: 'Practice responses to frequently asked questions' },
              { title: 'Industry-Specific Prep', desc: 'Healthcare, trades, and hospitality interview guides' },
              { title: 'Dress for Success', desc: 'Professional attire guidelines by industry' },
              { title: 'Resume Tips', desc: 'How to showcase your training and credentials' },
              { title: 'Mock Interviews', desc: 'Schedule a practice interview with our career coaches' },
              { title: 'Follow-Up Strategies', desc: 'Email templates and best practices' },
            ].map((resource, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">{resource.title}</h3>
                <p className="text-slate-600 text-sm">{resource.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Practice Questions by Industry</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {['Healthcare', 'HVAC', 'Barbering/Cosmetology', 'CDL/Driving', 'Welding', 'Manufacturing'].map((industry, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4">
                  <p className="font-medium text-slate-900">{industry}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Practice?</h2>
            <p className="text-blue-100 mb-6">Schedule a free mock interview with one of our career coaches.</p>
            <Link href="/schedule-consultation" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Schedule Mock Interview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
