import useSWR from 'swr';
import { User, AuthResponse } from '@/types/user';

const fetcher = async (url: string): Promise<AuthResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    return { user: null };
  }
  return res.json();
};

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<AuthResponse>('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  });

  return {
    user: data?.user ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
