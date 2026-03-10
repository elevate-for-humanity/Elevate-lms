'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { supa } from './supa';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'student' | 'instructor' | 'admin';
};

// React hook for auth state
export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supa.auth.getUser();
      if (user) {
        const { data } = await supa
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', user.id)
          .single();
        setUser(data as Profile);
      } else setUser(null);
      setLoading(false);
    })();

    const { data: sub } = supa.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        const { data } = await supa
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single();
        setUser(data as Profile);
      } else setUser(null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

// Legacy type for backward compatibility
export type User = {
  id: string;
  email: string;
  role?: string;
};

export async function signUp(email: string, password: string) {
  const { data, error } = await supa.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supa.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string) {
  const { data, error } = await supa.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/lms`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supa.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  // Uses server action — Supabase built-in SMTP is not configured
  const { sendRecoveryEmail } = await import('@/app/auth/forgot-password/actions');
  const result = await sendRecoveryEmail(email);
  if (!result.success && result.error) throw new Error(result.error);
  return null;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supa.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;

  // Get user role from profiles table
  const { data: profile } = await supa
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    role: profile?.role || 'student',
  };
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supa.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}
