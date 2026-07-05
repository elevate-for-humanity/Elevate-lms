'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  BarChart3, 
  Bell,
  Calendar, 
  CheckCircle, 
  Clock,
  DollarSign,
  Download,
  Filter,
  GraduationCap,
  HelpCircle,
  Home,
  LineChart,
  LogOut,
  MoreVertical,
  PieChart,
  Plus,
  Search,
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  FileText,
  Briefcase,
  AlertCircle,
  Shield,
  Building2,
  UserCheck,
  ClipboardList,
  Wrench,
  Scissors,
  Truck,
  Stethoscope
} from 'lucide-react';

// Demo data
const STATS = {
  totalStudents: 1247,
  studentsChange: 12,
  activePrograms: 8,
  programsChange: 2,
  revenue: 284500,
  revenueChange: 8,
  completionRate: 94,
  completionChange: 3,
};

const PROGRAMS = [
  { id: 1, name: 'Barbering', students: 420, enrolled: 45, completed: 89, revenue: 125000, icon: Scissors, color: 'amber' },
  { id: 2, name: 'HVAC/R', students: 280, enrolled: 32, completed: 67, revenue: 78000, icon: Wrench, color: 'blue' },
  { id: 3, name: 'CDL Training', students: 195, enrolled: 28, completed: 45, revenue: 42000, icon: Truck, color: 'purple' },
  { id: 4, name: 'CNA + Med Aide', students: 180, enrolled: 22, completed: 38, revenue: 28000, icon: Stethoscope, color: 'green' },
];

const RECENT_ENROLLMENTS = [
  { id: 1, name: 'Marcus Johnson', program: 'Barbering', date: '2025-07-04', source: 'Website', status: 'enrolled' },
  { id: 2, name: 'Sarah Williams', program: 'HVAC/R', date: '2025-07-04', source: 'WorkOne', status: 'funding-pending' },
  { id: 3, name: 'James Brown', program: 'CDL Training', date: '2025-07-03', source: 'Referral', status: 'enrolled' },
  { id: 4, name: 'Emily Davis', program: 'CNA', date: '2025-07-03', source: 'Website', status: 'enrolled' },
  { id: 5, name: 'Michael Wilson', program: 'Barbering', date: '2025-07-02', source: 'WorkOne', status: 'documents' },
];

const ALERTS = [
  { id: 1, type: 'warning', title: 'OJT Hours Expiring', message: '12 apprentices have OJT verification due in 7 days', action: 'Review Now' },
  { id: 2, type: 'info', title: 'Funding Renewed', message: 'WIOA provider status renewed for 2026', action: 'View Details' },
  { id: 3, type: 'success', title: 'License Exam Pass Rate', message: 'June bar exam: 98% pass rate (98/100 students)', action: 'View Report' },
];

// Stat Card
function StatCard({ 
  icon, 
  label, 
  value, 
  change, 
  changeType,
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  change?: number;
  changeType?: 'increase' | 'decrease';
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            changeType === 'decrease' ? 'text-red-600' : 'text-green-600'
          }`}>
            {changeType === 'decrease' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {change}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

// Program Card
function ProgramCard({ program }: { program: typeof PROGRAMS[0] }) {
  const Icon = program.icon;
  
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-${program.color}-100`}>
            <Icon className={`w-6 h-6 text-${program.color}-600`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{program.name}</h3>
            <p className="text-sm text-slate-500">{program.students} total students</p>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <MoreVertical className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-lg font-bold text-slate-900">{program.enrolled}</p>
          <p className="text-xs text-slate-500">Enrolled</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-lg font-bold text-slate-900">{program.completed}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">${(program.revenue / 1000).toFixed(0)}k</p>
          <p className="text-xs text-slate-500">Revenue</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm">
          View Details
        </button>
        <button className="flex-1 py-2 bg-brand-red-600 text-white font-medium rounded-lg hover:bg-brand-red-700 transition-colors text-sm">
          Reports
        </button>
      </div>
    </div>
  );
}

