import Link from 'next/link';
import { ArrowLeft, Home, Search, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* 404 Graphic */}
        <div className="relative mx-auto w-48 h-48 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-red-100 to-orange-100 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl font-black text-brand-red-600">404</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-slate-600 mb-8">
          Looks like this page took a wrong turn. It might have moved, been deleted, or never existed.
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Home className="w-6 h-6 text-brand-red-600" />
            <span className="text-sm font-medium text-slate-700">Home</span>
          </Link>
          <Link
            href="/programs"
            className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <BookOpen className="w-6 h-6 text-brand-red-600" />
            <span className="text-sm font-medium text-slate-700">Programs</span>
          </Link>
          <Link
            href="/store"
            className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Search className="w-6 h-6 text-brand-red-600" />
            <span className="text-sm font-medium text-slate-700">Store</span>
          </Link>
        </div>

        {/* Back Button */}
        <button
          onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-brand-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Go back</span>
        </button>
      </div>
    </div>
  );
}
