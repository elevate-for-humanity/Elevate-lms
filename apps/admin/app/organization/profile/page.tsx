import { Metadata } from 'next';
import { Building2, MapPin, Phone, Mail, Globe, Calendar, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Organization Profile | Elevate for Humanity',
  description: 'Organization profile and settings.',
};

export default function OrganizationProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Organization', href: '/organization' }, { label: 'Profile' }]} />
          <div className="mt-6 flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold text-purple-600">EFH</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Elevate for Humanity</h1>
              <p className="text-blue-200">Career & Technical Training Institute</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Organization Information</h2>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-slate-500">Legal Name</dt>
                  <dd className="font-medium">Elevate for Humanity Technical and Career Institute</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-slate-500">Location</dt>
                  <dd className="font-medium">Indianapolis, Indiana</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-slate-500">Phone</dt>
                  <dd className="font-medium">(317) 314-3757</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-slate-500">Email</dt>
                  <dd className="font-medium">info@elevateforhumanity.org</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-slate-500">Website</dt>
                  <dd className="font-medium">www.elevateforhumanity.org</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">5,000+</div>
                <div className="text-sm text-slate-600">Students Trained</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">200+</div>
                <div className="text-sm text-slate-600">Partner Employers</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">92%</div>
                <div className="text-sm text-slate-600">Completion Rate</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">50+</div>
                <div className="text-sm text-slate-600">Programs</div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Certifications & Approvals</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                DOL Registered Apprenticeship
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                ETPL Approved Training Provider
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                WIOA Partner
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                State of Indiana Approved
              </li>
            </ul>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/organization/edit" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                Edit Organization Details
              </a>
              <a href="/settings" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                Platform Settings
              </a>
              <a href="/integrations" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                Integrations
              </a>
              <a href="/api-keys" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                API Keys
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
