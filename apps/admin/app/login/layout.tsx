export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-slate-950 flex flex-col px-4 py-6 sm:py-10">
      {children}
    </main>
  );
}
