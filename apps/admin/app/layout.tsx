/**
 * Admin group layout - shared UI wrapper only.
 * Auth check is handled by middleware to avoid redirect loops.
 */
import BuildVersionSync from '@/components/BuildVersionSync';
import { LiveChatWidget } from '@/components/support/LiveChatWidget';

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BuildVersionSync />
      {children}
      <LiveChatWidget />
    </>
  );
}
