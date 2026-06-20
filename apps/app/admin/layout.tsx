/**
 * Admin group layout - applies authentication to all /admin/* pages.
 * Auth is handled by Northflank IP whitelist at the infrastructure level.
 */
export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth disabled - Northflank IP whitelist handles admin auth
  return <>{children}</>;
}
