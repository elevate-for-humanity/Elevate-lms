'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, GraduationCap, Building2, Award, TrendingUp, AlertTriangle,
  BookOpen, DollarSign, Shield, FileText, BarChart3, Settings, Wrench,
  Video, Mail, Briefcase, Activity, CheckCircle2, Clock, ArrowUpRight,
  Zap, Target, ChevronRight, ChevronUp, ChevronDown, Download,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useMounted } from '@/lib/useMounted';
import {
  COLORS, STATUS_COLORS, MONTH_SHORT, AnimatedCounter, StatusDot,
  EmptyState, getGreeting, exportCSV,
} from './dashboard-helpers';
import type { DashboardData } from './types';

type Tab = 'overview' | 'enrollment' | 'programs';
type SortKey = 'full_name' | 'enrollment_status' | 'created_at';
type SortDir = 'asc' | 'desc';

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [studentSort, setStudentSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'created_at', dir: 'desc' });
  const [studentSearch, setStudentSearch] = useState('');
  const mounted = useMounted();
  const displayName = data.profile?.full_name?.split(' ')[0] || 'Admin';
  const greeting = mounted ? getGreeting() : 'Welcome';
  const c = data.counts;
  const certRate = c.enrollments > 0 ? Math.round((c.certificates / c.enrollments) * 100) : 0;

  // Chart data
  const enrollTrend = useMemo(() =>
    Object.entries(data.enrollmentsByMonth).sort(([a],[b]) => a.localeCompare(b))
      .map(([m, v]) => { const [y, mo] = m.split('-'); return { month: `${MONTH_SHORT[+mo-1]} ${y.slice(2)}`, enrollments: v }; }),
    [data.enrollmentsByMonth]);

  const studentStatusData = useMemo(() =>
    Object.entries(data.studentStatuses).map(([s, v]) => ({ name: s.replace('_',' '), value: v, color: STATUS_COLORS[s] || '#9ca3af' })),
    [data.studentStatuses]);

  const enrollStatusData = useMemo(() =>
    Object.entries(data.enrollmentStatuses).map(([s, v]) => ({ name: s.replace('_',' '), value: v, color: STATUS_COLORS[s] || '#9ca3af' })),
    [data.enrollmentStatuses]);

  const progressData = useMemo(() =>
    Object.entries(data.progressBuckets).map(([r, v]) => ({ range: r, count: v })),
    [data.progressBuckets]);

  // Sortable + searchable students
  const filteredStudents = useMemo(() => {
    let list = [...data.recentStudents];
    if (studentSearch) {
      const q = studentSearch.toLowerCase();
      list = list.filter(s => (s.full_name||'').toLowerCase().includes(q) || (s.email||'').toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[studentSort.key] ?? '';
      const bv = b[studentSort.key] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return studentSort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [data.recentStudents, studentSearch, studentSort]);

  function toggleSort(key: SortKey) {
    setStudentSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  }

  const sortIcon = (col: SortKey) => {
    if (studentSort.key !== col) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return studentSort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-blue-600" /> : <ChevronDown className="w-3 h-3 text-brand-blue-600" />;
  };

  const stats = [
    { label:'Students', value:c.students, icon:Users, href:'/admin/students', color:'#2563eb', bg:'bg-brand-blue-50', bd:'border-brand-blue-200', sub:`${certRate}% cert rate` },
    { label:'Programs', value:c.programs, icon:GraduationCap, href:'/admin/programs', color:'#10b981', bg:'bg-emerald-50', bd:'border-emerald-200', sub:`${c.programs} active` },
    { label:'Courses', value:c.courses, icon:BookOpen, href:'/admin/courses', color:'#8b5cf6', bg:'bg-purple-50', bd:'border-purple-200', sub:`${c.lessons} lessons` },
    { label:'Enrollments', value:c.enrollments, icon:TrendingUp, href:'/admin/enrollments', color:'#f59e0b', bg:'bg-amber-50', bd:'border-amber-200', sub:`across ${enrollTrend.length} months` },
    { label:'Certificates', value:c.certificates, icon:Award, href:'/admin/certificates', color:'#06b6d4', bg:'bg-teal-50', bd:'border-teal-200', sub:'issued to date' },
    { label:'Partners', value:c.partners, icon:Building2, href:'/admin/partners', color:'#6366f1', bg:'bg-indigo-50', bd:'border-indigo-200', sub:'organizations' },
    { label:'At Risk', value:c.atRisk, icon:AlertTriangle, href:'/admin/at-risk', color:'#ef4444', bg:'bg-brand-red-50', bd:'border-brand-red-200', sub:'need intervention' },
    { label:'Lessons', value:c.lessons, icon:FileText, href:'/admin/lessons', color:'#ec4899', bg:'bg-pink-50', bd:'border-pink-200', sub:'total content' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <Image src="/images/pages/admin-dashboard-client-hero.jpg" alt="Elevate for Humanity workforce training" fill sizes="100vw" className="object-cover" priority />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 -mt-6 relative z-20">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          {stats.map(s => (
            <Link key={s.label} href={s.href} className={`bg-white rounded-lg border ${s.bd} p-3 hover:shadow-md transition-all group`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-md ${s.bg} flex items-center justify-center`}><s.icon className="w-3.5 h-3.5" style={{color:s.color}} /></div>
                <ArrowUpRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
              </div>
              <div className="text-xl font-bold text-gray-900 leading-none"><AnimatedCounter target={s.value} /></div>
              <div className="text-[10px] font-semibold text-gray-600 mt-1">{s.label}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{s.sub}</div>
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-white rounded-lg border border-gray-200 p-1 w-fit">
          {(['overview','enrollment','programs'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab===t ? 'bg-brand-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-sm font-semibold text-gray-900">Enrollment Trend</h3><p className="text-xs text-gray-400">{c.enrollments} total across {enrollTrend.length} months</p></div>
                <Link href="/admin/enrollments" className="text-xs text-brand-blue-600 font-medium flex items-center gap-1">Details <ChevronRight className="w-3 h-3" /></Link>
              </div>
              {enrollTrend.length === 0 ? <EmptyState icon={BarChart3} title="No enrollment data yet" subtitle="Enrollments will appear as students register" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={enrollTrend}>
                    <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:'1px solid #e2e8f0'}} />
                    <Area type="monotone" dataKey="enrollments" stroke="#2563eb" strokeWidth={2} fill="url(#eg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Student Status</h3>
              <p className="text-xs text-gray-400 mb-3">{c.students} total</p>
              {studentStatusData.length === 0 ? <EmptyState icon={Users} title="No students" subtitle="Students appear after registration" /> : (<>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart><Pie data={studentStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                    {studentStatusData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie><Tooltip contentStyle={{fontSize:11,borderRadius:8}} /></PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">{studentStatusData.map(s => (
                  <Link key={s.name} href={`/admin/students?status=${s.name.replace(' ','_')}`} className="flex items-center justify-between text-xs hover:bg-gray-50 px-1 py-0.5 rounded">
                    <span className="flex items-center text-gray-600"><StatusDot color={s.color} />{s.name}</span>
                    <span className="font-semibold text-gray-900">{s.value}</span>
                  </Link>
                ))}</div>
              </>)}
            </div>
          </div>
        )}

        {/* Enrollment */}
        {tab === 'enrollment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Enrollment Status</h3>
              <p className="text-xs text-gray-400 mb-3">{c.enrollments} total</p>
              {enrollStatusData.length === 0 ? <EmptyState icon={TrendingUp} title="No enrollments" subtitle="Data appears after first enrollment" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={enrollStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={{fontSize:11,borderRadius:8}} />
                    <Bar dataKey="value" radius={[0,4,4,0]}>{enrollStatusData.map((e,i) => <Cell key={i} fill={e.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Progress Distribution</h3>
              <p className="text-xs text-gray-400 mb-3">Course completion across enrollments</p>
              {progressData.every(d => d.count === 0) ? <EmptyState icon={BarChart3} title="No progress data" subtitle="Progress tracked as students complete lessons" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{fontSize:11,borderRadius:8}} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Programs */}
        {tab === 'programs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Courses by Enrollment</h3>
              <p className="text-xs text-gray-400 mb-3">{data.topCourses.length} courses</p>
              {data.topCourses.length === 0 ? <EmptyState icon={BookOpen} title="No course enrollments" subtitle="Courses appear after students enroll" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.topCourses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:'#64748b'}} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={{fontSize:11,borderRadius:8}} />
                    <Bar dataKey="enrollments" radius={[0,4,4,0]}>{data.topCourses.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Program Status</h3>
              <p className="text-xs text-gray-400 mb-3">{c.programs} total</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={Object.entries(data.programStatuses).map(([k,v])=>({name:k,value:v}))} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {Object.keys(data.programStatuses).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie><Tooltip contentStyle={{fontSize:11,borderRadius:8}} /><Legend iconSize={8} wrapperStyle={{fontSize:11}} /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Bottom: Students Table + System */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-gray-400" /> Recent Students</h3>
              <div className="flex items-center gap-2">
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search..." className="text-xs px-2 py-1 border border-gray-200 rounded-md w-32 focus:outline-none focus:ring-1 focus:ring-brand-blue-500" />
                <button onClick={() => exportCSV(data.recentStudents.map(s => ({ Name: s.full_name||'', Email: s.email||'', Status: s.enrollment_status||'', Registered: s.created_at ? new Date(s.created_at).toLocaleDateString('en-US') : '' })), 'students-export.csv')} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Export CSV"><Download className="w-3.5 h-3.5" /></button>
                <Link href="/admin/students" className="text-xs text-brand-blue-600 font-medium">View all</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                      <span className="flex items-center gap-1">Student {sortIcon("full_name")}</span>
                    </th>
                    <th className="px-5 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('enrollment_status')}>
                      <span className="flex items-center gap-1">Status {sortIcon("enrollment_status")}</span>
                    </th>
                    <th className="px-5 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                      <span className="flex items-center gap-1">Registered {sortIcon("created_at")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={3}><EmptyState icon={Users} title={studentSearch ? 'No matching students' : 'No students yet'} subtitle={studentSearch ? 'Try a different search' : 'Students appear after registration'} /></td></tr>
                  ) : filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href=`/admin/learner/${s.id}`}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor:STATUS_COLORS[s.enrollment_status||'pending']||'#9ca3af'}}>
                            {(s.full_name||s.email||'?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900">{s.full_name||'Unknown'}</div>
                            <div className="text-[10px] text-gray-400">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:(STATUS_COLORS[s.enrollment_status||'pending']||'#9ca3af')+'20',color:STATUS_COLORS[s.enrollment_status||'pending']||'#9ca3af'}}>
                          <StatusDot color={STATUS_COLORS[s.enrollment_status||'pending']||'#9ca3af'} />{(s.enrollment_status||'pending').replace('_',' ')}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-[10px] text-gray-400">{s.created_at ? new Date(s.created_at).toLocaleDateString('en-US') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-gray-400" /> System</h3>
              <div className="space-y-2.5">
                {['Database','Auth','RBAC','Audit Log'].map(l => (
                  <div key={l} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{l}</span>
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium"><CheckCircle2 className="w-2.5 h-2.5" /> OK</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-600">Role</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{data.profile?.role||'admin'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Data as of</span>
                  <span className="text-[10px] text-gray-400">{data.generatedAt ? new Date(data.generatedAt).toLocaleDateString('en-US') : '—'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                {[
                  {l:'HVAC Activation',h:'/admin/hvac-activation',i:Zap,badge:'NEW'},
                  {l:'Course Builder',h:'/admin/course-builder',i:BookOpen},
                  {l:'Reports',h:'/admin/reporting',i:BarChart3},
                  {l:'Compliance',h:'/admin/compliance',i:Shield},
                  {l:'Funding',h:'/admin/funding',i:DollarSign},
                  {l:'Settings',h:'/admin/settings',i:Settings},
                ].map(a => (
                  <Link key={a.l} href={a.h} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-brand-blue-50 hover:text-brand-blue-700 transition-colors group">
                    <span className="flex items-center gap-2"><a.i className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-blue-600" />{a.l}</span>
                    <span className="flex items-center gap-1">
                      {a.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{a.badge}</span>}
                      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-brand-blue-500" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
