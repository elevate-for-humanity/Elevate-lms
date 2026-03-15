import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4 max-w-2xl">
        <div className="mb-8">
          <div className="text-8xl font-black text-gray-200 mb-4">404</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white transition font-semibold"
          >
            <Search className="h-5 w-5" />
            Browse Programs
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>Looking for something specific?</p>
          <Link 
            href="/contact" 
            className="text-brand-blue-600 hover:underline"
          >
            Contact us for help
          </Link>
        </div>
      </div>
    </div>
  );
}
