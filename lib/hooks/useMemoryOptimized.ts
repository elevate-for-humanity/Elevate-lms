'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useStableCallback — returns a stable function reference that always calls
 * the latest version of the callback. Avoids stale closures without adding
 * the callback to dependency arrays of other hooks.
 *
 * Usage:
 *   const handleClick = useStableCallback(() => {
 *     doSomethingWith(currentValue);
 *   });
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args: Parameters<T>) => fnRef.current(...args), []) as T;
}

/**
 * useMountedRef — returns a ref that is `true` while the component is mounted
 * and `false` after it unmounts. Use this to guard async callbacks that should
 * not update state after unmount.
 *
 * Usage:
 *   const mounted = useMountedRef();
 *   useEffect(() => {
 *     fetchData().then(data => {
 *       if (mounted.current) setData(data);
 *     });
 *   }, []);
 */
export function useMountedRef(): { readonly current: boolean } {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

/**
 * useDebounce — returns a debounced version of a value. The returned value
 * only updates after `delayMs` milliseconds of inactivity.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchQuery, 300);
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

/**
 * useIntersectionObserver — observes a DOM element and returns whether it is
 * currently intersecting the viewport. Automatically disconnects on unmount.
 *
 * Accepts primitive options directly (not a single object) so the dependency
 * array is stable and the observer is not recreated on every render.
 *
 * Usage:
 *   const [ref, isVisible] = useIntersectionObserver(0.1);
 *   return <div ref={ref}>{isVisible ? 'Visible' : 'Hidden'}</div>;
 */
export function useIntersectionObserver(
  threshold: number | number[] = 0,
  rootMargin = '0px',
  root: Element | Document | null = null
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      observerRef.current = new IntersectionObserver(([entry]) => {
        setIntersecting(entry.isIntersecting);
      }, { threshold, rootMargin, root });
      observerRef.current.observe(node);
    },
    // threshold/rootMargin/root are primitive or stable refs — safe in dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threshold, rootMargin, root]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return [ref, isIntersecting];
}
