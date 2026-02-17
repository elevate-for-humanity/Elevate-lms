"use client";

import React from 'react';

// Skeleton Screens for Loading States
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="h-64 bg-slate-200" />
      <div className="p-8 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
        <div className="space-y-2 pt-4">
          <div className="h-3 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="w-16 h-16 bg-slate-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  );
}

// Spinner Components
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`${sizeClasses[size]} border-brand-orange-600 border-t-transparent rounded-full animate-spin`} />
  );
}

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <Spinner size="lg" />
      {text && <p className="text-black animate-pulse">{text}</p>}
    </div>
  );
}

// Shimmer Effect
export function ShimmerEffect() {
  return (
    <div className="relative overflow-hidden bg-slate-200 rounded">
      <div className="absolute inset-0 -translate-x-full animate-shimmer    " />
    </div>
  );
}

// Progress Bar
export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-full    transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Dots Loading
export function DotsLoading() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 bg-brand-orange-600 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// Pulse Loading
export function PulseLoading() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-4 h-4 bg-brand-orange-600 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// Full Page Loading
export function PageLoading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-black font-semibold">Loading...</p>
      </div>
    </div>
  );
}

// Button Loading State
export function ButtonLoading({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <button
      disabled={loading}
      className="relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange-600 text-white font-bold rounded-full button-scale disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading && (
        <Spinner size="sm" />
      )}
      <span className={loading ? 'opacity-50' : ''}>{children}</span>
    </button>
  );
}
