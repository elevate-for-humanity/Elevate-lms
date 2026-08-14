'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, 
  Book, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Download,
  FileText,
  GraduationCap,
  Heart,
  MessageCircle,
  Play,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Zap,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  HelpCircle,
  Award,
  ClipboardList,
  Truck,
  Scissors,
  Wrench,
  Stethoscope
} from 'lucide-react';

// Program type
type ProgramType = 'barber' | 'hvac' | 'cna' | 'cdl' | 'cosmetology' | 'medical_assistant';

interface Student {
  name: string;
  program: ProgramType;
  progress: number;
  enrolledDate: string;
  graduationDate: string;
  currentWeek: number;
  totalWeeks: number;
  theoryHours: number;
  theoryRequired: number;
  handsOnHours: number;
  handsOnRequired: number;
  ojtHours: number;
  ojtRequired: number;
  licenseExamDate?: string;
  nextMilestone: string;
  milestoneDate: string;
  instructor: {
    name: string;
    avatar: string;
  };
  employer?: {
    name: string;
    address: string;
  };
}

const PROGRAM_CONFIG: Record<ProgramType, {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  credential: string;
}> = {
  barber: { name: 'Barbering', icon: <Scissors className="w-6 h-6" />, color: 'amber', bgColor: 'bg-amber-500', credential: 'Indiana Barber License' },
  hvac: { name: 'HVAC/R Technician', icon: <Wrench className="w-6 h-6" />, color: 'blue', bgColor: 'bg-blue-500', credential: 'EPA 608 Certification' },
  cna: { name: 'CNA + Medication Aide', icon: <Stethoscope className="w-6 h-6" />, color: 'emerald', bgColor: 'bg-emerald-500', credential: 'CNA License' },
  cdl: { name: 'CDL Class A', icon: <Truck className="w-6 h-6" />, color: 'purple', bgColor: 'bg-purple-500', credential: 'CDL Class A' },
  cosmetology: { name: 'Cosmetology', icon: <Star className="w-6 h-6" />, color: 'pink', bgColor: 'bg-pink-500', credential: 'Indiana Cosmetology License' },
  medical_assistant: { name: 'Medical Assistant', icon: <Heart className="w-6 h-6" />, color: 'red', bgColor: 'bg-red-500', credential: 'RMA/CMA' },
};

// Demo student data
const DEMO_STUDENT: Student = {
  name: 'Marcus Johnson',
  program: 'barber',
  progress: 68,
  enrolledDate: '2025-03-15',
  graduationDate: '2026-03-14',
  currentWeek: 35,
  totalWeeks: 52,
  theoryHours: 420,
  theoryRequired: 600,
  handsOnHours: 680,
  handsOnRequired: 1000,
  ojtHours: 280,
  ojtRequired: 500,
  licenseExamDate: '2026-02-15',
  nextMilestone: 'Complete shave techniques module',
  milestoneDate: '2025-07-10',
  instructor: {
    name: 'Coach Williams',
    avatar: 'CW',
  },
  employer: {
    name: 'Great Clips - 86th St.',
    address: '8545 N. Keystone Ave, Indianapolis',
  },
};

// Today's Tasks Component
function TodaysTasks({ tasks }: { tasks: { title: string; type: string; completed: boolean; due: string }[] }) {
  const completed = tasks.filter((t) => t.completed).length;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Today's Tasks</h3>
        <span className="text-sm text-slate-500">{completed}/{tasks.length} complete</span>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              task.completed ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <button
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-slate-300 hover:border-brand-red-500'
              }`}
            >
              {task.completed && <CheckCircle className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <p className={`font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {task.title}
              </p>
              <p className="text-xs text-slate-500">Due: {task.due}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              task.type === 'theory' ? 'bg-blue-100 text-blue-700' :
              task.type === 'hands-on' ? 'bg-amber-100 text-amber-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {task.type}
            </span>
          </motion.div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 text-brand-red-600 font-semibold text-sm hover:bg-brand-red-50 rounded-lg transition-colors">
        View All Tasks
      </button>
    </div>
  );
}

// Progress Wheel Component
function ProgressWheel({ progress, program }: { progress: number; program: ProgramType }) {
  const config = PROGRAM_CONFIG[program];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={config.color === 'amber' ? '#f59e0b' : '#3b82f6'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900">{progress}%</span>
        <span className="text-xs text-slate-500">Complete</span>
      </div>
    </div>
  );
}

