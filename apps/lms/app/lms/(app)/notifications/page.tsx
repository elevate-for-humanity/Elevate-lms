import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Bell, Check, MessageSquare, UserPlus, Heart, AtSign, Calendar, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Notifications | Elevate LMS', description: 'View learner and community notifications.' };
export const dynamic = 'force-dynamic';

async function markAllRead() {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/notifications');
  const now = new Date().toISOString();
  await Promise.all([
    supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null),
    supabase.from('community_notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null),
  ]);
  revalidatePath('/lms/notifications');
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/notifications');

  const [coreResult, communityResult] = await Promise.all([
    supabase.from('notifications').select('id,type,title,message,action_url,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(75),
    supabase.from('community_notifications').select('id,type,title,message,href,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(75),
  ]);

  const notifications = [
    ...(coreResult.data ?? []).map((n: any) => ({ ...n, href: n.action_url ?? null, source: 'core' })),
    ...(communityResult.data ?? []).map((n: any) => ({ ...n, source: 'community' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 100);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue-600">Activity</p><h1 className="mt-1 text-3xl font-black text-slate-900">Notifications</h1><p className="mt-1 text-slate-600">{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up.'}</p></div>
        {unreadCount > 0 && <form action={markAllRead}><button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"><Check className="h-4 w-4" />Mark all read</button></form>}
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {notifications.length ? <div className="divide-y divide-slate-200">{notifications.map((notification) => {
          const Icon = iconFor(notification.type);
          const body = <div className={`flex items-start gap-4 p-5 ${notification.read_at ? 'bg-white' : 'bg-brand-blue-50/60'}`}><div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="font-black text-slate-900">{notification.title}</p><time className="flex-shrink-0 text-xs text-slate-500">{relativeTime(notification.created_at)}</time></div>{notification.message && <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>}<p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{notification.source === 'community' ? 'Community' : 'Elevate'}</p></div></div>;
          return notification.href ? <Link key={`${notification.source}-${notification.id}`} href={notification.href} className="block hover:bg-slate-50">{body}</Link> : <div key={`${notification.source}-${notification.id}`}>{body}</div>;
        })}</div> : <div className="p-16 text-center"><Bell className="mx-auto h-14 w-14 text-slate-300" /><h2 className="mt-3 text-xl font-black text-slate-900">No notifications</h2><p className="mt-1 text-sm text-slate-600">Course, message, event, comment, like, follow, and mention activity will appear here.</p></div>}
      </section>
    </main>
  );
}

function iconFor(type: string) {
  if (type === 'comment' || type === 'message') return MessageSquare;
  if (type === 'follow') return UserPlus;
  if (type === 'like') return Heart;
  if (type === 'mention') return AtSign;
  if (type === 'event' || type === 'assignment') return Calendar;
  if (type === 'alert') return AlertCircle;
  return Bell;
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
