'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Group = {
  id: string;
  name: string;
  topic: string | null;
  description: string | null;
  next_session: string | null;
  max_members: number | null;
  created_by: string | null;
  member_count: number | null;
  study_group_members?: { count: number }[];
};

export default function GroupsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [groups, setGroups] = useState<Group[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setUserId(uid);

    const { data, error: groupError } = await supabase
      .from('study_groups')
      .select(
        'id, name, topic, description, next_session, max_members, created_by, member_count, study_group_members(count)',
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (groupError) {
      setError('Groups could not be loaded.');
      setGroups([]);
    } else {
      setGroups((data ?? []) as Group[]);
    }

    if (uid) {
      const { data: memberships, error: membershipError } = await supabase
        .from('study_group_members')
        .select('study_group_id')
        .eq('user_id', uid);

      if (membershipError) {
        setError('Your group memberships could not be loaded.');
      } else {
        setJoined(new Set((memberships ?? []).map((item) => item.study_group_id)));
      }
    } else {
      setJoined(new Set());
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => Number(joined.has(b.id)) - Number(joined.has(a.id))),
    [groups, joined],
  );

  async function toggleMembership(groupId: string) {
    if (!userId) {
      setError('Sign in to join a group.');
      return;
    }

    setError('');
    if (joined.has(groupId)) {
      const { error: leaveError } = await supabase
        .from('study_group_members')
        .delete()
        .eq('study_group_id', groupId)
        .eq('user_id', userId);

      if (leaveError) {
        setError('Could not leave this group.');
        return;
      }
    } else {
      const { error: joinError } = await supabase
        .from('study_group_members')
        .insert({ study_group_id: groupId, user_id: userId });

      if (joinError) {
        setError('Could not join this group.');
        return;
      }
    }

    await load();
  }

  async function createGroup() {
    if (!userId || !name.trim()) return;

    setError('');
    const { data: created, error: createError } = await supabase
      .from('study_groups')
      .insert({
        name: name.trim(),
        topic: topic.trim() || null,
        description: description.trim() || null,
        created_by: userId,
        is_active: true,
      })
      .select('id')
      .single();

    if (createError || !created) {
      setError('Could not create the group.');
      return;
    }

    const { error: membershipError } = await supabase
      .from('study_group_members')
      .insert({ study_group_id: created.id, user_id: userId });

    if (membershipError) {
      setError('The group was created, but your membership could not be added automatically.');
    }

    setName('');
    setTopic('');
    setDescription('');
    setShowCreate(false);
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-blue-600">
              <Users className="h-5 w-5" />
              <span className="text-sm font-bold">Elevate Community</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Groups</h1>
            <p className="mt-2 text-slate-600">
              Join your cohort, study group, career circle, or professional interest group.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            disabled={!userId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-3 font-bold text-white hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Create group
          </button>
        </header>

        {showCreate && userId && (
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Group name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-blue-500"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Topic or program
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={120}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-blue-500"
              />
            </label>
            <label className="text-sm font-bold text-slate-700 md:col-span-2">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-blue-500"
              />
            </label>
            <div className="flex justify-end md:col-span-2">
              <button
                type="button"
                onClick={() => void createGroup()}
                disabled={!name.trim()}
                className="rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white disabled:opacity-40"
              >
                Create group
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : sortedGroups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            No groups have been created yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedGroups.map((group) => {
              const relationalCount = group.study_group_members?.[0]?.count;
              const memberCount = relationalCount ?? group.member_count ?? 0;
              const isJoined = joined.has(group.id);
              const isFull = Boolean(group.max_members && memberCount >= group.max_members);

              return (
                <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">{group.name}</h2>
                      {group.topic && (
                        <p className="mt-1 text-sm font-semibold text-brand-blue-600">{group.topic}</p>
                      )}
                    </div>
                    {isJoined && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                        Joined
                      </span>
                    )}
                  </div>

                  {group.description && <p className="mt-3 text-sm text-slate-600">{group.description}</p>}
                  <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {memberCount} members
                      {group.max_members ? ` / ${group.max_members}` : ''}
                    </p>
                    {group.next_session && (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(group.next_session).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleMembership(group.id)}
                    disabled={!userId || (!isJoined && isFull)}
                    className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isJoined
                        ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                        : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                    }`}
                  >
                    {isJoined ? 'Leave group' : isFull ? 'Group full' : 'Join group'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
