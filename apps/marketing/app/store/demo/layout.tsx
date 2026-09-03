import ParisChat from '@/components/paris/ParisChat';

export const metadata = {
  title: 'Store Demo',
  robots: { index: false, follow: false },
};

export default function StoreDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">{children}</div>
      <aside className="border-l border-cyan-200 bg-white xl:sticky xl:top-0 xl:h-[100dvh]">
        <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-orange-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">PARIS · Live demo guide</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">Ask questions while you explore. PARIS can explain each workflow and help choose the right setup.</p>
        </div>
        <ParisChat surface="store" showHeader={false} voiceEnabled className="h-[calc(100dvh-92px)] min-h-[480px]" />
      </aside>
    </div>
  );
}
