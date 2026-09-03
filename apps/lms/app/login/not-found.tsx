import Link from 'next/link';

export default function LoginNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4 max-w-lg">
        <div className="text-6xl font-black text-slate-700 mb-4">404</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-700 mb-6">This page doesn't exist. Please sign in below.</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-medium text-sm"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}
