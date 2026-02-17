'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminHeader() {
  const router = useRouter();
  const supabase = createClient();
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load admin profile and notifications from DB
  useEffect(() => {
    async function loadAdminData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load admin profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single();
      if (profile) setAdminProfile(profile);

      // Load unread admin notifications
      const { count } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', user.id)
        .eq('read', false);
      setUnreadCount(count || 0);
    }
    loadAdminData();
  }, [supabase]);

  const handleSignOut = async () => {
    // Log admin signout
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: user?.id,
        action: 'signout',
        timestamp: new Date().toISOString()
      });

    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
