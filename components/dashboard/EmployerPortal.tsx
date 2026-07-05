'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock,
  DollarSign,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Settings,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Award,
  AlertCircle,
  Bell,
  LogOut,
  ChevronDown,
  UserPlus,
  ClipboardCheck,
  Banknote
} from 'lucide-react';

// Demo data
const DEMO_EMPLOYER = {
  name: 'Great Clips - 86th Street',
  type: 'Barbershop',
  apprentices: 8,
  openPositions: 3,
  totalOjtHours: 2840,
  reimbursementRate: 75, // dollars per hour
  rating: 4.8,
};

const APPRENTICES = [
  { id: 1, name: 'Marcus Johnson', program: 'Barbering', startDate: '2025-03-15', ojtHours: 280, weeklyHours: 20, status: 'active', progress: 68, nextMilestone: 'Complete fade techniques', supervisor: 'You' },
  { id: 2, name: 'Sarah Williams', program: 'Barbering', startDate: '2025-01-10', ojtHours: 450, weeklyHours: 25, status: 'active', progress: 85, nextMilestone: 'License exam prep', supervisor: 'You' },
  { id: 3, name: 'James Brown', program: 'Barbering', startDate: '2025-04-01', ojtHours: 120, weeklyHours: 15, status: 'new', progress: 35, nextMilestone: 'Basic haircuts', supervisor: 'John D.' },
  { id: 4, name: 'Emily Davis', program: 'Barbering', startDate: '2024-11-20', ojtHours: 620, weeklyHours: 30, status: 'active', progress: 95, nextMilestone: 'Licensing exam', supervisor: 'You' },
];

const HIRING_PIPELINE = [
  { id: 1, name: 'Candidate A', position: 'Apprentice Barber', stage: 'screening', applied: '2025-06-28' },
  { id: 2, name: 'Candidate B', position: 'Apprentice Barber', stage: 'interview', applied: '2025-06-25' },
  { id: 3, name: 'Candidate C', position: 'Apprentice Barber', stage: 'offer', applied: '2025-06-20' },
];

const REIMBURSEMENTS = [
  { id: 1, period: 'June 2025', hours: 420, amount: 3150, status: 'paid' },
  { id: 2, period: 'May 2025', hours: 380, amount: 2850, status: 'paid' },
  { id: 3, period: 'April 2025', hours: 360, amount: 2700, status: 'paid' },
];

// Stat Card
function StatCard({ icon, label, value, subtext, color }: { icon: React.ReactNode; label: string; value: string; subtext?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {subtext && <p className="text-xs text-green-600 mt-1">{subtext}</p>}
    </div>
  );
}

