'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Briefcase, Calendar } from 'lucide-react';

export default function NewApprenticePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    program: 'barber',
    employer: '',
    startDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Apprentice creation - Coming soon!');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/host-shop/dashboard/apprentices" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Apprentices
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Add New Apprentice</h1>
          <p className="text-slate-600 mb-8">Enter the apprentice details below</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Enter full name" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="email@example.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="(317) 555-0123" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option value="barber">Barber Apprenticeship</option>
                    <option value="cosmetology">Cosmetology</option>
                    <option value="manicurist">Manicurist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Employer</label>
              <input type="text" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Host shop or employer name" />
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/host-shop/dashboard/apprentices" className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold text-center hover:bg-slate-50">Cancel</Link>
              <button type="submit" className="flex-1 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700">Add Apprentice</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
