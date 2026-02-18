import Link from 'next/link';

export default function MentorNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4 max-w-lg">
        <div className="text-6xl font-black text-gray-200 mb-4">404</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">This mentor page doesn't exist or has been moved.</p>
        <Link
          href="/mentor/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-medium text-sm"
        >
          Back to Mentor Dashboard
        </Link>
      </div>
    </div>
  );
}
