export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, Shield, Users, ClipboardList, CheckCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FERPA Portal | Elevate for Humanity',
  description: 'Family Educational Rights and Privacy Act compliance portal for authorized personnel.',
};

export default async function FERPAPortal() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/ferpa');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  // Check if user has FERPA access
  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Fetch FERPA metrics
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: activeEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: pendingRequests } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">FERPA Compliance Portal</h1>
          </div>
          <p className="text-blue-200">Welcome, {profile.full_name || 'FERPA Officer'}</p>
        </div>
      </section>
      
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalStudents ?? 0}</p>
                  <p className="text-slate-600 text-sm">Total Students</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeEnrollments ?? 0}</p>
                  <p className="text-slate-600 text-sm">Active Enrollments</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-brand-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingRequests ?? 0}</p>
                  <p className="text-slate-600 text-sm">Pending Requests</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/ferpa/requests" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <ClipboardList className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">View Requests</span>
              </Link>
              <Link href="/ferpa/audit" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <FileText className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">Audit Logs</span>
              </Link>
              <Link href="/ferpa/training" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <Shield className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">Training Materials</span>
              </Link>
              <Link href="/ferpa/reports" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <FileText className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">Generate Report</span>
              </Link>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/admin/dashboard" className="text-brand-blue-600 hover:underline text-sm">
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

