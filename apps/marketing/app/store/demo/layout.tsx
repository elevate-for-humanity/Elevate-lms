import StoreDemoAdvisor from '@/components/store/StoreDemoAdvisor';

export const metadata = {
  title: 'Store Demo',
  robots: { index: false, follow: true },
};

export default function StoreDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="min-w-0">{children}</div>
      <div className="mx-auto max-w-6xl px-4 pb-8">
        <StoreDemoAdvisor />
      </div>
    </div>
  );
}
