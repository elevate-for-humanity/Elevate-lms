'use client';

import React from 'react';
import { 
  Bot, 
  Brain, 
  Shield, 
  Users, 
  Building2, 
  GraduationCap, 
  LayoutDashboard, 
  Search, 
  Workflow, 
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const TITANS = [
  { id: 'learner', label: 'Learner Portal', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'employer', label: 'Employer Portal', icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'admin', label: 'Central Admin', icon: LayoutDashboard, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
  { id: 'host', label: 'Host Shop', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'case', label: 'Case Manager', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'board', label: 'Workforce Board', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'instructor', label: 'Instructor Hub', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'studio', label: 'AI Dev Studio', icon: Bot, color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

export function WorkforceOSArchitecture() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-50 text-brand-blue-600 text-sm font-bold mb-4">
            <Brain className="w-4 h-4" />
            The Future of Workforce Infrastructure
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            The Multi-Tenant <span className="text-brand-blue-600">Workforce OS</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A unified ecosystem of 13 sovereign portals serving every stakeholder in the workforce pipeline—from state boards to small host shops.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {TITANS.map((titan) => (
            <div 
              key={titan.id}
              className="group p-6 rounded-2xl border border-slate-100 hover:border-brand-blue-200 hover:shadow-xl hover:shadow-brand-blue-100/20 transition-all cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${titan.bg} ${titan.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <titan.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{titan.label}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                Workforce Portal <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AI Feature */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Bot className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-brand-blue-400">Autonomous Engineering</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Course Builder Brain</h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Deploy state-certified curricula in minutes. Our engine processes federal labor data, state board requirements, and proprietary syllabi into live courses with verified O*NET matching.
              </p>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <span className="flex items-center gap-2"><Workflow className="w-4 h-4 text-brand-blue-500" /> Auto-Generated Modules</span>
                <span className="flex items-center gap-2"><Search className="w-4 h-4 text-brand-blue-500" /> O*NET Skill Sync</span>
              </div>
            </div>
          </div>

          {/* VR Feature */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-brand-blue-600">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Immersive OS</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">The Bosses: Immersive VR</h3>
              <p className="text-slate-600 mb-6 max-w-md">
                Moving beyond the video player. We integrate high-stakes proctoring and laboratory simulation through a proprietary VR Operating System embedded directly into the learner path.
              </p>
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-2 font-bold text-brand-blue-600 uppercase tracking-tighter italic">Live in Indiana</span>
                <span className="flex items-center gap-2 text-slate-400">| Fully Mobile Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
