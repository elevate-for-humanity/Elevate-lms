"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Settings,
  Award,
  BookOpen,
  LogOut,
  HelpCircle,
  Bell,
  CreditCard,
  Shield,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  roles?: string[];
}

interface NotificationCount {
  unread: number;
}

interface Props {
  className?: string;
}

export function ProfileDropdown({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationCount>({ unread: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, role, roles')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile({
            ...profileData,
            email: profileData.email || user.email || '',
          });
        } else {
          // Create basic profile from auth user
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url,
          });
        }

        // Fetch unread notifications count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        setNotifications({ unread: count || 0 });

      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (session?.user) {
        fetchUserData();
      }
    });

    // Subscribe to notification changes
    const notificationChannel = supabase
      .channel('profile-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          // Refetch notification count
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false)
                .then(({ count }) => {
                  setNotifications({ unread: count || 0 });
                });
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(notificationChannel);
    };
  }, []);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    
    try {
      // Log the sign out
      if (profile) {
        await supabase.from('user_activity').insert({
          user_id: profile.id,
          activity_type: 'sign_out',
        }).catch(() => {});
      }

      await supabase.auth.signOut();
      setIsOpen(false);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isAdmin = profile?.role === 'admin' || profile?.roles?.includes('admin');

  if (loading) {
    return (
      <div className={`w-10 h-10 rounded-full bg-gray-200 animate-pulse ${className || ''}`} />
    );
  }

  if (!profile) {
    return (
      <Link
        href="/login"
        className={`px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 ${className || ''}`}
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm">{getInitials(profile.full_name)}</span>
        )}
        
        {/* Notification badge */}
        {notifications.unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.unread > 9 ? '9+' : notifications.unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span>{getInitials(profile.full_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{profile.full_name}</div>
                <div className="text-sm text-gray-500 truncate">{profile.email}</div>
                {profile.role && (
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize">
                    {profile.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between text-sm">
            <Link href="/lms/courses" className="text-center hover:text-blue-600" onClick={() => setIsOpen(false)}>
              <div className="font-semibold text-gray-900">My Courses</div>
            </Link>
            <Link href="/lms/certificates" className="text-center hover:text-blue-600" onClick={() => setIsOpen(false)}>
              <div className="font-semibold text-gray-900">Certificates</div>
            </Link>
            <Link href="/notifications" className="text-center hover:text-blue-600 relative" onClick={() => setIsOpen(false)}>
              <div className="font-semibold text-gray-900">
                Notifications
                {notifications.unread > 0 && (
                  <span className="ml-1 text-xs text-red-500">({notifications.unread})</span>
                )}
              </div>
            </Link>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/lms/profile"
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                My Profile
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
            
            <Link
              href="/lms/courses"
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-gray-400" />
                My Courses
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
            
            <Link
              href="/lms/certificates"
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex items-center gap-3">
                <Award className="h-4 w-4 text-gray-400" />
                Certificates
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>

            <Link
              href="/notifications"
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-gray-400" />
                Notifications
                {notifications.unread > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                    {notifications.unread}
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>

            <Link
              href="/lms/settings"
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-gray-400" />
                Settings
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>

            <Link
              href="/billing"
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-gray-400" />
                Billing
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
          </div>

          {/* Admin Link */}
          {isAdmin && (
            <div className="border-t border-gray-100 py-2">
              <Link
                href="/admin"
                className="flex items-center justify-between px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50"
                onClick={() => setIsOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </span>
                <ChevronRight className="h-4 w-4 text-purple-300" />
              </Link>
            </div>
          )}

          {/* Help & Sign Out */}
          <div className="border-t border-gray-100 py-2">
            <Link
              href="/help"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <HelpCircle className="h-4 w-4 text-gray-400" />
              Help & Support
            </Link>
            
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