// Recent Enrollment Row
function EnrollmentRow({ enrollment }: { enrollment: typeof RECENT_ENROLLMENTS[0] }) {
  const statusColors = {
    enrolled: 'bg-green-100 text-green-700',
    'funding-pending': 'bg-amber-100 text-amber-700',
    documents: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
      <div className="w-10 h-10 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 font-bold text-sm">
        {enrollment.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{enrollment.name}</p>
        <p className="text-sm text-slate-500">{enrollment.program}</p>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-sm text-slate-500">{enrollment.date}</p>
        <p className="text-xs text-slate-400">{enrollment.source}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[enrollment.status as keyof typeof statusColors]}`}>
        {enrollment.status.replace('-', ' ')}
      </span>
      <button className="p-2 hover:bg-slate-100 rounded-lg">
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}

// Alert Card
function AlertCard({ alert }: { alert: typeof ALERTS[0] }) {
  const typeStyles = {
    warning: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', iconBg: 'bg-amber-100' },
    info: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
    success: { bg: 'bg-green-50 border-green-200', icon: 'text-green-600', iconBg: 'bg-green-100' },
  };
  const style = typeStyles[alert.type as keyof typeof typeStyles];

  return (
    <div className={`p-4 rounded-xl border ${style.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${style.iconBg}`}>
          <AlertCircle className={`w-5 h-5 ${style.icon}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{alert.title}</h4>
          <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
        </div>
        <button className="text-sm font-medium text-brand-red-600 hover:underline whitespace-nowrap">
          {alert.action}
        </button>
      </div>
    </div>
  );
}

// Main Admin Dashboard
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-red-600 rounded-xl flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Elevate Admin</h1>
                <p className="text-sm text-slate-500">Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                />
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg relative">
                <Bell className="w-6 h-6 text-slate-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red-600 rounded-full" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <Settings className="w-6 h-6 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
              { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
              { id: 'programs', label: 'Programs', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'employers', label: 'Employers', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'compliance', label: 'Compliance', icon: <Shield className="w-4 h-4" /> },
              { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-brand-red-600 text-brand-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="Total Students"
            value={STATS.totalStudents}
            change={STATS.studentsChange}
            color="bg-blue-100"
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5 text-green-600" />}
            label="Active Programs"
            value={STATS.activePrograms}
            change={STATS.programsChange}
            color="bg-green-100"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-amber-600" />}
            label="Monthly Revenue"
            value={`$${(STATS.revenue / 1000).toFixed(0)}k`}
            change={STATS.revenueChange}
            color="bg-amber-100"
          />
          <StatCard
            icon={<Award className="w-5 h-5 text-purple-600" />}
            label="Completion Rate"
            value={`${STATS.completionRate}%`}
            change={STATS.completionChange}
            color="bg-purple-100"
          />
        </div>

        {/* Alerts */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {ALERTS.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Enrollments */}
            <div className="bg-white rounded-xl border border-slate-100">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Recent Enrollments</h2>
                <button className="text-sm text-brand-red-600 font-medium hover:underline">
                  View All
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {RECENT_ENROLLMENTS.map((enrollment) => (
                  <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <UserCheck className="w-5 h-5" />, label: 'Add Student', color: 'bg-blue-600' },
                  { icon: <Plus className="w-5 h-5" />, label: 'New Program', color: 'bg-green-600' },
                  { icon: <Building2 className="w-5 h-5" />, label: 'Add Employer', color: 'bg-purple-600' },
                  { icon: <FileText className="w-5 h-5" />, label: 'Generate Report', color: 'bg-amber-600' },
                ].map((action, i) => (
                  <button
                    key={i}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className={`p-3 rounded-xl text-white ${action.color}`}>
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Program Performance */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Program Performance</h2>
                <select className="text-sm border border-slate-200 rounded-lg px-2 py-1">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This year</option>
                </select>
              </div>
              <div className="space-y-4">
                {PROGRAMS.map((program) => (
                  <div key={program.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-900">{program.name}</span>
                      <span className="text-slate-500">{program.students} students</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-red-600 rounded-full" 
                        style={{ width: `${(program.students / 500) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grant Compliance */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Grant Compliance</h2>
              <div className="space-y-3">
                {[
                  { name: 'WIOA', status: 'Compliant', expiry: 'Dec 2025' },
                  { name: 'DOL Registered', status: 'Active', expiry: 'Ongoing' },
                  { name: 'ETPL Listed', status: 'Compliant', expiry: 'Jun 2026' },
                ].map((grant, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{grant.name}</p>
                      <p className="text-xs text-slate-500">Expires: {grant.expiry}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {grant.status}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm">
                View All Grants
              </button>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">System Health</h2>
              <div className="space-y-3">
                {[
                  { name: 'Database', status: 'Healthy', uptime: '99.9%' },
                  { name: 'API', status: 'Healthy', uptime: '99.8%' },
                  { name: 'Authentication', status: 'Healthy', uptime: '100%' },
                ].map((system, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-slate-900">{system.name}</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">{system.uptime}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
