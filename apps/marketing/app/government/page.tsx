import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, FileCheck, Shield, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Government Partners',
  description: 'Workforce development solutions for government agencies, workforce boards, and WIOA programs.',
};

export default function GovernmentPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Government & Workforce Partners</h1>
          <p className="text-xl text-blue-100">Serving workforce boards, WIOA programs, and government agencies across Indiana.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Our Government Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Building2 className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">WIOA Title I Services</h3>
              <p className="text-slate-600 text-sm">Training and reporting workflows for programs that are individually listed or approved for applicable workforce funding. Participant eligibility and funding authorization are determined by the responsible workforce agency.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <BarChart3 className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Reporting & Analytics</h3>
              <p className="text-slate-600 text-sm">Real-time dashboards for enrollment, completion, placement rates, and performance metrics.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <FileCheck className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Compliance & Auditing</h3>
              <p className="text-slate-600 text-sm">Registered-apprenticeship and workforce documentation workflows support evidence collection, review, reporting, and audit preparation.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Users className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Participant Tracking</h3>
              <p className="text-slate-600 text-sm">Track configured enrollment, training, credential, and employment outcome records through authorized workflows.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Partner?</h2>
        <p className="text-slate-600 mb-6">Contact us to discuss your workforce development needs.</p>
        <Link href="/contact" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Contact Our Team</Link>
      </section>
    </div>
  );
}