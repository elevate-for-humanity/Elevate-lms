'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Palette,
  Shield,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getRoleDestinationUrl } from '@/lib/auth/role-destinations';
import { PortalRouter } from '@/lib/routing/portal-router';
import { MARKETING_HOST } from '@/lib/routing/portal-map';
import { logger } from '@/lib/logger';

interface Dashboard {
  id: string;
  name: string;
  href: string;
  icon: string;
  description: string;
  color: string;
  roles: string[];
  order_index: number;
}

interface Props {
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  GraduationCap,
  Users,
  Building2,
  Briefcase,
  BookOpen,
  Palette,
  LayoutDashboard,
};

/**
 * Canonical dashboard inventory. Host/path ownership comes from PortalRouter;
 * there is no second database-driven route registry to drift out of sync.
 */
const DEFAULT_DASHBOARDS: Dashboard[] = [
  {
    id: 'student',
    name: 'My Learning',
    href: PortalRouter.get('lms'),
    icon: 'GraduationCap',
    description: 'Courses, progress, and certificates',
    color: 'text-brand-blue-600',
    roles: ['student', 'delegate', 'grant_client'],
    order_index: 1,
  },
  {
    id: 'apprentice',
    name: 'Apprentice Portal',
    href: PortalRouter.get('apprentice'),
    icon: 'BookOpen',
    description: 'OJT hours, RTI, documents, and competencies',
    color: 'text-indigo-600',
    roles: ['apprentice'],
    order_index: 2,
  },
  {
    id: 'instructor',
    name: 'Instructor Portal',
    href: PortalRouter.get('instructor'),
    icon: 'BookOpen',
    description: 'Students, submissions, and courses',
    color: 'text-indigo-600',
    roles: ['instructor'],
    order_index: 3,
  },
  {
    id: 'employer',
    name: 'Employer Portal',
    href: PortalRouter.get('employer'),
    icon: 'Briefcase',
    description: 'Jobs, candidates, and apprentices',
    color: 'text-brand-orange-600',
    roles: ['employer', 'sponsor'],
    order_index: 4,
  },
  {
    id: 'host-shop',
    name: 'Host Shop Portal',
    href: PortalRouter.get('hostshop'),
    icon: 'Building2',
    description: 'Apprentices, hours, documents, and compliance',
    color: 'text-purple-600',
    roles: ['partner', 'host_shop', 'host_shop_admin'],
    order_index: 5,
  },
  {
    id: 'program-holder',
    name: 'Program Holder',
    href: PortalRouter.get('programholder'),
    icon: 'Building2',
    description: 'Programs, students, hours, and documents',
    color: 'text-purple-600',
    roles: ['program_holder'],
    order_index: 6,
  },
  {
    id: 'provider',
    name: 'Provider Portal',
    href: PortalRouter.get('provider'),
    icon: 'Building2',
    description: 'Programs, enrollments, and compliance',
    color: 'text-purple-600',
    roles: ['provider_admin'],
    order_index: 7,
  },
  {
    id: 'case-manager',
    name: 'Case Manager',
    href: PortalRouter.get('casemanager'),
    icon: 'Users',
    description: 'Caseload and workforce placements',
    color: 'text-brand-green-600',
    roles: ['case_manager'],
    order_index: 8,
  },
  {
    id: 'workforce-board',
    name: 'Workforce Board',
    href: PortalRouter.get('workforceboard'),
    icon: 'LayoutDashboard',
    description: 'Regional workforce oversight',
    color: 'text-slate-600',
    roles: ['workforce_board'],
    order_index: 9,
  },
  {
    id: 'staff',
    name: 'Staff Portal',
    href: PortalRouter.get('staff'),
    icon: 'Users',
    description: 'Students, attendance, and operations',
    color: 'text-brand-green-600',
    roles: ['staff'],
    order_index: 10,
  },
  {
    id: 'testing',
    name: 'Testing Center',
    href: PortalRouter.get('testing'),
    icon: 'Shield',
    description: 'Bookings, sessions, slots, and proctoring',
    color: 'text-brand-red-600',
    roles: ['test_admin', 'proctor'],
    order_index: 11,
  },
  {
    id: 'creator',
    name: 'Creator Studio',
    href: `${MARKETING_HOST}/creator/products`,
    icon: 'Palette',
    description: 'Build and publish learning products',
    color: 'text-pink-600',
    roles: ['creator'],
    order_index: 12,
  },
  {
    id: 'admin',
    name: 'Admin',
    href: PortalRouter.get('admin'),
    icon: 'Shield',
    description: 'Platform administration',
    color: 'text-brand-red-600',
    roles: ['admin', 'org_admin'],
    order_index: 13,
  },
];

