'use client';

/**
 * Client-only header utilities (search + language).
 * Kept in one client island so the marketing Header can stay a Server Component
 * without bundling SearchModal into the root layout server chunk.
 */
import dynamic from 'next/dynamic';
import LanguageSwitcher from './LanguageSwitcher.client';

const SearchModal = dynamic(() => import('./SearchModal.client'), {
  ssr: false,
  loading: () => (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400"
      aria-hidden="true"
    />
  ),
});

export default function HeaderUtilities() {
  return (
    <>
      <SearchModal />
      <LanguageSwitcher />
    </>
  );
}
