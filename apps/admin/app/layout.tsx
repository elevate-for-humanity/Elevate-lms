/**
 * Admin group layout - shared UI wrapper with proper branding.
 * Auth check is handled by middleware to avoid redirect loops.
 */
import BuildVersionSync from '@/components/BuildVersionSync';
import { LiveChatWidget } from '@/components/support/LiveChatWidget';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminFooter } from '@/components/admin/AdminFooter';

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <BuildVersionSync />
      <AdminHeader />
      <main className="flex-1">
        {children}
      </main>
      <AdminFooter />
      <LiveChatWidget />
    </div>
  );
}
