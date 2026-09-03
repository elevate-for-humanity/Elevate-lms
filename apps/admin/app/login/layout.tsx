export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {children}
    </main>
  );
}
