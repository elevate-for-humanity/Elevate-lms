'use client';

import { 
  Globe, 
  Zap, 
  Layers, 
  Eye, 
  ShieldCheck, 
  Monitor, 
  Activity,
  Cpu,
  Unplug
} from 'lucide-react';

export default function BossesVRStub() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-8 font-sans selection:bg-brand-blue-500/30">
      <div className="max-w-5xl mx-auto">
        {/* OS Header */}
        <header className="flex items-center justify-between mb-12 border-b border-white/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-brand-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] animate-pulse">
              <Globe className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-white">The Bosses</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Virtual Reality Operating System v4.0</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-slate-500 font-bold">Neural Link</span>
              <span className="text-xs font-mono text-emerald-500">STABLE</span>
            </div>
            <div className="flex flex-col items-end border-l border-white/10 pl-6">
              <span className="text-[10px] uppercase text-slate-500 font-bold">Latency</span>
              <span className="text-xs font-mono text-indigo-400">0.4ms</span>
            </div>
          </div>
        </header>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Immersive Proctoring */}
          <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl hover:border-brand-blue-500/50 transition-all group cursor-pointer">
            <div className="w-10 h-10 bg-brand-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Eye className="text-brand-blue-400 w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wide">Immersive Proctoring</h3>
            <p className="text-xs text-slate-500 leading-relaxed">360-degree spatial monitoring with gaze-tracking for remote state board exams.</p>
          </div>

          {/* Card 2: Skill Simulation */}
          <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl hover:border-indigo-500/50 transition-all group cursor-pointer">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="text-indigo-400 w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wide">Skill Simulations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Haptic-enabled training modules for barbering and clinical technical instruction.</p>
          </div>

          {/* Card 3: Spatial Counseling */}
          <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl hover:border-emerald-500/50 transition-all group cursor-pointer">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="text-emerald-400 w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-2 uppercase text-sm tracking-wide">Spatial Counseling</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Immersive 1-on-1 case management environments for high-barrier participant support.</p>
          </div>
        </div>

        {/* Technical Status */}
        <div className="bg-gradient-to-br from-[#111114] to-black border border-white/5 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Cpu className="w-32 h-32 text-indigo-500" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="text-indigo-400 w-6 h-6" />
                Sovereign VR Deployment
              </h2>
              <ul className="space-y-3">
                {[
                  'Meta Quest 3 / Vision Pro Native Support',
                  'Sub-millisecond State Synchronization',
                  'Encrypted Bio-metric Verification',
                  'O*NET Aligned Competency Engine'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all active:scale-95 flex items-center gap-3 uppercase text-xs tracking-widest">
                <Zap className="w-4 h-4 fill-current" />
                Initialize Demo
              </button>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <Monitor className="w-3 h-3" />
                Awaiting Hardware Handshake...
              </div>
            </div>
          </div>
        </div>

        {/* Footer Audit Signature */}
        <footer className="mt-12 flex items-center justify-between opacity-40 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider">
            <span className="text-indigo-400">ID: BOS-9912-X</span>
            <span>NODE: NORTHFLANK-IN-01</span>
          </div>
          <Unplug className="w-4 h-4" />
        </footer>
      </div>
    </div>
  );
}
