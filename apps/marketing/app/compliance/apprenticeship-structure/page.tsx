import { Metadata } from 'next';
import Link from 'next/link';
import { Award, CheckCircle, Clock, Users, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apprenticeship Structure | Compliance',
  description: 'Learn about our DOL-registered apprenticeship program structure and requirements.',
};

export default function ApprenticeshipStructurePage() {
  const structure = [
    { hours: '2,000', label: 'Total Training Hours', desc: 'Combined on-the-job training and related technical instruction' },
    { hours: '1,500', label: 'On-the-Job Training', desc: 'Hands-on work experience at your host shop' },
    { hours: '500', label: 'Related Technical Instruction', desc: 'Classroom and online learning' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Compliance
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Apprenticeship Structure
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Our DOL-registered apprenticeship programs follow a structured approach combining hands-on training with classroom instruction to prepare you for licensure.
            </p>
          </div>
        </div>
      </section>

      {/* Program Structure */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Program Structure</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {structure.map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                <div className="text-4xl font-black text-brand-blue-600 mb-2">{item.hours}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.label}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Requirements</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-blue-600" />
                For Apprentices
              </h3>
              <ul className="space-y-3">
                {['Be 16 years or older', 'Have a high school diploma or GED', 'Pass a basic skills assessment', 'Find a licensed host shop', 'Complete required documentation'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-blue-600" />
                For Host Shops
              </h3>
              <ul className="space-y-3">
                {['Licensed barber or cosmetology shop', 'Willingness to mentor apprentices', 'DOL registered as a training site', 'Maintain required records', 'Pay apprentice wages'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Program Timeline</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Apply', desc: 'Submit application and documents' },
              { step: '2', title: 'Match', desc: 'Get matched with a host shop' },
              { step: '3', title: 'Train', desc: 'Complete 2,000 hours of training' },
              { step: '4', title: 'License', desc: 'Pass state exam and get licensed' },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">{s.step}</div>
                <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Start Your Apprenticeship?</h2>
          <p className="text-slate-600 mb-8">Apply today or contact us for more information.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/barber-apprenticeship" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Apply Now
            </Link>
            <Link href="/contact" className="inline-flex items-center border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
