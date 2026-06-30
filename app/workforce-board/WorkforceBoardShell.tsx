'use client';

import { PortalShell, type PortalNavItem } from '@/components/ui/design-system';
import {
  LayoutDashboard, Users, BarChart3,
} from 'lucide-react';

const NAV: PortalNavItem[] = [
  { href: '/workforce-board',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/workforce-board/participants', label: 'Participants', icon: Users },
  { href: '/workforce-board/reports',      label: 'Reports',      icon: BarChart3 },
];

export default function WorkforceBoardShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}) {
  return (
    <PortalShell
      nav={NAV}
      portalName="Workforce Board"
      role="workforce_board"
      userName={userName}
      userEmail={userEmail}
      logoHref="/workforce-board"
    >
      {children}
    </PortalShell>
  );
}
