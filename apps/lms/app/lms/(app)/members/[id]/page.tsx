'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Member = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  bio?: string | null;
};

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, bio')
        .eq('id', params.id)
        .maybeSingle();
      setMember((data as Member | null) ?? null);
      setLoading(false);
    }
    if (params.id) load();
  }, [params.id, supabase]);

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto h-56 max-w-3xl animate-pulse rounded-2xl bg-slate-200" /></main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/lms/members" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-blue-600"><ArrowLeft className="h-4 w-4" />Back to members</Link>
        {!member ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">This member profile is not available.</div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-9 w-9 text-slate-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-black text-slate-900">{member.full_name ?? 'Elevate Member'}</h1>
                <p className="mt-1 capitalize text-slate-500">{member.role ?? 'Student'}</p>
                {member.bio && <p className="mt-4 whitespace-pre-wrap text-slate-700">{member.bio}</p>}
              </div>
            </div>
            <div className="mt-7 border-t border-slate-100 pt-5">
              <Link href={`/lms/messages?recipient=${member.id}`} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-5 py-3 font-bold text-white hover:bg-brand-blue-700"><MessageSquare className="h-4 w-4" />Message member</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
