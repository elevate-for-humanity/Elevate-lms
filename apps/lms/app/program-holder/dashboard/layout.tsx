import { requireProgramHolder } from '@/lib/auth/require-program-holder';
export const dynamic = 'force-dynamic';
/** The parent owns navigation; this boundary retains the full holder approval check. */
export default async function ProgramHolderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProgramHolder();
  return children;
}
