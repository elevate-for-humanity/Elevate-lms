'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type LearnerNotification = {
  id: string;
  source: 'core' | 'community';
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsClient({ userId, initialNotifications }: { userId: string; initialNotifications: LearnerNotification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const visible = useMemo(
    () => filter === 'unread' ? notifications.filter((item) => !item.read_at) : notifications,
    [filter, notifications],
  );

  async function markRead(notification: LearnerNotification) {
    if (notification.read_at) return;
    const now = new Date().toISOString();
    const supabase = createClient();
    const table = notification.source === 'community' ? 'community_notifications' : 'notifications';
    const { error } = await supabase.from(table).update({ read_at: now }).eq('id', notification.id).eq('user_id', userId);
    if (!error) setNotifications((items) => items.map((item) => item.id === notification.id && item.source === notification.source ? { ...item, read_at: now } : item));
  }

  async function markAllRead() {
    const supabase = createClient();
    const now = new Date().toISOString();
    const [core, community] = await Promise.all([
      supabase.from('notifications').update({ read_at: now }).eq('user_id', userId).is('read_at', null),
      supabase.from('community_notifications').update({ read_at: now }).eq('user_id', userId).is('read_at', null),
    ]);
    if (!core.error && !community.error) setNotifications((items) => items.map((item) => item.read_at ? item : { ...item, read_at: now }));
  }

  async function remove(notification: LearnerNotification) {
    const supabase = createClient();
    const table = notification.source === 'community' ? 'community_notifications' : 'notifications';
    const { error } = await supabase.from(table).delete().eq('id', notification.id).eq('user_id', userId);
    if (!error) setNotifications((items) => items.filter((item) => !(item.id === notification.id && item.source === notification.source)));
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue-600">Activity</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Notifications</h1>
          <p className="mt-1 text-slate-600">{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up.'}</p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"><CheckCheck className="h-4 w-4" />Mark all read</button>}
      </div>

      <div className="mt-5 flex gap-2">
        <button onClick={() => setFilter('all')} className={`rounded-lg px-4 py-2 text-sm font-bold ${filter === 'all' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>All</button>
        <button onClick={() => setFilter('unread')} className={`rounded-lg px-4 py-2 text-sm font-bold ${filter === 'unread' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Unread ({unreadCount})</button>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {visible.length ? <div className="divide-y divide-slate-200">{visible.map((notification) => {
          const body = <div className={`flex items-start gap-4 p-5 ${notification.read_at ? 'bg-white' : 'bg-brand-blue-50/60'}`}><div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Bell className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="font-black text-slate-900">{notification.title}</p><time className="flex-shrink-0 text-xs text-slate-500">{relativeTime(notification.created_at)}</time></div>{notification.message && <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>}<p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{notification.source === 'community' ? 'Community' : 'Elevate'}</p></div><div className="flex flex-shrink-0 gap-1">{!notification.read_at && <button onClick={(event) => { event.preventDefault(); void markRead(notification); }} className="rounded-lg p-2 text-slate-500 hover:bg-brand-blue-50 hover:text-brand-blue-700" aria-label="Mark notification read"><Check className="h-4 w-4" /></button>}<button onClick={(event) => { event.preventDefault(); void remove(notification); }} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label="Delete notification"><Trash2 className="h-4 w-4" /></button></div></div>;
          return notification.href ? <Link key={`${notification.source}-${notification.id}`} href={notification.href} onClick={() => void markRead(notification)} className="block hover:bg-slate-50">{body}</Link> : <div key={`${notification.source}-${notification.id}`}>{body}</div>;
        })}</div> : <div className="p-16 text-center"><Bell className="mx-auto h-14 w-14 text-slate-300" /><h2 className="mt-3 text-xl font-black text-slate-900">{filter === 'unread' ? 'No unread notifications' : 'No notifications'}</h2><p className="mt-1 text-sm text-slate-600">Course, message, event, comment, like, follow, and mention activity will appear here.</p></div>}
      </section>
    </main>
  );
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}
