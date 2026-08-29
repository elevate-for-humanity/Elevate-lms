import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Employer Onboarding,
  description: 'Welcome to the Elevate employer partnership program. Get started hiring trained talent.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Employer Partner Onboarding</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Thank you for partnering with Elevate! Follow these steps to start hiring trained graduates.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Onboarding Steps</h2>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Complete Company Profile', desc: 'Add your company information, logo, and hiring needs.' },
                { step: '2', title: 'Review Partnership Agreement', desc: 'Sign the employer partnership agreement.' },
                { step: '3', title: 'Define Job Openings', desc: 'Create job listings for the positions you need to fill.' },
                { step: '4', title: 'Set Hiring Criteria', desc: 'Define qualifications and preferences for candidates.' },
                { step: '5', title: 'Schedule Employer Orientation', desc: 'Meet with our employer success team.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-slate-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Employer Resources</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/employer/dashboard" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Employer Dashboard</p>
                <p className="text-slate-500 text-sm">Manage postings and candidates</p>
              </Link>
              <Link href="https://app.elevateforhumanity.org/employer/jobs" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Post a Job</p>
                <p className="text-slate-500 text-sm">Create a new job listing</p>
              </Link>
              <Link href="/employer/handbook" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Employer Handbook</p>
                <p className="text-slate-500 text-sm">Partnership guidelines</p>
              </Link>
              <Link href="/contact" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Get Support</p>
                <p className="text-slate-500 text-sm">Contact your employer success manager</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
