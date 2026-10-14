'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
export function CommunicationTodos({
  inboxPath = '/communications/email',
}: {
  inboxPath?: string;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    const db = createClient();
    let channel: any;
    let channelUser = '';
    let authTimer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) {
        if (active) {
          setItems([]);
          setSignedIn(false);
        }
        return;
      }
      const { data } = await db
        .from('notifications')
        .select('id,title,message,action_url,action_label')
        .eq('user_id', user.id)
        .eq('read', false)
        .in('type', ['message', 'announcement', 'reminder'])
        .order('created_at', { ascending: false })
        .limit(5);
      if (active) {
        setItems(data || []);
        setSignedIn(true);
      }
      return user;
    }
    async function setup() {
      const user = await load();
      if (!active || !user || channelUser === user.id) return;
      if (channel) await db.removeChannel(channel);
      channelUser = user.id;
      channel = db
        .channel(`communication-todos:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => void load(),
        )
        .subscribe();
    }
    void setup();
    const { data: listener } = db.auth.onAuthStateChange(() => {
      if (authTimer) clearTimeout(authTimer);
      authTimer = setTimeout(() => void setup(), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
      if (authTimer) clearTimeout(authTimer);
      if (channel) void db.removeChannel(channel);
    };
  }, []);
  if (!signedIn) return null;
  return (
    <section
      aria-label="New email and communication to-dos"
      className="mx-auto my-3 max-w-7xl space-y-2 px-4"
    >
      <nav aria-label="Interoffice communications">
        <a
          href={inboxPath}
          className="inline-flex min-h-11 items-center rounded-xl border border-blue-200 bg-white px-4 font-bold text-blue-900"
        >
          Interoffice email
        </a>
      </nav>
      {items.map((item) => (
        <article
          key={item.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-blue-300 bg-blue-50 p-4"
        >
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-blue-950">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-800">{item.message}</p>
          </div>
          <a
            href={
              item.action_url?.endsWith('/communications/email')
                ? inboxPath
                : item.action_url || inboxPath
            }
            className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white"
          >
            {item.action_label || 'Open email'}
          </a>
          <button
            type="button"
            onClick={async () => {
              const db = createClient();
              const { error } = await db
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', item.id);
              if (!error) setItems((current) => current.filter((n) => n.id !== item.id));
            }}
            className="rounded-lg border border-blue-300 px-3 py-2 font-bold text-blue-950"
          >
            Dismiss
          </button>
        </article>
      ))}
    </section>
  );
}
