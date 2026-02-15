
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PartnerLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMsg('An error occurred');
      return;
    }
    router.replace('/partners/dashboard');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <form
        onSubmit={signIn}
        className="w-full max-w-md border rounded-2xl p-6"
      >
        <h1 className="text-xl font-semibold">Partner Portal Login</h1>
        <p className="text-sm text-black mt-1">
          Site coordinators and partner staff sign in here.
        </p>

        <div className="mt-4 space-y-3">
          <input
            className="w-full border rounded-xl p-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-xl p-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full rounded-xl p-3 border bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors" aria-label="Action button">
            Sign in
          </button>
          {msg && <div className="text-sm text-brand-orange-600">{msg}</div>}
        </div>
      </form>
    </div>
  );
}
