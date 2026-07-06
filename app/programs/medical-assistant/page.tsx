import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, Stethoscope, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Medical Assistant Training | Elevate for Humanity',
  description: 'Become a certified Medical Assistant. Clinical and administrative skills for healthcare settings. WIOA funding available.',
};

export default function MedicalAssistantPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-teal-700 to-teal-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <span className="bg-teal-500 text-white text-sm px-3 py-1 rounded-full">Healthcare</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Medical Assistant</h1>
          <p className="text-xl text-teal-100 max-w-2xl mb-6">Clinical and administrative skills for physician offices, clinics, and hospitals. Start your healthcare career in 12-16 weeks.</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Clock className="w-4 h-4" />12-16 weeks</span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Award className="w-4 h-4" />Certification Prep</span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">WIOA Funding</span>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 mb-6">Medical assistants are vital members of healthcare teams, performing both clinical and administrative duties. This program prepares you for both aspects of the role.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Stethoscope className="w-5 h-5 text-teal-600" />Clinical Skills</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Vital signs and patient assessment</li>
                <li>• Phlebotomy and specimen collection</li>
                <li>• EKG and basic lab tests</li>
                <li>• Injections and medications</li>
                <li>• Patient preparation and education</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-bold mb-4">Administrative Skills</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Medical records management</li>
                <li>• Insurance billing and coding</li>
                <li>• Appointment scheduling</li>
                <li>• Patient check-in and registration</li>
                <li>• Medical office procedures</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-teal-50 rounded-xl"><div className="text-3xl font-bold text-teal-600">$35K+</div><div className="text-sm text-slate-600">Starting Salary</div></div>
            <div className="p-6 bg-teal-50 rounded-xl"><div className="text-3xl font-bold text-teal-600">12-16</div><div className="text-sm text-slate-600">Weeks</div></div>
            <div className="p-6 bg-green-50 rounded-xl"><div className="text-3xl font-bold text-green-600">High</div><div className="text-sm text-slate-600">Job Growth</div></div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-br from-teal-700 to-teal-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your Healthcare Career</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">Check Eligibility</Link>
          <Link href="/contact" className="bg-white text-teal-700 font-bold py-4 px-8 rounded-lg hover:bg-teal-50">Contact an Advisor</Link>
        </div>
      </section>
    </div>
  );
}
