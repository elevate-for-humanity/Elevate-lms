import { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  User,
  TrendingUp,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function HostShopHoursPage() {
  // Demo data
  const pendingHours = [
    { id: 1, apprenticeName: 'Marcus Johnson', date: 'Nov 15, 2024', hours: 8, status: 'pending', notes: 'Standard shift' },
    { id: 2, apprenticeName: 'DeShawn Williams', date: 'Nov 14, 2024', hours: 7.5, status: 'pending', notes: 'Including 30min lunch' },
    { id: 3, apprenticeName: 'Terrence Brown', date: 'Nov 14, 2024', hours: 4, status: 'pending', notes: 'Half day - appointment' },
    { id: 4, apprenticeName: 'Jaylen Davis', date: 'Nov 13, 2024', hours: 8, status: 'approved', notes: 'Full shift' },
  ];

  const weeklyStats = [
    { label: 'Total Hours', value: 68, change: '+12%', trend: 'up' },
    { label: 'Pending Review', value: 19.5, change: '-3', trend: 'down' },
    { label: 'Approved', value: 48.5, change: '+15', trend: 'up' },
    { label: 'Rejected', value: 0, change: '0', trend: 'neutral' },
  ];

  const monthlyHours = [
    { apprentice: 'Marcus J.', hours: 45, approved: 42, pending: 3 },
    { apprentice: 'DeShawn W.', hours: 38, approved: 35, pending: 3 },
    { apprentice: 'Terrence B.', hours: 28, approved: 24, pending: 4 },
    { apprentice: 'Jaylen D.', hours: 52, approved: 52, pending: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Host Shop</p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search hours..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-brand-blue-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Hours & Attendance</h1>
          <p className="text-slate-500">Review and approve apprentice work hours</p>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {weeklyStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">{stat.label}</p>
                {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}h</p>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-slate-400'}`}>
                {stat.change} this week
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pending Hours */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Pending Review</h2>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                  {pendingHours.filter(h => h.status === 'pending').length} Pending
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {pendingHours.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-brand-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{entry.apprenticeName}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {entry.date} • {entry.hours} hours
                          </p>
                          {entry.notes && (
                            <p className="text-xs text-slate-400 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.status === 'pending' ? (
                          <>
                            <button className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition">
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 transition">
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Approved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Monthly Summary</h2>
                <select className="text-sm bg-slate-100 rounded-lg px-3 py-1 border-0">
                  <option>November 2024</option>
                  <option>October 2024</option>
                </select>
              </div>

              <div className="space-y-4">
                {monthlyHours.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">{item.apprentice}</p>
                      <p className="text-sm font-semibold text-brand-blue-600">{item.hours}h</p>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-blue-500 rounded-full"
                        style={{ width: `${(item.approved / item.hours) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>{item.approved}h approved</span>
                      {item.pending > 0 && <span className="text-amber-600">{item.pending}h pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">Attention Needed</h3>
              </div>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  3 entries missing supervisor verification
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  1 apprentice approaching overtime
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
