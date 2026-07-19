'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, 
  Book, 
  Calendar, 
  CheckCircle, 
  Clock,
  Download,
  FileText,
  GraduationCap,
  Grid,
  List,
  MessageCircle,
  Search,
  Settings,
  Star,
  Users,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Plus,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  ChevronDown,
  Bell,
  LogOut,
  HelpCircle,
  BarChart3,
  ClipboardList,
  Award
} from 'lucide-react';

// Demo data
const DEMO_INSTRUCTOR = {
  name: 'Coach Williams',
  program: 'Barbering',
  students: 24,
  classesToday: 2,
  avgProgress: 68,
};

const STUDENTS = [
  { id: 1, name: 'Marcus Johnson', progress: 68, ojtHours: 280, lastActive: 'Today', status: 'active', email: 'marcus@email.com' },
  { id: 2, name: 'Sarah Williams', progress: 72, ojtHours: 320, lastActive: 'Today', status: 'active', email: 'sarah@email.com' },
  { id: 3, name: 'James Brown', progress: 45, ojtHours: 150, lastActive: 'Yesterday', status: 'at-risk', email: 'james@email.com' },
  { id: 4, name: 'Emily Davis', progress: 85, ojtHours: 400, lastActive: 'Today', status: 'active', email: 'emily@email.com' },
  { id: 5, name: 'Michael Wilson', progress: 55, ojtHours: 200, lastActive: '3 days ago', status: 'warning', email: 'michael@email.com' },
  { id: 6, name: 'Jessica Taylor', progress: 91, ojtHours: 450, lastActive: 'Today', status: 'active', email: 'jessica@email.com' },
];

const CLASSES_TODAY = [
  { id: 1, name: 'Morning Theory - Haircutting Basics', time: '9:00 AM - 11:00 AM', students: 12, room: 'Room 101' },
  { id: 2, name: 'Afternoon Practical - Shave Techniques', time: '1:00 PM - 3:00 PM', students: 8, room: 'Lab A' },
];

const UPCOMING_DEADLINES = [
  { title: 'Mid-Term Practical Exams', date: 'July 15', students: 24 },
  { title: 'OJT Hour Submissions', date: 'July 20', students: 18 },
  { title: 'Theory Module Completion', date: 'July 25', students: 24 },
];

// Student Card Component
function StudentCard({ student, view }: { student: typeof STUDENTS[0]; view: 'grid' | 'list' }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    'at-risk': 'bg-red-100 text-red-700',
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
      >
        <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 font-bold">
          {student.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 truncate">{student.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[student.status as keyof typeof statusColors]}`}>
              {student.status}
            </span>
          </div>
          <p className="text-sm text-slate-500">{student.email}</p>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-bold text-slate-900">{student.progress}%</p>
            <p className="text-xs text-slate-500">Progress</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900">{student.ojtHours}</p>
            <p className="text-xs text-slate-500">OJT Hrs</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900">{student.lastActive}</p>
            <p className="text-xs text-slate-500">Last Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <MessageCircle className="w-5 h-5 text-slate-500" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <MoreVertical className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 font-bold">
          {student.name.split(' ').map(n => n[0]).join('')}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[student.status as keyof typeof statusColors]}`}>
          {student.status}
        </span>
      </div>
      <h4 className="font-semibold text-slate-900 mb-1">{student.name}</h4>
      <p className="text-sm text-slate-500 mb-3">{student.email}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Progress</span>
          <span className="font-bold text-slate-900">{student.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-red-600 rounded-full" 
            style={{ width: `${student.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">OJT Hours</span>
          <span className="font-bold text-slate-900">{student.ojtHours}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm">
          View
        </button>
        <button className="flex-1 py-2 bg-brand-red-600 text-white font-medium rounded-lg hover:bg-brand-red-700 transition-colors text-sm">
          Message
        </button>
      </div>
    </motion.div>
  );
}

