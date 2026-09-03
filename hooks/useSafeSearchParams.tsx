'use client';

/**
 * useSafeSearchParams — drop-in replacement for useSearchParams() that never
 * causes a visible Suspense flash.
 *
 * Problem:
 *   Next.js App Router requires every component that calls useSearchParams()
 *   to be wrapped in a <Suspense> boundary. Without one, Next.js throws at
 *   build time. With one, the fallback renders visibly while the boundary
 *   resolves — causing skeleton flashes or "Loading" text across 95+ pages.
 *
 * Solution:
 *   1. A React context holds the resolved ReadonlyURLSearchParams value.
 *   2. SafeSearchParamsProvider owns the single <Suspense> boundary and the
 *      single useSearchParams() call for the entire subtree. It lives in
 *      PublicLayout and the LMS layout — one boundary per layout, not per page.
 *   3. useSafeSearchParams() reads from context. No Suspense boundary needed
 *      at the call site. Returns empty params during SSR (safe default).
 *   4. All call sites replace useSearchParams() with useSafeSearchParams()
 *      and remove their local <Suspense> wrappers.
 *
 * Usage:
 *   import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
 *   const searchParams = useSafeSearchParams();
 *   const program = searchParams.get('program') ?? '';
 *
 * Migration:
 *   - Replace: import { useSearchParams } from 'next/navigation';
 *   - With:    import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
 *   - Replace: const searchParams = useSearchParams();
 *   - With:    const searchParams = useSafeSearchParams();
 *   - Remove any <Suspense> wrapper that existed only for useSearchParams.
 */

import React, { createContext, useContext, Suspense } from 'react';
import { useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';

// ─── Context ─────────────────────────────────────────────────────────────────

const EMPTY_PARAMS = new URLSearchParams() as unknown as ReadonlyURLSearchParams;
const SearchParamsContext = createContext<ReadonlyURLSearchParams>(EMPTY_PARAMS);

// ─── Inner reader — the only component that calls useSearchParams() ───────────

function SearchParamsReader({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  return (
    <SearchParamsContext.Provider value={params}>
      {children}
    </SearchParamsContext.Provider>
  );
}

// ─── Fallback — renders children with empty params, no visible difference ────

function EmptyParamsFallback({ children }: { children: React.ReactNode }) {
  return (
    <SearchParamsContext.Provider value={EMPTY_PARAMS}>
      {children}
    </SearchParamsContext.Provider>
  );
}

// ─── Provider — place once per layout ────────────────────────────────────────
//
// The Suspense fallback renders children immediately with EMPTY_PARAMS so the
// page is visible with no flash. Once useSearchParams resolves, SearchParamsReader
// re-renders with real params — silently, with no layout shift.

export function SafeSearchParamsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<EmptyParamsFallback>{children}</EmptyParamsFallback>}>
      <SearchParamsReader>{children}</SearchParamsReader>
    </Suspense>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSafeSearchParams(): ReadonlyURLSearchParams {
  return useContext(SearchParamsContext);
}
