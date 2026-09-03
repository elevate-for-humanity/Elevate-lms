import type React from 'react';

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function SectionLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Pulse className="h-7 w-48 mb-2" />
          <Pulse className="h-4 w-64" />
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4">
        <Pulse className="h-9 w-64 rounded-lg" />
        <Pulse className="h-9 w-32 rounded-lg" />
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex gap-4">
          {[120, 80, 100, 80, 60].map((w, i) => (
            <Pulse key={i} className={`h-3 w-${w === 120 ? "28" : w === 80 ? "20" : w === 100 ? "24" : w === 60 ? "16" : "20"}`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-4 border-b border-slate-50">
            <Pulse className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1">
              <Pulse className="h-3.5 w-36 mb-1.5" />
              <Pulse className="h-2.5 w-52" />
            </div>
            <Pulse className="h-5 w-16 rounded-full" />
            <Pulse className="h-5 w-20 rounded-full" />
            <Pulse className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

