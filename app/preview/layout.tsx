import type { Metadata } from 'next';

// /preview/* routes are internal tools — never index them.
// Auth is enforced per-subtree:
//   /preview/[previewId]  — PUBLIC (localStorage only, no DB reads)
//   /preview/course/*     — authenticated (see app/preview/course/layout.tsx)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
