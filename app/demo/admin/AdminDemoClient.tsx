'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Info, Home, Users, GraduationCap, FileText, Building2, Search, Plus, ChevronRight, Bell, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface AdminDemoClientProps {
  stats: {
    students: number;
    programs: number;
    activeEnrollments: number;
    partners: number;
  };
  students: Array<{
    id: string;
    name: string;
    email: string;
    program: string;
    progress: number;
    status: string;
    avatar: string;
  }>;
  programs: Array<{
    id: string;
    name: string;
    category: string;
    enrolled: number;
    completed: number;
  }>;
  activity: Array<{
    msg: string;
    time: string;
    type: string;
  }>;
}

export default function AdminDemoClient({ stats, students, programs, activity }: AdminDemoClientProps) {
  const [tab, setTab] = useState('home');
  const [search, setSearch] = useState('');

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.program.toLowerCase().includes(search.toLowerCase())
  );

  const reports = ['Enrollment Report', 'Completion Report', 'Attendance Records', 'WIOA Compliance', 'Partner Activity', 'Financial Summary'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-blue-600 text-white text-center py-3 px-2 text-xs">
        <Info className="w-3 h-3 inline mr-1" />
        Live Demo - Admin Dashboard (Connected to Database)
      </div>
      
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 py-2">
          <Link href="/demo" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className="font-bold text-sm hidden sm:inline">Admin Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 sm:hidden">
        <div className="flex justify-around py-2">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'students', icon: Users, label: 'Students' },
            { id: 'programs', icon: GraduationCap, label: 'Programs' },
            { id: 'reports', icon: FileText, label: 'Reports' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center px-4 py-3 ${tab === t.id ? 'text-orange-600' : 'text-gray-500'}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="hidden sm:flex justify-center gap-1 py-2 bg-white border-b">
        {[
          { id: 'home', icon: Home, label: 'Overview' },
          { id: 'students', icon: Users, label: 'Students' },
          { id: 'programs', icon: GraduationCap, label: 'Programs' },
          { id: 'reports', icon: FileText, label: 'Reports' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <main className="p-3 pb-20 sm:pb-6 max-w-5xl mx-auto">
        {tab === 'home' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Students', value: stats.students, icon: Users, color: 'text-brand-blue-600' },
                { label: 'Programs', value: stats.programs, icon: GraduationCap, color: 'text-green-600' },
                { label: 'Active', value: stats.activeEnrollments, icon: CheckCircle, color: 'text-brand-blue-600' },
                { label: 'Partners', value: stats.partners, icon: Building2, color: 'text-orange-600' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-xs text-gray-500">{s.label}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 border">
              <h2 className="font-bold text-gray-900 mb-3">Pipeline</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { stage: 'Intake', count: 45, color: 'bg-gray-500' },
                  { stage: 'Review', count: 32, color: 'bg-yellow-500' },
                  { stage: 'Enrolled', count: 28, color: 'bg-brand-blue-500' },
                  { stage: 'Active', count: stats.activeEnrollments, color: 'bg-green-500' },
                  { stage: 'Done', count: 214, color: 'bg-brand-blue-500' },
                ].map((p, i) => (
                  <div key={i} className={`${p.color} text-white px-3 py-2 rounded-lg text-center min-w-[60px]`}>
                    <div className="font-bold">{p.count}</div>
                    <div className="text-[10px] opacity-90">{p.stage}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border">
                <h3 className="font-bold text-gray-900 mb-3">Top Programs</h3>
                {programs.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{p.enrolled}</div>
                      <div className="text-xs text-gray-500">enrolled</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-4 border">
                <h3 className="font-bold text-gray-900 mb-3">Activity</h3>
                {activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 py-2 border-b last:border-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                    <div>
                      <div className="text-sm text-gray-900">{a.msg}</div>
                      <div className="text-xs text-gray-400">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-amber-800">WIOA Deadline</div>
                  <div className="text-xs text-amber-700">Quarterly report due Jan 31</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'students' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search students..." 
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" 
                />
              </div>
              <button className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
            <div className="bg-white rounded-xl border overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No students found. Add students to see them here.
                </div>
              ) : (
                filtered.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50">
                    <Image src={s.avatar} alt={s.name} width={36} height={36} className="rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.program}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-orange-500 rounded-full" style={{width:`${s.progress}%`}} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{s.progress}%</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'programs' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold text-gray-900">Programs</h1>
              <button className="bg-orange-600 text-white px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" />Add
              </button>
            </div>
            {programs.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border text-center text-gray-500">
                No programs found. Create programs to see them here.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {programs.map((p, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border hover:shadow-md transition">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.category === 'Healthcare' ? 'bg-brand-blue-100 text-brand-blue-700' : 
                      p.category === 'Trades' ? 'bg-orange-100 text-orange-700' : 
                      'bg-brand-blue-100 text-brand-blue-700'
                    }`}>{p.category}</span>
                    <h3 className="font-bold text-gray-900 mt-2 mb-3">{p.name}</h3>
                    <div className="flex justify-between">
                      <div>
                        <div className="text-xl font-bold text-gray-900">{p.enrolled}</div>
                        <div className="text-xs text-gray-500">Enrolled</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{p.completed}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold text-gray-900">Reports</h1>
              <button className="bg-orange-600 text-white px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-1">
                <Download className="w-4 h-4" />Export All
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reports.map((r, i) => (
                <button key={i} onClick={() => alert(`Generating ${r}...`)} className="bg-white rounded-xl p-4 border text-left hover:shadow-md transition">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">{r}</h3>
                  <p className="text-xs text-gray-500 mt-1">Generate & export</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
