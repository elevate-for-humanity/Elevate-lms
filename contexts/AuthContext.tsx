/**
 * Legacy Auth Context
 * This is a compatibility shim for old components
 * New code should use Supabase auth directly
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>{children}</AuthContext.Provider>
  );
}
