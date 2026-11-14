'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AtSign, Award, Bell, BookOpen, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type BellNotification = {
  key: string;
  id: string;
  source: 'core' | 'community';
  type: string;
  title: string;
  message: string;
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

export function NotificationBell() {
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<BellNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotifications([]); return; }

    const [core, community] = await Promise.all([
      supabase.from('notifications').select('id,type,title,message,action_url,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
      supabase.from('community_notifications').select('id,type,title,message,href,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    ]);

    const combined: BellNotification[] = [
      ...(core.data ?? []).map((n: any) => ({ key: `core-${n.id}`, id: n.id, source: 'core' as const, type: n.type ?? 'system', title: n.title ?? 'Notification', message: n.message ?? '', href: n.action_url ?? null, createdAt: n.created_at, readAt: n.read_at ?? null })),
      ...(community.data ?? []).map((n: any) => ({ key: `community-${n.id}`, id: n.id, source: 'community' as const, type: n.type ?? 'system', title: n.title ?? 'Community activity', message: n.message ?? '', href: n.href ?? '/lms/community', createdAt: n.created_at, readAt: n.read_at ?? null })),
    ];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(combined.slice(0, 20));
  }, [supabase]);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`lms-notifications-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { void fetchNotifications(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_notifications', filter: `user_id=eq.${user.id}` }, () => { void fetchNotifications(); })
        .subscribe();
    });
    return () => { if (channel) void supabase.removeChannel(channel); };
  }, [fetchNotifications, supabase]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function markAsRead(notification: BellNotification) {
    if (notification.readAt) return;
    const table = notification.source === 'community' ? 'community_notifications' : 'notifications';
    const now = new Date().toISOString();
    const { error } = await supabase.from(table).update({ read_at: now }).eq('id', notification.id);
    if (!error) setNotifications((current) => current.map((n) => n.key === notification.key ? { ...n, readAt: now } : n));
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null),
      supabase.from('community_notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null),
    ]);
    setNotifications((current) => current.map((n) => ({ ...n, readAt: n.readAt ?? now })));
  }

  return (
    <div className="relative shrink-0">
      <button onClick={() => { setIsOpen((open) => !open); void fetchNotifications(); }} className="relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange-600 px-1 text-[10px] font-black text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && <>
        <button className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setIsOpen(false)} />
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-4"><div><h3 className="font-black text-slate-900">Notifications</h3><p className="text-xs text-slate-500">Learning and community activity</p></div>{unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-black text-brand-blue-600 hover:underline">Mark all read</button>}</div>
          <div className="max-h-[28rem] overflow-y-auto">
            {notifications.length ? notifications.map((notification) => {
              const content = <div className={`flex gap-3 border-b border-slate-100 p-4 transition hover:bg-slate-50 ${notification.readAt ? '' : 'bg-brand-blue-50/70'}`}><div className="mt-0.5 rounded-lg bg-slate-100 p-2">{iconFor(notification.type)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-sm font-black text-slate-900">{notification.title}</p><span className="flex-shrink-0 text-[11px] text-slate-400">{timeAgo(notification.createdAt)}</span></div>{notification.message && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{notification.message}</p>}<div className="mt-2 flex items-center gap-3"><span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{notification.source === 'community' ? 'Community' : 'Elevate'}</span>{!notification.readAt && <button onClick={(event) => { event.preventDefault(); event.stopPropagation(); void markAsRead(notification); }} className="text-[11px] font-black text-brand-blue-600">Mark read</button>}</div></div></div>;
              return notification.href ? <Link key={notification.key} href={notification.href} onClick={() => { void markAsRead(notification); setIsOpen(false); }}>{content}</Link> : <div key={notification.key}>{content}</div>;
            }) : <div className="p-10 text-center"><Bell className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No notifications yet.</p></div>}
          </div>
          <Link href="/lms/notifications" onClick={() => setIsOpen(false)} className="block border-t border-slate-200 p-3 text-center text-sm font-black text-brand-blue-600 hover:bg-slate-50">View all notifications</Link>
        </div>
      </>}
    </div>
  );
}

function iconFor(type: string) {
  if (type === 'course' || type === 'assignment') return <BookOpen className="h-4 w-4 text-brand-blue-600" />;
  if (type === 'certificate') return <Award className="h-4 w-4 text-brand-orange-600" />;
  if (type === 'message' || type === 'comment') return <MessageSquare className="h-4 w-4 text-brand-green-600" />;
  if (type === 'like') return <Heart className="h-4 w-4 text-red-500" />;
  if (type === 'follow') return <UserPlus className="h-4 w-4 text-purple-600" />;
  if (type === 'mention') return <AtSign className="h-4 w-4 text-cyan-600" />;
  return <Bell className="h-4 w-4 text-slate-500" />;
}

function timeAgo(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
