import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Job Ready Indiana Partnership | Elevate for Humanity',
  description: 'Partner with Elevate through Job Ready Indiana to provide workforce training for eligible participants.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Workforce Partnership</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Job Ready Indiana Partnership</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Partner with Elevate to provide Job Ready Indiana funded training to eligible participants across Indiana.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">About Job Ready Indiana</h2>
              <p className="text-slate-600 mb-4">Job Ready Indiana is a state-funded workforce development program that helps eligible Hoosiers gain skills for in-demand careers. Partners play a crucial role in delivering training to participants.</p>
              <p className="text-slate-600 mb-6">Elevate is an approved Job Ready Indiana training provider, offering programs in healthcare, trades, and skilled crafts.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Partnership Benefits</h3>
              <ul className="space-y-3">
                {['Access to motivated participants', 'Funding for participant training', 'Streamlined enrollment process', 'Reporting and compliance support', 'Dedicated partnership manager'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="text-green-600 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Eligible Programs</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {['Healthcare Programs', 'HVAC Technician', 'Electrical', 'Welding', 'Commercial Driver License', 'Barbering'].map((program, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="font-medium text-slate-900">{program}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Become a JRI Partner</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">Join our network of workforce partners helping Hoosiers gain skills for meaningful careers.</p>
            <Link href="/partners/apply" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Apply for Partnership
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
