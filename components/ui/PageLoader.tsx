'use client';

import { LoadingSpinner } from './LoadingSpinner';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-black">{message}</p>
      </div>
    </div>
  );
}

export function SectionLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="py-12 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="mt-4 text-black">{message}</p>
      </div>
    </div>
  );
}
