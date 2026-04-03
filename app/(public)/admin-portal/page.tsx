import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, Settings, BarChart3, Lock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Portal | Elevate For Humanity',
  description: 'System administration, user management, and platform configuration for Elevate for Humanity.',
};

export default function AdminPortalPublicPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin Portal' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-brand-blue-400" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Admin Portal</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Comprehensive platform management for administrators. Manage users, programs, compliance, and system settings.
          </p>
          <Link
            href="/login?redirect=/admin"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-blue-700 transition-colors"
          >
            Sign In to Admin Portal
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6">
              <Users className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">User Management</h3>
              <p className="text-slate-600">Manage students, instructors, employers, and partner accounts.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <BarChart3 className="w-10 h-10 text-brand-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Analytics & Reports</h3>
              <p className="text-slate-600">Track enrollments, completions, placements, and program performance.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <Settings className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">System Configuration</h3>
              <p className="text-slate-600">Configure programs, courses, certifications, and platform settings.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <Shield className="w-10 h-10 text-brand-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Compliance Management</h3>
              <p className="text-slate-600">WIOA reporting, audit trails, and regulatory compliance tools.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <Lock className="w-10 h-10 text-amber-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Security & Access</h3>
              <p className="text-slate-600">Role-based access control, audit logs, and security settings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Admin Access?</h2>
          <p className="text-white mb-6">Contact your system administrator to request access credentials.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
