import type { Metadata } from 'next';

// All /course-preview/* routes are internal tools — never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CoursePreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
