import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';

export default function ProgramNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="text-center px-4 max-w-lg">
        <div className="text-6xl font-black text-gray-200 mb-4">404</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Program Not Found</h2>
        <p className="text-gray-600 mb-6">
          This program may have been renamed or is no longer available.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/programs"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 transition font-semibold text-sm"
          >
            <Search className="h-4 w-4" />
            Browse All Programs
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