export function DashboardDropdown({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [primaryRole, setPrimaryRole] = useState<string>('student');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentDashboards, setRecentDashboards] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const [{ data: profile }, { data: roleRows }, { data: recentVisits }] = await Promise.all([
          supabase.from('profiles').select('role, roles').eq('id', user.id).maybeSingle(),
          supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
          supabase
            .from('user_activity')
            .select('metadata')
            .eq('user_id', user.id)
            .eq('activity_type', 'dashboard_visit')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const profileRole = typeof profile?.role === 'string' ? profile.role : 'student';
        const jsonRoles = Array.isArray(profile?.roles)
          ? profile.roles.filter((role: unknown): role is string => typeof role === 'string')
          : [];
        const secondaryRoles = (roleRows || [])
          .map((row: any) => row.roles?.name)
          .filter((role: unknown): role is string => typeof role === 'string');

        setPrimaryRole(profileRole);
        setUserRoles(Array.from(new Set([profileRole, ...jsonRoles, ...secondaryRoles])));

        setRecentDashboards(
          (recentVisits || [])
            .map((visit: any) => visit.metadata?.dashboard_href)
            .filter((href: unknown): href is string => typeof href === 'string'),
        );
      } catch (error) {
        logger.error('Error fetching dashboard navigation data:', error);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  const filteredDashboards = useMemo(() => {
    if (userRoles.includes('admin') || userRoles.includes('org_admin')) {
      return DEFAULT_DASHBOARDS;
    }

    return DEFAULT_DASHBOARDS.filter((dashboard) =>
      dashboard.roles.some((role) => userRoles.includes(role)),
    );
  }, [userRoles]);

  const sortedDashboards = useMemo(
    () =>
      [...filteredDashboards].sort((a, b) => {
        const aRecent = recentDashboards.indexOf(a.href);
        const bRecent = recentDashboards.indexOf(b.href);
        if (aRecent !== -1 && bRecent === -1) return -1;
        if (bRecent !== -1 && aRecent === -1) return 1;
        if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
        return a.order_index - b.order_index;
      }),
    [filteredDashboards, recentDashboards],
  );

  const trackVisit = async (dashboard: Dashboard) => {
    setIsOpen(false);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: 'dashboard_visit',
        metadata: { dashboard_href: dashboard.href, dashboard_name: dashboard.name },
      });
    } catch {
      // Navigation must never fail because telemetry could not be recorded.
    }
  };

  const myDashboardHref = getRoleDestinationUrl(primaryRole);

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboards</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Your Dashboards</span>
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {sortedDashboards.map((dashboard) => {
                  const Icon = ICON_MAP[dashboard.icon] || LayoutDashboard;
                  const isRecent = recentDashboards.includes(dashboard.href);

                  return (
                    <Link
                      key={dashboard.id}
                      href={dashboard.href}
                      onClick={() => void trackVisit(dashboard)}
                      className={`flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition group ${
                        isRecent ? 'bg-brand-blue-50/50' : ''
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mt-0.5 ${dashboard.color} group-hover:scale-110 transition`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 group-hover:text-brand-blue-600 flex items-center gap-2">
                          {dashboard.name}
                          {isRecent && (
                            <span className="text-xs bg-brand-blue-100 text-brand-blue-600 px-1.5 py-0.5 rounded">
                              Recent
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{dashboard.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 p-2 bg-slate-50">
              <Link
                href={myDashboardHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-blue-600 hover:bg-white rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                My Dashboard
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardDropdown;
