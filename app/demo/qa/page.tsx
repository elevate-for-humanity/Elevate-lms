import { Metadata } from 'next';
import Link from 'next/link';
import { DemoQAClient } from './DemoQAClient';

export const metadata: Metadata = {
  title: 'Demo QA | Elevate LMS',
  description: 'Quality assurance page for demo environment verification',
  robots: { index: false, follow: false },
};

export default function DemoQAPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4">
            <h1 className="text-xl font-bold">Demo QA Dashboard</h1>
            <p className="text-slate-400 text-sm">Verify demo environment state and test tour flows</p>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <DemoQAClient />
            </section>
            
            {/* Tour Links */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Start Tours</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Link
                  href="/demo/tour/institution_admin?step=1"
                  className="block p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition"
                >
                  <div className="font-semibold text-green-900">Institution Admin Tour</div>
                  <div className="text-sm text-green-700">7 steps • Admin dashboard flow</div>
                </Link>
                <Link
                  href="/demo/tour/partner_employer?step=1"
                  className="block p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
                >
                  <div className="font-semibold text-purple-900">Partner Employer Tour</div>
                  <div className="text-sm text-blue-700">6 steps • Employer portal flow</div>
                </Link>
                <Link
                  href="/demo/tour/workforce_program?step=1"
                  className="block p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
                >
                  <div className="font-semibold text-blue-900">Workforce Program Tour</div>
                  <div className="text-sm text-blue-700">7 steps • Full platform flow</div>
                </Link>
              </div>
            </section>
            
            {/* Direct Page Links */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Direct Page Access</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link href="/admin/dashboard" className="text-blue-600 hover:underline text-sm">
                  → Admin Dashboard
                </Link>
                <Link href="/admin/applications" className="text-blue-600 hover:underline text-sm">
                  → Applications
                </Link>
                <Link href="/admin/enrollments" className="text-blue-600 hover:underline text-sm">
                  → Enrollments
                </Link>
                <Link href="/admin/compliance" className="text-blue-600 hover:underline text-sm">
                  → Compliance
                </Link>
                <Link href="/admin/audit-logs" className="text-blue-600 hover:underline text-sm">
                  → Audit Logs
                </Link>
                <Link href="/admin/reports" className="text-blue-600 hover:underline text-sm">
                  → Reports
                </Link>
                <Link href="/employer/dashboard" className="text-blue-600 hover:underline text-sm">
                  → Employer Dashboard
                </Link>
                <Link href="/lms/dashboard" className="text-blue-600 hover:underline text-sm">
                  → LMS Dashboard
                </Link>
              </div>
            </section>
            
            {/* Store Links */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Store Checkout Pages</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link href="/store/licenses/managed-platform" className="text-blue-600 hover:underline text-sm">
                  → Managed Platform License
                </Link>
                <Link href="/store/licenses/pro-license" className="text-blue-600 hover:underline text-sm">
                  → Pro License
                </Link>
                <Link href="/store/licenses/enterprise-license" className="text-blue-600 hover:underline text-sm">
                  → Enterprise License
                </Link>
                <Link href="/store/licenses/source-use" className="text-blue-600 hover:underline text-sm">
                  → Source-Use License
                </Link>
              </div>
            </section>
            
            {/* Back Link */}
            <div className="pt-4 border-t border-slate-200">
              <Link href="/demo" className="text-slate-600 hover:text-slate-900 text-sm">
                ← Back to Demo Hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
