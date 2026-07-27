import { Metadata } from 'next';
import Link from 'next/link';
import { UserPlus, ArrowLeft, User, Mail, Phone, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Add New Apprentice | Host Shop Portal',
  description: 'Add a new apprentice to your host shop.',
};

export default function NewApprenticePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/host-shop/dashboard/apprentices"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Apprentices
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Add New Apprentice</h1>
              <p className="text-sm text-slate-500">Register a new apprentice for your host shop</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <form className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="apprentice@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                  <option value="">Select a program</option>
                  <option value="barber">Barber Apprenticeship</option>
                  <option value="cosmetology">Cosmetology Apprenticeship</option>
                  <option value="esthetician">Esthetician Apprenticeship</option>
                  <option value="nail">Nail Technician Apprenticeship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-brand-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors"
                >
                  Add Apprentice
                </button>
                <Link
                  href="/host-shop/dashboard/apprentices"
                  className="px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
