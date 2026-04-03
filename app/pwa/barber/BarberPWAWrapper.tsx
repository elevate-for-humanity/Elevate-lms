'use client';

export function BarberPWAWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  );
}
