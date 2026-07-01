import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  Plus,
  Search,
  Filter,
  ChevronRight,
  User,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Award,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

// This page needs auth - redirect for now
export default function HostShopApprenticesPage() {
  // Demo apprentices data
  const apprentices = [
    { 
      id: 1,
      name: 'Marcus Johnson',
      email: 'marcus.j@email.com',
      phone: '(317) 555-0123',
      program: 'Barber Apprenticeship',
      progress: 68,
      hoursCompleted: 1350,
      hoursRequired: 2000,
      lastClockIn: '2 days ago',
      status: 'active',
      performance: 'exceeding',
      photo: null,
      startDate: 'Mar 2023',
      employer: 'Elevate Barbershop',
    },
    { 
      id: 2,
      name: 'DeShawn Williams',
      email: 'deshawn.w@email.com',
      phone: '(317) 555-0124',
      program: 'Barber Apprenticeship',
      progress: 45,
      hoursCompleted: 890,
      hoursRequired: 2000,
      lastClockIn: 'Today',
      status: 'active',
      performance: 'on-track',
      photo: null,
      startDate: 'Aug 2023',
      employer: 'Elevate Barbershop',
    },
    { 
      id: 3,
      name: 'Terrence Brown',
      email: 'terrence.b@email.com',
      phone: '(317) 555-0125',
      program: 'Barber Apprenticeship',
      progress: 32,
      hoursCompleted: 640,
      hoursRequired: 2000,
      lastClockIn: '1 week ago',
      status: 'active',
      performance: 'needs-improvement',
      photo: null,
      startDate: 'Jan 2024',
      employer: 'Elevate Barbershop',
    },
    { 
      id: 4,
      name: 'Jaylen Davis',
      email: 'jaylen.d@email.com',
      phone: '(317) 555-0126',
      program: 'Cosmetology',
      progress: 78,
      hoursCompleted: 1560,
      hoursRequired: 2000,
      lastClockIn: '3 days ago',
      status: 'active',
      performance: 'exceeding',
      photo: null,
      startDate: 'May 2022',
      employer: 'Elevate Barbershop',
    },
    { 
      id: 5,
      name: 'Michael Thompson',
      email: 'michael.t@email.com',
      phone: '(317) 555-0127',
      program: 'Barber Apprenticeship',
      progress: 100,
      hoursCompleted: 2040,
      hoursRequired: 2000,
      lastClockIn: 'Completed',
      status: 'graduated',
      performance: 'exceeding',
      photo: null,
      startDate: 'Jan 2022',
      endDate: 'Dec 2023',
      employer: 'Elevate Barbershop',
    },
  ];

  const statusColors = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
    graduated: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Graduated' },
    inactive: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Inactive' },
  };

  const performanceIcons = {
    exceeding: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Exceeding' },
    'on-track': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'On Track' },
    'needs-improvement': { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Needs Improvement' },
  };

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

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search apprentices..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-brand-blue-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard/apprentices/new" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
                <Plus className="w-4 h-4" />
                Add Apprentice
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Apprentices</h1>
          <p className="text-slate-500">Manage your apprentices and track their progress</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-xl text-sm font-medium">
                All (5)
              </button>
              <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium">
                Active (4)
              </button>
              <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium">
                Pending (0)
              </button>
              <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium">
                Graduated (1)
              </button>
            </div>
            <div className="flex-1" />
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Apprentice Cards Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {apprentices.map((apprentice) => {
            const statusStyle = statusColors[apprentice.status as keyof typeof statusColors];
            const perfStyle = performanceIcons[apprentice.performance as keyof typeof performanceIcons];
            const PerfIcon = perfStyle.icon;
            
            return (
              <div key={apprentice.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-brand-blue-200 transition-all">
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-blue-100 to-brand-blue-200 rounded-2xl flex items-center justify-center">
                      {apprentice.photo ? (
                        <img src={apprentice.photo} alt={apprentice.name} className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-brand-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 truncate">{apprentice.name}</h3>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{apprentice.program}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${perfStyle.bg} ${perfStyle.color}`}>
                          <PerfIcon className="w-3 h-3 inline mr-1" />
                          {perfStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Hours</p>
                      <p className="text-lg font-bold text-slate-900">
                        {apprentice.hoursCompleted.toLocaleString()}
                        <span className="text-sm font-normal text-slate-400"> / {apprentice.hoursRequired.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Progress</p>
                      <p className="text-lg font-bold text-brand-blue-600">{apprentice.progress}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 rounded-full transition-all"
                        style={{ width: `${apprentice.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      Last clock-in: {apprentice.lastClockIn}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4" />
                      Started: {apprentice.startDate}
                      {apprentice.endDate && ` - ${apprentice.endDate}`}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-4 h-4" />
                      {apprentice.employer}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white rounded-lg transition" title="Email">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-white rounded-lg transition" title="Phone">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <Link href={`/host-shop/dashboard/apprentices/${apprentice.id}`} className="text-brand-blue-600 font-medium text-sm hover:underline flex items-center gap-1">
                    View Profile <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
