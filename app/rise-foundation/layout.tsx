import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Rise Foundation | Selfish Inc. 501(c)(3)',
  description:
    'The Rise Foundation is operated by Selfish Inc., a 501(c)(3) nonprofit. Mental wellness, CurvatureBody Sculpting, Meri-Go-Round products, and community services. Indianapolis, Indiana.',
};

export default function RiseFoundationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* DBA identity bar — appears on every Rise Foundation page */}
      <div className="bg-white border-b border-slate-700 py-2 px-4 text-center text-xs text-slate-400">
        <span className="text-white font-semibold">The Rise Foundation</span>
        {' '}is operated by{' '}
        <Link href="/rise-foundation" className="text-pink-400 font-semibold hover:underline">
          Selfish Inc.
        </Link>
        {' '}— a 501(c)(3) nonprofit organization &middot; Indianapolis, Indiana
      </div>
      {children}
    </div>
  );
}
