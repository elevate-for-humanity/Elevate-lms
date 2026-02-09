'use client';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Info, Menu, X, Home, Users, GraduationCap, FileText, Building2, Search, Plus, ChevronRight, Bell, Download, AlertCircle, Circle, Clock } from 'lucide-react';

interface Program {
  name: string;
  cat: string;
  enrolled: number;
  done: number;
}

export default function AdminDemo() {
  const [tab, setTab] = useState('home');
  const [search, setSearch] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [students, setStudents] = useState([
    { id: 1, name: 'Darius Williams', email: 'd.williams@email.com', program: 'Barber', progress: 42, status: 'active', avatar: '/images/testimonials/student-marcus.jpg' },
    { id: 2, name: 'Sarah Mitchell', email: 's.mitchell@email.com', program: 'CNA', progress: 95, status: 'active', avatar: '/images/gallery/image9.jpg' },
    { id: 3, name: 'Marcus Johnson', email: 'm.johnson@email.com', program: 'HVAC', progress: 28, status: 'active', avatar: '/images/testimonials/student-david.jpg' },
    { id: 4, name: 'Lisa Rodriguez', email: 'l.rodriguez@email.com', program: 'MA', progress: 67, status: 'active', avatar: '/images/testimonials/testimonial-medical-assistant.jpg' },
    { id: 5, name: 'James Thompson', email: 'j.thompson@email.com', program: 'CDL', progress: 85, status: 'active', avatar: '/images/testimonials/student-graduate-testimonial.jpg' },
  ]);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs');
        const data = await res.json();
        if (data.status === 'success' && data.programs) {
          setPrograms(data.programs.slice(0, 6).map((p: any, i: number) => ({
            name: p.name || p.title,
            cat: p.category || 'General',
            enrolled: p.enrolled_count || [85, 62, 94, 45, 78, 56][i % 6],
            done: p.completed_count || [42, 38, 67, 28, 51, 33][i % 6],
          })));
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoadingPrograms(false);
      }
    }
    fetchPrograms();
  }, []);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.program.toLowerCase().includes(search.toLowerCase()));

  const activity = [
    { msg: 'Marcus J. enrolled in Barber', time: '15m ago', type: 'enroll' },
    { msg: 'Sarah M. completed CNA', time: '1h ago', type: 'complete' },
    { msg: '24 OJT hours verified', time: '2h ago', type: 'verify' },
    { msg: 'New partner onboarded', time: '4h ago', type: 'partner' },
  ];

  const reports = ['Enrollment Report', 'Completion Report', 'Attendance Records', 'WIOA Compliance', 'Partner Activity', 'Financial Summary'];

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Demo", href: "/demo" }, { label: "Admin" }]} />
      </div>
<div className="bg-blue-600 text-white text-center py-3 px-2 text-xs"><Info className="w-3 h-3 inline mr-1" />Live Demo - Admin Dashboard</div>
      
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 py-2">
          <Link href="/demo" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className="font-bold text-sm hidden sm:inline">Admin Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg relative"><Bell className="w-5 h-5 text-gray-600" /><span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" /></button>
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
                { label: 'Students', value: 312, icon: Users, color: 'text-blue-600' },
                { label: 'Programs', value: 12, icon: GraduationCap, color: 'text-green-600' },
                { label: 'Completion', value: '78%', icon: Circle, color: 'text-blue-600' },
                { label: 'Partners', value: 24, icon: Building2, color: 'text-orange-600' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border">
                  <div className="flex items-center gap-1.5 mb-1"><s.icon className={`w-4 h-4 ${s.color}`} /><span className="text-xs text-gray-500">{s.label}</span></div>
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
                  { stage: 'Enrolled', count: 28, color: 'bg-blue-500' },
                  { stage: 'Active', count: 312, color: 'bg-green-500' },
                  { stage: 'Done', count: 214, color: 'bg-blue-500' },
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
                    <div><div className="text-sm font-medium text-gray-900">{p.name}</div><div className="text-xs text-gray-500">{p.cat}</div></div>
                    <div className="text-right"><div className="font-bold text-gray-900">{p.enrolled}</div><div className="text-xs text-gray-500">enrolled</div></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-4 border">
                <h3 className="font-bold text-gray-900 mb-3">Activity</h3>
                {activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 py-2 border-b last:border-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                    <div><div className="text-sm text-gray-900">{a.msg}</div><div className="text-xs text-gray-400">{a.time}</div></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div><div className="text-sm font-medium text-amber-800">WIOA Deadline</div><div className="text-xs text-amber-700">Quarterly report due Jan 31</div></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'students' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
              </div>
              <button className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add</span></button>
            </div>
            <div className="bg-white rounded-xl border overflow-hidden">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50">
                  <Image src={s.avatar} alt={s.name} width={36} height={36} className="rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.program}</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{width:`${s.progress}%`}} /></div>
                    <span className="text-xs text-gray-500 w-8">{s.progress}%</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'programs' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold text-gray-900">Programs</h1>
              <button className="bg-orange-600 text-white px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {programs.map((p, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border hover:shadow-md transition">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.cat === 'Healthcare' ? 'bg-blue-100 text-blue-700' : p.cat === 'Trades' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{p.cat}</span>
                  <h3 className="font-bold text-gray-900 mt-2 mb-3">{p.name}</h3>
                  <div className="flex justify-between">
                    <div><div className="text-xl font-bold text-gray-900">{p.enrolled}</div><div className="text-xs text-gray-500">Enrolled</div></div>
                    <div><div className="text-xl font-bold text-green-600">{p.done}</div><div className="text-xs text-gray-500">Completed</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold text-gray-900">Reports</h1>
              <button className="bg-orange-600 text-white px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" />Export All</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reports.map((r, i) => (
                <button key={i} onClick={() => alert(`Generating ${r}...`)} className="bg-white rounded-xl p-4 border text-left hover:shadow-md transition">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3"><FileText className="w-5 h-5 text-orange-600" /></div>
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
