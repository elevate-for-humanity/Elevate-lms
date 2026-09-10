export const dynamic = 'force-dynamic';

/**
 * The /case-manager layout already owns authorization and the single shared
 * PlatformShell. Keep this nested dashboard boundary presentation-neutral so
 * navigation, PARIS, and mobile controls are never mounted twice.
 */
export default function CaseManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
