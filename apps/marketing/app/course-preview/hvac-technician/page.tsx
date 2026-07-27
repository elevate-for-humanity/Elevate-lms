import { Metadata } from 'next';
import Link from 'next/link';
import { Thermometer, DollarSign, Clock, Award, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HVAC Technician Course Preview',
  description: 'Preview our HVAC technician training course. Learn heating, ventilation, air conditioning, and refrigeration systems.',
};

export default function HVACCoursePreviewPage() {
  const skills = ['Refrigeration Systems', 'Electrical Controls', 'Heat Pumps', 'Gas Furnaces', 'AC Systems', 'Troubleshooting'];
  
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
              <Thermometer className="w-4 h-4" />
              Course Preview
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              HVAC Technician Training
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Learn to install, maintain, and repair heating, ventilation, air conditioning, and refrigeration systems. Industry certification included.
            </p>
            <Link href="/programs" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Enroll Now
            </Link>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">200</div>
              <div className="text-sm text-slate-500">Training Hours</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <DollarSign className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">$4,980</div>
              <div className="text-sm text-slate-500">Total Cost</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <Award className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">EPA 608</div>
              <div className="text-sm text-slate-500">Certification</div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">What You'll Learn</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div key={skill} className="flex items-center gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">{skill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Start?</h2>
          <p className="text-slate-600 mb-8">Enrollment open. Funding available for qualifying students.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/check-eligibility" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Check Eligibility
            </Link>
            <Link href="/programs" className="inline-flex items-center border-2 border-slate-300 hover:bg-white text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              View All Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}