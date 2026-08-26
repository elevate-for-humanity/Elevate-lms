export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, Shield, Users, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

export const metadata: Metadata = {
  title: 'FERPA Portal | Elevate for Humanity',
  description: 'Family Educational Rights and Privacy Act compliance portal for authorized personnel.',
};

export default async function FERPAPortal() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect('/login?redirect=/ferpa');
  }

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    redirect('/login?redirect=/ferpa');
  }

  if (!user) {
    redirect('/login?redirect=/ferpa');
  }

  let profile = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  } catch {
    redirect('/login?redirect=/ferpa');
  }

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/login');
  }

  let totalStudents = 0;
  let activeEnrollments = 0;
  let pendingRequests = 0;

  try {
    const [{ count: ts }, { count: ae }, { count: pr }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    totalStudents = ts ?? 0;
    activeEnrollments = ae ?? 0;
    pendingRequests = pr ?? 0;
  } catch {
    // Metrics load failed - page still renders with zeros
  }

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
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
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
                  <p className="text-2xl font-bold text-slate-900">{activeEnrollments}</p>
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
                  <p className="text-2xl font-bold text-slate-900">{pendingRequests}</p>
                  <p className="text-slate-600 text-sm">Pending Requests</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/ferpa" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <ClipboardList className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">View Requests</span>
              </Link>
              <Link href="/ferpa" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <FileText className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">Audit Logs</span>
              </Link>
              <Link href="/ferpa" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <Shield className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">Training Materials</span>
              </Link>
              <Link href="/ferpa" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <FileText className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-slate-900">Generate Report</span>
              </Link>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <a href={getAdminUrl("/portals")} className="text-brand-blue-600 hover:underline text-sm">
              ← Back to Admin Dashboard
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

