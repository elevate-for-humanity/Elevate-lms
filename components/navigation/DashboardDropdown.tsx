'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  Briefcase,
  BookOpen,
  Palette,
  Shield,
  ShoppingBag,
  ChevronDown,
  Sparkles,
  Loader2,
  LucideIcon,
} from 'lucide-react';

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
  Sparkles,
  ShoppingBag,
  LayoutDashboard,
};

const DEFAULT_DASHBOARDS: Dashboard[] = [
  { id: '1', name: 'Admin', href: '/admin/dashboard', icon: 'Shield', description: 'System management', color: 'text-red-600', roles: ['admin', 'super_admin'], order_index: 1 },
  { id: '2', name: 'Student', href: '/lms/dashboard', icon: 'GraduationCap', description: 'Learning portal', color: 'text-blue-600', roles: ['student', 'user'], order_index: 2 },
  { id: '3', name: 'Staff', href: '/staff-portal/dashboard', icon: 'Users', description: 'Support operations', color: 'text-green-600', roles: ['staff', 'admin'], order_index: 3 },
  { id: '4', name: 'Program Holder', href: '/program-holder/dashboard', icon: 'Building2', description: 'Training providers', color: 'text-purple-600', roles: ['program_holder', 'admin'], order_index: 4 },
  { id: '5', name: 'Employer', href: '/employer/dashboard', icon: 'Briefcase', description: 'Hiring portal', color: 'text-orange-600', roles: ['employer'], order_index: 5 },
  { id: '6', name: 'Instructor', href: '/instructor/dashboard', icon: 'BookOpen', description: 'Teaching tools', color: 'text-indigo-600', roles: ['instructor', 'admin'], order_index: 6 },
  { id: '7', name: 'Creator', href: '/creator/dashboard', icon: 'Palette', description: 'Community courses', color: 'text-pink-600', roles: ['creator', 'user'], order_index: 7 },
  { id: '8', name: 'AI Studio', href: '/ai-studio', icon: 'Sparkles', description: 'AI video & media', color: 'text-purple-600', roles: ['user'], order_index: 8 },
  { id: '9', name: 'Delegate', href: '/delegate/dashboard', icon: 'Shield', description: 'Moderation', color: 'text-yellow-600', roles: ['delegate', 'admin'], order_index: 9 },
  { id: '10', name: 'Shop', href: '/shop/dashboard', icon: 'ShoppingBag', description: 'Store management', color: 'text-teal-600', roles: ['shop_owner', 'admin'], order_index: 10 },
];

export function DashboardDropdown({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboards, setDashboards] = useState<Dashboard[]>(DEFAULT_DASHBOARDS);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentDashboards, setRecentDashboards] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      try {
        // Get current user and their roles
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch user profile with roles
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, roles')
            .eq('id', user.id)
            .single();

          if (profile) {
            const roles = profile.roles || [profile.role || 'user'];
            setUserRoles(Array.isArray(roles) ? roles : [roles]);
          }

          // Fetch recent dashboard visits
          const { data: recentVisits } = await supabase
            .from('user_activity')
            .select('metadata')
            .eq('user_id', user.id)
            .eq('activity_type', 'dashboard_visit')
            .order('created_at', { ascending: false })
            .limit(3);

          if (recentVisits) {
            const recent = recentVisits
              .map((v: any) => v.metadata?.dashboard_href)
              .filter(Boolean);
            setRecentDashboards(recent);
          }
        }

        // Try to fetch dashboards from database
        const { data: dbDashboards, error } = await supabase
          .from('dashboards')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!error && dbDashboards && dbDashboards.length > 0) {
          setDashboards(dbDashboards);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Track dashboard visit
  const trackVisit = async (dashboard: Dashboard) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: 'dashboard_visit',
        metadata: { dashboard_href: dashboard.href, dashboard_name: dashboard.name },
      }).catch(() => {}); // Ignore errors
    }
    
    setIsOpen(false);
  };

  // Filter dashboards based on user roles (show all if admin or no roles set)
  const filteredDashboards = userRoles.includes('admin') || userRoles.includes('super_admin')
    ? dashboards
    : dashboards.filter(d => 
        d.roles.some(role => userRoles.includes(role)) || 
        d.roles.includes('user') ||
        userRoles.length === 0
      );

  // Sort with recent dashboards first
  const sortedDashboards = [...filteredDashboards].sort((a, b) => {
    const aRecent = recentDashboards.indexOf(a.href);
    const bRecent = recentDashboards.indexOf(b.href);
    if (aRecent !== -1 && bRecent === -1) return -1;
    if (bRecent !== -1 && aRecent === -1) return 1;
    if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
    return a.order_index - b.order_index;
  });

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-slate-100 rounded-lg transition"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboards</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Your Dashboards</span>
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>

              {recentDashboards.length > 0 && (
                <div className="px-3 py-1 text-xs text-blue-600 font-medium">
                  Recently visited
                </div>
              )}

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {sortedDashboards.map((dashboard) => {
                  const Icon = ICON_MAP[dashboard.icon] || LayoutDashboard;
                  const isRecent = recentDashboards.includes(dashboard.href);
                  
                  return (
                    <Link
                      key={dashboard.id}
                      href={dashboard.href}
                      onClick={() => trackVisit(dashboard)}
                      className={`flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition group ${
                        isRecent ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mt-0.5 ${dashboard.color} group-hover:scale-110 transition`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 flex items-center gap-2">
                          {dashboard.name}
                          {isRecent && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                              Recent
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dashboard.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 p-2 bg-slate-50">
              <Link
                href="/dashboards"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-white rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                View All Dashboards
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardDropdown;