// Apprentice Card
function ApprenticeCard({ apprentice }: { apprentice: typeof APPRENTICES[0] }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    new: 'bg-blue-100 text-blue-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-purple-100 text-purple-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 font-bold">
            {apprentice.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{apprentice.name}</h4>
            <p className="text-sm text-slate-500">{apprentice.program}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[apprentice.status as keyof typeof statusColors]}`}>
          {apprentice.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500">OJT Hours</p>
          <p className="font-bold text-slate-900">{apprentice.ojtHours}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Weekly</p>
          <p className="font-bold text-slate-900">{apprentice.weeklyHours} hrs</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Progress</span>
          <span className="font-medium text-slate-900">{apprentice.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-red-600 rounded-full" 
            style={{ width: `${apprentice.progress}%` }}
          />
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg mb-4">
        <p className="text-xs text-slate-500 mb-1">Next Milestone</p>
        <p className="text-sm font-medium text-slate-900">{apprentice.nextMilestone}</p>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center justify-center gap-1">
          <Clock className="w-4 h-4" />
          Log Hours
        </button>
        <button className="flex-1 py-2 bg-brand-red-600 text-white font-medium rounded-lg hover:bg-brand-red-700 transition-colors text-sm">
          View Profile
        </button>
      </div>
    </motion.div>
  );
}

// Hiring Pipeline
function HiringPipeline({ candidates }: { candidates: typeof HIRING_PIPELINE }) {
  const stages = ['screening', 'interview', 'offer', 'hired'];
  
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Hiring Pipeline</h3>
        <button className="text-sm text-brand-red-600 font-medium hover:underline">
          View All
        </button>
      </div>
      
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {stages.map((stage) => {
          const count = candidates.filter(c => c.stage === stage).length;
          return (
            <div key={stage} className="flex-shrink-0 px-3 py-2 bg-slate-50 rounded-lg text-center">
              <p className="text-xs text-slate-500 capitalize">{stage}</p>
              <p className="text-lg font-bold text-slate-900">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
              {candidate.name.split(' ')[1]?.[0] || 'C'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{candidate.name}</p>
              <p className="text-xs text-slate-500">{candidate.position}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
              candidate.stage === 'offer' ? 'bg-amber-100 text-amber-700' :
              candidate.stage === 'interview' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-200 text-slate-600'
            }`}>
              {candidate.stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reimbursement Summary
function ReimbursementSummary({ claims }: { claims: typeof REIMBURSEMENTS }) {
  const totalPaid = claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingAmount = 3150; // This month's pending

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">OJT Reimbursements</h3>
        <button className="text-sm text-brand-red-600 font-medium hover:underline">
          View All
        </button>
      </div>

      <div className="p-4 bg-green-50 rounded-xl mb-4">
        <p className="text-sm text-green-600 mb-1">Total Paid This Year</p>
        <p className="text-2xl font-bold text-green-700">${totalPaid.toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        {claims.slice(0, 3).map((claim) => (
          <div key={claim.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">{claim.period}</p>
              <p className="text-xs text-slate-500">{claim.hours} hours @ ${claim.amount / claim.hours}/hr</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">${claim.amount.toLocaleString()}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                claim.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {claim.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-3 bg-brand-red-600 text-white font-semibold rounded-xl hover:bg-brand-red-700 transition-colors">
        Submit Reimbursement
      </button>
    </div>
  );
}

// Quick Actions
function QuickActions() {
  const actions = [
    { icon: <UserPlus className="w-5 h-5" />, label: 'Post Position', color: 'bg-blue-600' },
    { icon: <ClipboardCheck className="w-5 h-5" />, label: 'Verify Hours', color: 'bg-green-600' },
    { icon: <Banknote className="w-5 h-5" />, label: 'Reimbursement', color: 'bg-amber-600' },
    { icon: <Users className="w-5 h-5" />, label: 'Find Apprentices', color: 'bg-purple-600' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
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
  );
}

// Main Employer Portal
export function EmployerPortal() {
  const [activeTab, setActiveTab] = useState('apprentices');
  const [searchQuery, setSearchQuery] = useState('');
  const employer = DEMO_EMPLOYER;

  const filteredApprentices = APPRENTICES.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{employer.name}</h1>
                <p className="text-sm text-slate-500">{employer.type} • {employer.rating} ★ Rating</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
              { id: 'apprentices', label: 'Apprentices', icon: <Users className="w-4 h-4" /> },
              { id: 'hiring', label: 'Hiring', icon: <UserPlus className="w-4 h-4" /> },
              { id: 'reimbursements', label: 'Reimbursements', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'resources', label: 'Resources', icon: <FileText className="w-4 h-4" /> },
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
            label="Active Apprentices"
            value={employer.apprentices.toString()}
            color="bg-blue-100"
          />
          <StatCard
            icon={<Briefcase className="w-5 h-5 text-green-600" />}
            label="Open Positions"
            value={employer.openPositions.toString()}
            color="bg-green-100"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="Total OJT Hours"
            value={employer.totalOjtHours.toLocaleString()}
            color="bg-amber-100"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-purple-600" />}
            label="Reimbursement Rate"
            value={`$${employer.reimbursementRate}/hr`}
            subtext="75% of federal minimum"
            color="bg-purple-100"
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filter */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search apprentices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                  />
                </div>
                <select className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>New</option>
                  <option>Paused</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-red-600 text-white font-medium rounded-lg hover:bg-brand-red-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Apprentice
                </button>
              </div>
            </div>

            {/* Apprentice Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredApprentices.map((apprentice) => (
                <ApprenticeCard key={apprentice.id} apprentice={apprentice} />
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <HiringPipeline candidates={HIRING_PIPELINE} />
            <ReimbursementSummary claims={REIMBURSEMENTS} />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployerPortal;
