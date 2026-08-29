import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Career Counseling,
  description: 'Get personalized career counseling to find the right training program and career path for your goals.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Career Counseling</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Get personalized guidance to find the right career path and training program for your goals.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">What is Career Counseling?</h2>
              <p className="text-slate-600 mb-6">Our career counselors work with you one-on-one to understand your strengths, interests, and career goals. Together, we'll find the right training program and career path.</p>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">During your session, we'll discuss:</h3>
                <ul className="space-y-3">
                  {['Your career goals and interests', 'Work experience and skills', 'Training program options', 'Funding and payment plans', 'Timeline and next steps'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                      <span className="w-2 h-2 bg-brand-blue-600 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Schedule Your Session</h3>
              <p className="text-slate-600 mb-6">Career counseling sessions are free for all applicants and students.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-600 text-sm">
                  <span className="font-bold">Duration:</span>
                  <span>30-60 minutes</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600 text-sm">
                  <span className="font-bold">Format:</span>
                  <span>Video call or phone</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600 text-sm">
                  <span className="font-bold">Cost:</span>
                  <span>Free</span>
                </div>
              </div>
              <Link href="/schedule-consultation" className="block w-full text-center bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors mt-6">
                Schedule Free Session
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
