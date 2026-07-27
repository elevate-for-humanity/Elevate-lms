import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, MapPin, Users, Phone, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employer Directory | Elevate',
  description: 'Connect with our employer partners hiring graduates from our training programs.',
};

export default function EmployerDirectoryPage() {
  const employers = [
    { name: 'Healthcare Plus', location: 'Indianapolis, IN', type: 'Healthcare', hires: 'Medical Assistants, Phlebotomists' },
    { name: 'Cool Air Solutions', location: 'Carmel, IN', type: 'Skilled Trades', hires: 'HVAC Technicians' },
    { name: 'Midwest Logistics', location: 'Greenfield, IN', type: 'Transportation', hires: 'CDL Drivers' },
    { name: 'Elevate Salon', location: 'Indianapolis, IN', type: 'Beauty', hires: 'Barbers, Cosmetologists' },
    { name: 'Community Pharmacy', location: 'Noblesville, IN', type: 'Healthcare', hires: 'Pharmacy Technicians' },
    { name: 'Regional Medical Center', location: 'Fishers, IN', type: 'Healthcare', hires: 'Medical Assistants, EKG Techs' },
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
              <Building2 className="w-4 h-4" />
              Employer Partners
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Employer Directory
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Connect with employers actively hiring graduates from our training programs. Find your next career opportunity.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employers..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-red-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Employers */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4">
            {employers.map((employer) => (
              <div key={employer.name} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md hover:border-brand-blue-200 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{employer.name}</h3>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{employer.type}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {employer.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Hires: {employer.hires}
                      </div>
                    </div>
                  </div>
                  <Link href="/workforce-board/employment" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
                    View Jobs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Are You an Employer?</h2>
          <p className="text-slate-600 mb-8">Join our network of employer partners to hire trained graduates.</p>
          <Link href="/apply/employer" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
            Become a Partner
          </Link>
        </div>
      </section>
    </div>
  );
}
