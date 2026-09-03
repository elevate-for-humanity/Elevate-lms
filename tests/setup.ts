// Vitest setup file
import '@testing-library/jest-dom';
import React from 'react';

// jsdom does not implement window.matchMedia — provide a default stub so
// any test that imports a component/hook using matchMedia doesn't crash.
// Individual tests can override this with vi.fn() as needed.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom does not implement IntersectionObserver — stub it so components
// that use it (e.g. CanonicalVideo) don't throw in unit tests.
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverStub,
  });
}

// jsdom's HTMLMediaElement methods are declared but throw "Not implemented".
// Stub them to keep test output focused on real regressions.
if (typeof window !== 'undefined' && window.HTMLMediaElement?.prototype) {
  const mediaProto = window.HTMLMediaElement.prototype;
  Object.defineProperty(mediaProto, 'pause', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(mediaProto, 'load', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(mediaProto, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
    [key: string]: unknown;
  }) => {
    return React.createElement('img', { src, alt, ...props });
  },
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));
