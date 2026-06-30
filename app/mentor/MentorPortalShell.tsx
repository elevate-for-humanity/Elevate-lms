'use client';

import { PortalShell, type PortalNavItem } from '@/components/ui/design-system';
import {
  LayoutDashboard, Users, CheckSquare, Calendar, MessageSquare, BookOpen,
} from 'lucide-react';

const NAV: PortalNavItem[] = [
  { href: '/mentor/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/mentor/mentees',    label: 'Mentees',    icon: Users },
  { href: '/mentor/approvals',  label: 'Approvals',  icon: CheckSquare },
  { href: '/mentor/sessions',   label: 'Sessions',   icon: Calendar },
  { href: '/mentor/messages',   label: 'Messages',   icon: MessageSquare },
  { href: '/mentor/resources',  label: 'Resources',  icon: BookOpen },
];

export default function MentorPortalShell({
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
      portalName="Mentor Portal"
      role="mentor"
      userName={userName}
      userEmail={userEmail}
      logoHref="/mentor/dashboard"
    >
      {children}
    </PortalShell>
  );
}
