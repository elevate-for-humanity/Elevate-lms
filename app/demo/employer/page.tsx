'use client';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Info, Home, Users, Briefcase, DollarSign, Award, Star, ChevronRight, Plus, CheckCircle, MapPin, X } from 'lucide-react';



export default function EmployerDemo() {
  const [tab, setTab] = useState('pipeline');
  const [modal, setModal] = useState<number | null>(null);
  const [candidates, setCandidates] = useState([
    { id: 1, name: 'Sarah Mitchell', program: 'CNA', progress: 95, status: 'Interview', match: 95, avatar: '/images/gallery/image9.jpg' },
    { id: 2, name: 'James Thompson', program: 'CNA', progress: 88, status: 'Review', match: 88, avatar: '/images/testimonials/student-david.jpg' },
    { id: 3, name: 'Lisa Rodriguez', program: 'MA', progress: 67, status: 'Screen', match: 82, avatar: '/images/testimonials/testimonial-medical-assistant.jpg' },
    { id: 4, name: 'Michael Chen', program: 'Phlebotomy', progress: 100, status: 'Offer', match: 91, avatar: '/images/testimonials/student-marcus.jpg' },
  ]);

  const roles = [
    { id: 1, title: 'CNA - Day Shift', dept: 'Patient Care', loc: 'Downtown', apps: 8, status: 'Active' },
    { id: 2, title: 'CNA - Night Shift', dept: 'Patient Care', loc: 'West', apps: 5, status: 'Active' },
    { id: 3, title: 'Medical Assistant', dept: 'Outpatient', loc: 'Main', apps: 3, status: 'Active' },
    { id: 4, title: 'Phlebotomist', dept: 'Lab', loc: 'Downtown', apps: 12, status: 'Active' },
  ];

  const apprentices = [
    { id: 1, name: 'David Park', role: 'CNA', hours: 847, level: 'Intermediate', wage: '$16.50', avatar: '/images/testimonials/student-david.jpg' },
    { id: 2, name: 'Jennifer Lee', role: 'MA', hours: 456, level: 'Entry', wage: '$15.00', avatar: '/images/gallery/image9.jpg' },
    { id: 3, name: 'Robert Wilson', role: 'CNA', hours: 1203, level: 'Advanced', wage: '$18.00', avatar: '/images/testimonials/student-marcus.jpg' },
  ];

  const statusColor = (s: string) => s === 'Interview' ? 'bg-green-100 text-green-700' : s === 'Offer' ? 'bg-blue-100 text-blue-700' : s === 'Review' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';

  const updateStatus = (id: number, newStatus: string) => {
    setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Demo", href: "/demo" }, { label: "Employer" }]} />
      </div>
<div className="bg-blue-600 text-white text-center py-3 px-2 text-xs"><Info className="w-3 h-3 inline mr-1" />Live Demo - Employer Portal</div>
      
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 py-2">
          <Link href="/demo" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className="font-bold text-sm hidden sm:inline">Employer Portal</span>
          </Link>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">Metro Healthcare</div>
            <div className="text-xs text-gray-500">Indianapolis, IN</div>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 sm:hidden">
        <div className="flex justify-around py-2">
          {[
            { id: 'pipeline', icon: Users, label: 'Pipeline' },
            { id: 'roles', icon: Briefcase, label: 'Roles' },
            { id: 'apprentice', icon: Award, label: 'Apprentice' },
            { id: 'incentives', icon: DollarSign, label: 'Incentives' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center px-4 py-3 ${tab === t.id ? 'text-blue-600' : 'text-gray-500'}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="hidden sm:flex justify-center gap-1 py-2 bg-white border-b">
        {[
          { id: 'pipeline', icon: Users, label: 'Pipeline' },
          { id: 'roles', icon: Briefcase, label: 'Open Roles' },
          { id: 'apprentice', icon: Award, label: 'Apprenticeship' },
          { id: 'incentives', icon: DollarSign, label: 'Incentives' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <main className="p-3 pb-20 sm:pb-6 max-w-4xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Open Roles', value: 5 },
            { label: 'Hired YTD', value: 8, color: 'text-green-600' },
            { label: 'Apprentices', value: 3, color: 'text-blue-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border text-center">
              <div className={`text-xl font-bold ${s.color || 'text-gray-900'}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {tab === 'pipeline' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-3 bg-gray-50 border-b font-bold text-sm text-gray-900">Candidate Pipeline</div>
            {candidates.map(c => (
              <button key={c.id} onClick={() => setModal(c.id)} className="w-full flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50 text-left">
                <Image src={c.avatar} alt={c.name} width={36} height={36} className="rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.program}</div>
                </div>
                <div className="flex items-center gap-1 text-xs"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{c.match}%</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>{c.status}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {tab === 'roles' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button className="bg-blue-600 text-white px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" />Post Role</button>
            </div>
            {roles.map(r => (
              <div key={r.id} className="bg-white rounded-xl p-4 border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{r.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{r.dept}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.loc}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{r.apps}</div>
                    <div className="text-xs text-gray-500">applicants</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'apprentice' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-blue-900">Registered Apprenticeship</span>
              </div>
              <p className="text-sm text-blue-700">Indiana Dept of Labor • Healthcare Program</p>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-3 bg-gray-50 border-b font-bold text-sm text-gray-900">Current Apprentices</div>
              {apprentices.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 border-b last:border-0">
                  <Image src={a.avatar} alt={a.name} width={36} height={36} className="rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.role} Apprentice</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{a.hours}h</div>
                    <div className="text-xs text-blue-600">{a.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">{a.wage}</div>
                    <div className="text-xs text-gray-500">/hr</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-bold text-gray-900 mb-3">Wage Progression</h3>
              {[
                { level: 'Entry', wage: '$15.00', hours: '0-500' },
                { level: 'Intermediate', wage: '$16.50', hours: '501-1000' },
                { level: 'Advanced', wage: '$18.00', hours: '1001-1500' },
                { level: 'Journey', wage: '$20.00', hours: '1500+' },
              ].map((w, i) => (
                <div key={i} className="flex justify-between py-2 border-b last:border-0">
                  <div><div className="text-sm font-medium text-gray-900">{w.level}</div><div className="text-xs text-gray-500">{w.hours} hrs</div></div>
                  <div className="text-sm font-bold text-green-600">{w.wage}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'incentives' && (
          <div className="space-y-4">
            <div className="bg-green-600 rounded-xl p-4 text-white">
              <DollarSign className="w-8 h-8 mb-2 opacity-80" />
              <h2 className="text-lg font-bold mb-1">Hiring Incentives</h2>
              <p className="text-sm opacity-90 mb-3">Up to $50,000/year available</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: '$5K', l: 'Per hire' },
                  { v: '50%', l: 'OJT reimb' },
                  { v: '$2K', l: 'Per apprentice' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/20 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{s.v}</div>
                    <div className="text-[10px] opacity-80">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {[
              { name: 'Work Opportunity Tax Credit', amt: 'Up to $9,600', desc: 'Federal tax credit' },
              { name: 'OJT Reimbursement', amt: 'Up to 50%', desc: 'Wage reimbursement' },
              { name: 'Apprenticeship Credit', amt: 'Up to $2,000', desc: 'State tax credit' },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                    <p className="text-green-600 font-semibold text-sm">{p.amt}</p>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800"><Info className="w-3 h-3 inline mr-1" />Eligibility requirements apply. Contact workforce rep for details.</p>
            </div>
          </div>
        )}
      </main>

      {/* Candidate Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-xl p-4">
            {(() => {
              const c = candidates.find(x => x.id === modal);
              if (!c) return null;
              return (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Image src={c.avatar} alt={c.name} width={48} height={48} className="rounded-full" />
                      <div>
                        <h2 className="font-bold text-gray-900">{c.name}</h2>
                        <p className="text-sm text-gray-500">{c.program} Training</p>
                      </div>
                    </div>
                    <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{c.progress}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-600">{c.match}%</div>
                      <div className="text-xs text-gray-500">Match</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Update Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Screen', 'Review', 'Interview', 'Offer'].map(s => (
                        <button key={s} onClick={() => updateStatus(c.id, s)} className={`py-2 rounded-lg text-sm font-medium ${c.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setModal(null)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">Schedule Interview</button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
