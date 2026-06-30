'use client';

import { usePathname } from 'next/navigation';
import { PartnerProgramHolderShell } from '@/components/portal/PartnerProgramHolderShell';

/** Marketing landing only — no sidebar */
const NO_SHELL_PATHS = new Set(['/program-holder']);

export function ProgramHolderShellGate({
  children,
  role,
  userName,
  userEmail,
  orgName,
  hasSchoolApplications,
}: {
  children: React.ReactNode;
  role: string;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  hasSchoolApplications?: boolean;
}) {
  const pathname = usePathname() ?? '';

  if (NO_SHELL_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <PartnerProgramHolderShell
      role={role}
      userName={userName}
      userEmail={userEmail}
      orgName={orgName}
      hasSchoolApplications={hasSchoolApplications}
    >
      {children}
    </PartnerProgramHolderShell>
  );
}
