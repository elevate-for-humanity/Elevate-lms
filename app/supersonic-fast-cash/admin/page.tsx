'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  pendingReturns: number;
  completedReturns: number;
  totalRefunds: number;
  todayAppointments: number;
  weeklyRevenue: number;
}



export default function SupersonicAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    pendingReturns: 0,
    completedReturns: 0,
    totalRefunds: 0,
    todayAppointments: 0,
    weeklyRevenue: 0,
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, clientsRes] = await Promise.all([
        fetch('/api/supersonic-fast-cash/stats'),
        fetch('/api/supersonic-fast-cash/clients?limit=5'),
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setRecentClients(clientsData.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Admin" }]} />
      </div>
{/* Header */}
      <div className="bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Supersonic Fast Cash Admin</h1>
              <p className="text-orange-100 mt-1">Tax preparation management dashboard</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <Users className="w-8 h-8 text-brand-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalClients}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.pendingReturns}</div>
            <div className="text-sm text-gray-600">Pending Returns</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.completedReturns}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">${(stats.totalRefunds / 1000).toFixed(0)}K</div>
            <div className="text-sm text-gray-600">Total Refunds</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <Calendar className="w-8 h-8 text-brand-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</div>
            <div className="text-sm text-gray-600">Today's Appts</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">${(stats.weeklyRevenue / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-600">Weekly Revenue</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/supersonic-fast-cash/admin/client-intake"
                className="flex items-center justify-between p-4 bg-brand-blue-50 rounded-lg hover:bg-brand-blue-100 transition"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-brand-blue-600" />
                  <span className="font-medium text-gray-900">Client Intake</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/supersonic-fast-cash/book-appointment"
                className="flex items-center justify-between p-4 bg-brand-blue-50 rounded-lg hover:bg-brand-blue-100 transition"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-brand-blue-600" />
                  <span className="font-medium text-gray-900">Book Appointment</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/supersonic-fast-cash/calculator"
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Refund Calculator</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/supersonic-fast-cash/upload-documents"
                className="flex items-center justify-between p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Upload Documents</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Recent Clients */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Clients</h2>
              <Link
                href="/supersonic-fast-cash/admin/client-intake"
                className="text-sm text-orange-600 hover:underline"
              >
                View All →
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : recentClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Name</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClients.map((client) => (
                      <tr key={client.id} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          <div className="font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            client.status === 'completed' ? 'bg-green-100 text-green-800' :
                            client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Link
                            href={`/supersonic-fast-cash/admin/client-intake?id=${client.id}`}
                            className="text-orange-600 hover:underline text-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No clients yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Tools Section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tax Tools</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/supersonic-fast-cash/tax-tools"
              className="bg-white rounded-xl p-6 shadow-sm border hover:border-orange-300 transition"
            >
              <FileText className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-bold text-gray-900">Tax Tools</h3>
              <p className="text-sm text-gray-600">W-2, 1099, deduction calculators</p>
            </Link>
            <Link
              href="/supersonic-fast-cash/diy-taxes"
              className="bg-white rounded-xl p-6 shadow-sm border hover:border-orange-300 transition"
            >
              <DollarSign className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-gray-900">DIY Taxes</h3>
              <p className="text-sm text-gray-600">Self-service tax filing</p>
            </Link>
            <Link
              href="/supersonic-fast-cash/training"
              className="bg-white rounded-xl p-6 shadow-sm border hover:border-orange-300 transition"
            >
              <TrendingUp className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900">Training</h3>
              <p className="text-sm text-gray-600">Tax preparer certification</p>
            </Link>
            <Link
              href="/supersonic-fast-cash/sub-office-agreement"
              className="bg-white rounded-xl p-6 shadow-sm border hover:border-orange-300 transition"
            >
              <Users className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900">Sub-Office</h3>
              <p className="text-sm text-gray-600">Partner with us</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
