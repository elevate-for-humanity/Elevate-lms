import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyPartnerContext } from '@/lib/partner/access';
import { getPartnerDashboardStats } from '@/lib/partner/students';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Download,
  GraduationCap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | Partner Portal | Elevate LMS',
  description: 'Partner training dashboard with real-time metrics.',
};

export default async function PartnerDashboardPage() {
  const ctx = await getMyPartnerContext();
  if (!ctx?.user) redirect('/partners/login');

  const shopIds = (ctx.shops || []).map((s: any) => s.shop_id || s.id);
  const stats = await getPartnerDashboardStats(shopIds);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Training metrics for your organization
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Active Students</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeStudents}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Total Enrollments</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEnrollments}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Completed</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completedEnrollments}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Completion Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Certificates Issued</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.certificatesIssued}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-sm text-gray-500">Avg Progress</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.avgProgress}%</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/partners/students"
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  View Students
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  See individual student progress and course enrollment
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </Link>

          <Link
            href="/partners/attendance"
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Attendance
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track student attendance and hours
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </Link>

          <a
            href="/api/partner/exports/completions"
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Export Data
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Download completion report as CSV
                </p>
              </div>
              <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