// Stats Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  required, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  required: number;
  color: string;
}) {
  const percent = Math.round((value / required) * 100);
  
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="font-bold text-slate-900">{value} / {required} hrs</p>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{percent}% complete</p>
    </div>
  );
}

// Upcoming Events Component
function UpcomingEvents({ events }: { events: { title: string; date: string; type: string }[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-900 mb-4">Upcoming Events</h3>
      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`p-2 rounded-lg ${
              event.type === 'class' ? 'bg-blue-100 text-blue-600' :
              event.type === 'exam' ? 'bg-red-100 text-red-600' :
              'bg-green-100 text-green-600'
            }`}>
              {event.type === 'class' ? <Book className="w-4 h-4" /> :
               event.type === 'exam' ? <FileText className="w-4 h-4" /> :
               <Trophy className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-medium text-slate-900">{event.title}</p>
              <p className="text-sm text-slate-500">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { icon: <Play className="w-5 h-5" />, label: 'Start Lesson', href: '/lessons', color: 'bg-brand-red-600' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Schedule Lab', href: '/schedule', color: 'bg-blue-600' },
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Message Coach', href: '/lms/messages', color: 'bg-green-600' },
    { icon: <FileText className="w-5 h-5" />, label: 'View Syllabus', href: '/syllabus', color: 'bg-purple-600' },
  ];
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <Link
          key={i}
          href={action.href}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md hover:border-brand-red-200 transition-all"
        >
          <div className={`p-3 rounded-xl text-white ${action.color}`}>
            {action.icon}
          </div>
          <span className="text-sm font-medium text-slate-900">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

// Welcome Banner Component
function WelcomeBanner({ student }: { student: Student }) {
  const config = PROGRAM_CONFIG[student.program];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${config.bgColor} p-6 sm:p-8 text-white`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
            {config.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {student.name.split(' ')[0]}!
            </h1>
            <p className="text-white/80">
              {config.name} • Week {student.currentWeek} of {student.totalWeeks}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-3xl font-bold">{student.progress}%</div>
            <div className="text-sm text-white/70">Complete</div>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <div className="text-3xl font-bold">{student.ojtHours}</div>
            <div className="text-sm text-white/70">OJT Hours</div>
          </div>
        </div>
      </div>
      
      {/* Next milestone */}
      <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4" />
          <span>Next milestone: {student.nextMilestone}</span>
          <span className="text-white/70">• {student.milestoneDate}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Certificates Preview Component
function CertificatesPreview() {
  const certificates = [
    { name: 'Basic Haircutting', completed: true, date: '2025-04-15' },
    { name: 'Sanitation & Safety', completed: true, date: '2025-03-28' },
    { name: 'Customer Service', completed: false, date: 'Due: 2025-07-20' },
  ];
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Certificates Earned</h3>
        <span className="text-sm text-slate-500">2/12 complete</span>
      </div>
      
      <div className="space-y-3">
        {certificates.map((cert, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`p-2 rounded-lg ${cert.completed ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
              {cert.completed ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${cert.completed ? 'text-slate-900' : 'text-slate-500'}`}>{cert.name}</p>
              <p className="text-xs text-slate-500">{cert.date}</p>
            </div>
            {cert.completed && <Download className="w-4 h-4 text-slate-400 cursor-pointer hover:text-brand-red-600" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

// Main Dashboard Component
export function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const student = DEMO_STUDENT;
  const config = PROGRAM_CONFIG[student.program];
  
  const todaysTasks = [
    { title: 'Complete Haircutting Module 5', type: 'hands-on', completed: true, due: 'Today' },
    { title: 'Sanitation Quiz', type: 'theory', completed: false, due: 'Today' },
    { title: 'Practice Shave Techniques', type: 'hands-on', completed: false, due: 'Tomorrow' },
    { title: 'Watch Product Knowledge Video', type: 'theory', completed: false, due: 'This Week' },
  ];
  
  const upcomingEvents = [
    { title: 'Theory Class: Chemical Services', date: 'Tomorrow, 9:00 AM', type: 'class' },
    { title: 'Mid-Term Practical Exam', date: 'July 15, 10:00 AM', type: 'exam' },
    { title: 'Employer Mixer Event', date: 'July 20, 2:00 PM', type: 'event' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${config.bgColor} text-white`}>
              {config.icon}
            </div>
            <span className="font-bold text-slate-900">Elevate</span>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-lg relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red-600 rounded-full" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen fixed top-0 left-0 pt-16">
          {/* Logo */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red-600 rounded-xl flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <div className="font-bold text-slate-900">Elevate LMS</div>
                <div className="text-xs text-slate-500">Student Portal</div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: 'overview', icon: <Target className="w-5 h-5" />, label: 'Overview' },
              { id: 'courses', icon: <Book className="w-5 h-5" />, label: 'My Courses' },
              { id: 'schedule', icon: <Calendar className="w-5 h-5" />, label: 'Schedule' },
              { id: 'ojt', icon: <Briefcase className="w-5 h-5" />, label: 'OJT Hours' },
              { id: 'certificates', icon: <Award className="w-5 h-5" />, label: 'Certificates' },
              { id: 'messages', icon: <MessageCircle className="w-5 h-5" />, label: 'Messages' },
              { id: 'resources', icon: <FileText className="w-5 h-5" />, label: 'Resources' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-brand-red-50 text-brand-red-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          
          {/* Bottom Section */}
          <div className="p-4 border-t border-slate-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Help & Support</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
          
          {/* User Card */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{student.name}</div>
                <div className="text-xs text-slate-500 truncate">{config.name}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 pt-16"
              >
                <nav className="p-4 space-y-1">
                  {['Overview', 'My Courses', 'Schedule', 'OJT Hours', 'Certificates', 'Messages', 'Resources'].map((item) => (
                    <button
                      key={item}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-600 hover:bg-slate-50"
                    >
                      <span>{item}</span>
                    </button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Welcome Banner */}
            <WelcomeBanner student={student} />
            
            {/* Quick Actions */}
            <QuickActions />
            
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Book className="w-5 h-5 text-blue-600" />}
                label="Theory Hours"
                value={student.theoryHours}
                required={student.theoryRequired}
                color="bg-blue-500"
              />
              <StatCard
                icon={<Scissors className="w-5 h-5 text-amber-600" />}
                label="Hands-On Hours"
                value={student.handsOnHours}
                required={student.handsOnRequired}
                color="bg-amber-500"
              />
              <StatCard
                icon={<Briefcase className="w-5 h-5 text-purple-600" />}
                label="OJT Hours"
                value={student.ojtHours}
                required={student.ojtRequired}
                color="bg-purple-500"
              />
              <StatCard
                icon={<Trophy className="w-5 h-5 text-green-600" />}
                label="Overall Progress"
                value={student.progress}
                required={100}
                color="bg-green-500"
              />
            </div>
            
            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                <TodaysTasks tasks={todaysTasks} />
                
                {/* Instructor Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Your Instructor</h3>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 text-xl font-bold">
                      {student.instructor.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{student.instructor.name}</p>
                      <p className="text-sm text-slate-500">Lead Instructor</p>
                    </div>
                    <button className="px-4 py-2 bg-brand-red-600 text-white font-medium rounded-lg hover:bg-brand-red-700 transition-colors">
                      Message
                    </button>
                  </div>
                </div>
                
                {/* Employer Card */}
                {student.employer && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Host Employer</h3>
                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Briefcase className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{student.employer.name}</p>
                        <p className="text-sm text-slate-500">{student.employer.address}</p>
                      </div>
                      <button className="px-4 py-2 border border-purple-300 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right Column - 1/3 */}
              <div className="space-y-6">
                <UpcomingEvents events={upcomingEvents} />
                <CertificatesPreview />
                
                {/* AI Tutor Card */}
                <div className="bg-gradient-to-br from-brand-red-600 to-brand-red-700 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">AI Tutor</h3>
                      <p className="text-sm text-white/70">Available 24/7</p>
                    </div>
                  </div>
                  <p className="text-white/80 mb-4">
                    Have questions about your coursework? Get instant help from your AI tutor.
                  </p>
                  <button className="w-full py-3 bg-white text-brand-red-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                    Start Chat
                  </button>
                </div>
                
                {/* Graduation Countdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Graduation Countdown</h3>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-brand-red-600 mb-2">
                      41
                    </div>
                    <p className="text-slate-500">weeks remaining</p>
                    <p className="text-sm text-slate-400 mt-2">
                      {student.graduationDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;
