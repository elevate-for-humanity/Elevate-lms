'use client';

/**
 * NotificationProvider
 *
 * Mounts once in the app shell. Subscribes to realtime INSERT events on the
 * `notifications` table for the current user and fires a react-hot-toast for
 * each new notification. The bell component handles the full list; this only
 * handles the live-arrival toast.
 */

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';

export function NotificationProvider() {
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`notif-toast:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const n = payload.new as {
              title?: string;
              message?: string;
              type?: string;
            };
            const title = n.title ?? 'New notification';
            const message = n.message ?? '';
            const isError = n.type === 'error';
            const isSuccess = n.type === 'success';

            if (isError) {
              toast.error(
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  {message && <p className="text-xs text-slate-500 mt-0.5">{message}</p>}
                </div>,
                { duration: 6000 },
              );
            } else if (isSuccess) {
              toast.success(
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  {message && <p className="text-xs text-slate-500 mt-0.5">{message}</p>}
                </div>,
                { duration: 5000 },
              );
            } else {
              toast(
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-brand-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    {message && <p className="text-xs text-slate-500 mt-0.5">{message}</p>}
                  </div>
                </div>,
                { duration: 5000 },
              );
            }
          },
        )
        .subscribe();
    }

    subscribe();

    return () => {
      if (channel) {
        const supabaseClient = createClient();
        supabaseClient.removeChannel(channel);
      }
    };
  }, []);

  // Renders nothing — side-effect only
  return null;
}