// Stats Card Component
function StatCard({ icon, label, value, change, color }: { icon: React.ReactNode; label: string; value: string; change?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {change && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

// Today's Classes Component
function TodaysClasses({ classes }: { classes: typeof CLASSES_TODAY }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Today's Classes</h3>
        <button className="text-sm text-brand-red-600 font-medium hover:underline">
          View Schedule
        </button>
      </div>
      <div className="space-y-3">
        {classes.map((cls) => (
          <div key={cls.id} className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">{cls.name}</h4>
                <p className="text-sm text-slate-500 mt-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {cls.time}
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {cls.students} students
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{cls.room}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Upcoming Deadlines Component
function UpcomingDeadlines({ deadlines }: { deadlines: typeof UPCOMING_DEADLINES }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <h3 className="font-bold text-slate-900 mb-4">Upcoming Deadlines</h3>
      <div className="space-y-3">
        {deadlines.map((deadline, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-slate-900">{deadline.title}</p>
              <p className="text-sm text-slate-500">{deadline.students} students need action</p>
            </div>
            <span className="text-sm font-medium text-amber-700">{deadline.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// At-Risk Students Component
function AtRiskStudents({ students }: { students: typeof STUDENTS }) {
  const atRisk = students.filter(s => s.status === 'at-risk' || s.status === 'warning');
  
  if (atRisk.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-4">Students Needing Attention</h3>
        <div className="text-center py-8 text-slate-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p>All students are on track!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Students Needing Attention</h3>
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          {atRisk.length}
        </span>
      </div>
      <div className="space-y-3">
        {atRisk.map((student) => (
          <div key={student.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{student.name}</p>
              <p className="text-xs text-slate-500">
                {student.status === 'at-risk' ? 'Last active: 3+ days ago' : 'Below target progress'}
              </p>
            </div>
            <button className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
              Contact
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Instructor Dashboard
export function InstructorDashboard() {
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const instructor = DEMO_INSTRUCTOR;
  
  const filteredStudents = STUDENTS.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-red-600 rounded-xl flex items-center justify-center text-white font-bold">
                {instructor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Welcome, {instructor.name}</h1>
                <p className="text-sm text-slate-500">{instructor.program} Instructor</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="Active Students"
            value={instructor.students.toString()}
            change="+2 this week"
            color="bg-blue-100"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-amber-600" />}
            label="Classes Today"
            value={instructor.classesToday.toString()}
            color="bg-amber-100"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            label="Avg Progress"
            value={`${instructor.avgProgress}%`}
            change="+5%"
            color="bg-green-100"
          />
          <StatCard
            icon={<Award className="w-5 h-5 text-purple-600" />}
            label="On Track"
            value="22"
            color="bg-purple-100"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Students */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student List Header */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">My Students ({filteredStudents.length})</h2>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                    />
                  </div>
                  {/* Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="warning">Warning</option>
                    <option value="at-risk">At Risk</option>
                  </select>
                  {/* View Toggle */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setView('list')}
                      className={`p-2 ${view === 'list' ? 'bg-brand-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setView('grid')}
                      className={`p-2 ${view === 'grid' ? 'bg-brand-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Students */}
            <div className={`space-y-3 ${view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
              {filteredStudents.map((student) => (
                <StudentCard key={student.id} student={student} view={view} />
              ))}
            </div>
          </div>

          {/* Right Column - Classes & Deadlines */}
          <div className="space-y-6">
            <TodaysClasses classes={CLASSES_TODAY} />
            <UpcomingDeadlines deadlines={UPCOMING_DEADLINES} />
            <AtRiskStudents students={STUDENTS} />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <Plus className="w-5 h-5 text-brand-red-600" />
                  <span className="font-medium text-slate-900">Take Attendance</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <FileText className="w-5 h-5 text-brand-red-600" />
                  <span className="font-medium text-slate-900">Submit Grades</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <ClipboardList className="w-5 h-5 text-brand-red-600" />
                  <span className="font-medium text-slate-900">OJT Verification</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <Mail className="w-5 h-5 text-brand-red-600" />
                  <span className="font-medium text-slate-900">Send Group Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InstructorDashboard;
