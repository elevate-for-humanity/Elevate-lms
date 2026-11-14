'use client';

import { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CommunityFollowButton({ currentUserId, memberId, initialFollowing = false }: { currentUserId: string; memberId: string; initialFollowing?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (currentUserId === memberId) return null;

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError('');
    const supabase = createClient();
    const result = following
      ? await supabase.from('community_follows').delete().eq('follower_id', currentUserId).eq('following_id', memberId)
      : await supabase.from('community_follows').insert({ follower_id: currentUserId, following_id: memberId });
    if (result.error) setError('Could not update connection.');
    else setFollowing(!following);
    setBusy(false);
  }

  return (
    <div>
      <button onClick={toggle} disabled={busy} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold transition disabled:opacity-50 ${following ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>
        {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {busy ? 'Saving…' : following ? 'Following' : 'Follow'}
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
