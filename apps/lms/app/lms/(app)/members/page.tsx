'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, User, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Member = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  program_name?: string | null;
};

export default function MembersPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMembers() {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .not('full_name', 'is', null)
        .order('full_name', { ascending: true })
        .limit(250);

      if (fetchError) setError('Member directory is unavailable. Check the profiles RLS policy for authenticated directory access.');
      setMembers((data ?? []) as Member[]);
      setLoading(false);
    }
    loadMembers();
  }, [supabase]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) =>
      `${member.full_name ?? ''} ${member.role ?? ''}`.toLowerCase().includes(needle),
    );
  }, [members, query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <div className="mb-2 flex items-center gap-2 text-brand-blue-600"><Users className="h-5 w-5" /><span className="text-sm font-bold">Elevate Community</span></div>
          <h1 className="text-3xl font-black text-slate-900">Members</h1>
          <p className="mt-2 text-slate-600">Find classmates, instructors, apprentices, and other members of your learning community.</p>
        </header>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-blue-500" />
        </div>

        {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}</div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">No members match your search.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((member) => (
              <Link key={member.id} href={`/lms/members/${member.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-blue-300 hover:shadow-md">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{member.full_name ?? 'Member'}</p>
                  <p className="truncate text-sm capitalize text-slate-500">{member.role ?? 'Student'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
