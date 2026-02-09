'use client';

import { createClient } from '@/lib/supabase/client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User as UserIcon, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { getDashboardUrl } from '@/config/dashboard-routes';

// Simple sanitization without jsdom dependency
function sanitizeText(text: string): string {
  if (!text) return '';
  return text.replace(/[<>]/g, '');
}

interface UserMenuProps {
  user: User | null;
  isLoading: boolean;
}

export function UserMenu({ user, isLoading }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load user profile from DB for avatar and display name
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role, email')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
    loadProfile();
  }, [user?.id, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      // Silent fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <Link
          href="/login"
          className="text-black hover:text-blue-600 font-medium transition"
        >
          Sign In
        </Link>
        <Link
          href="/apply"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Apply Now
        </Link>
      </div>
    );
  }

  const displayName = user.firstName 
    ? sanitizeText(user.firstName) 
    : user.email?.split('@')[0] || 'User';
  
  const initials = user.firstName?.[0] || user.email?.[0] || 'U';

  return (
    <div className="hidden lg:flex items-center gap-4" ref={menuRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-2 text-black hover:text-blue-600 font-medium transition"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls="user-menu"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {initials.toUpperCase()}
          </div>
          <span className="hidden xl:inline">{displayName}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            id="user-menu"
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            role="menu"
          >
            <Link
              href={getDashboardUrl(user.role)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100 transition"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100 transition"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition text-left"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
