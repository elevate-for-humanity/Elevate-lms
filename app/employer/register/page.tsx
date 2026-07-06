import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, Briefcase, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employer Registration | Elevate for Humanity',
  description: 'Register as an employer partner to access talent pipelines, apprenticeship programs, and workforce services.',
};

export default function EmployerRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-purple-900 to-purple-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Employer Registration</h1>
          <p className="text-purple-200">Partner with Elevate for Humanity to build your workforce.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Partner Benefits</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-slate-700">Access pre-screened candidates</span></div>
              <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-slate-700">Apprenticeship programs</span></div>
              <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-slate-700">Work Opportunity Tax Credits</span></div>
              <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-slate-700">Free recruiting services</span></div>
            </div>
            <form className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Company Name</label><input type="text" className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Contact Email</label><input type="email" className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" className="w-full border rounded-lg px-4 py-2" /></div>
              <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700">Register</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
