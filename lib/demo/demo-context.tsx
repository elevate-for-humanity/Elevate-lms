'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DEMO_ORGANIZATION,
  DEMO_LICENSE,
  DEMO_USAGE,
  DEMO_STUDENTS,
  DEMO_PROGRAMS,
  DEMO_EMPLOYERS,
  DEMO_METRICS,
  DEMO_RECENT_ACTIVITY,
  DEMO_COURSES,
} from './sandbox-data';

interface DemoContextType {
  isDemoMode: boolean;
  organization: typeof DEMO_ORGANIZATION;
  license: typeof DEMO_LICENSE;
  usage: typeof DEMO_USAGE;
  students: typeof DEMO_STUDENTS;
  programs: typeof DEMO_PROGRAMS;
  employers: typeof DEMO_EMPLOYERS;
  metrics: typeof DEMO_METRICS;
  activity: typeof DEMO_RECENT_ACTIVITY;
  courses: typeof DEMO_COURSES;

  // Demo actions (simulated, don't persist)
  addStudent: (student: any) => void;
  updateStudent: (id: string, data: any) => void;
  deleteStudent: (id: string) => void;

  // Demo notifications
  showDemoNotice: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [students, setStudents] = useState(DEMO_STUDENTS);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Check if we're in demo mode
    const isDemo =
      window.location.pathname.startsWith('/store/demo') ||
      window.location.search.includes('demo=true');
    setIsDemoMode(isDemo);
  }, []);

  const addStudent = (student: any) => {
    if (!isDemoMode) return;
    setStudents((prev) => [...prev, { ...student, id: `demo-student-${Date.now()}` }]);
    showDemoNotice();
  };

  const updateStudent = (id: string, data: any) => {
    if (!isDemoMode) return;
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    showDemoNotice();
  };

  const deleteStudent = (id: string) => {
    if (!isDemoMode) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showDemoNotice();
  };

  const showDemoNotice = () => {
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 3000);
  };

  const value: DemoContextType = {
    isDemoMode,
    organization: DEMO_ORGANIZATION,
    license: DEMO_LICENSE,
    usage: DEMO_USAGE,
    students,
    programs: DEMO_PROGRAMS,
    employers: DEMO_EMPLOYERS,
    metrics: DEMO_METRICS,
    activity: DEMO_RECENT_ACTIVITY,
    courses: DEMO_COURSES,
    addStudent,
    updateStudent,
    deleteStudent,
    showDemoNotice,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium z-50">
          🎭 Demo Mode - Changes are not saved.
          <a href="/store/licenses" className="ml-2 underline">
            Get a license to use with real data →
          </a>
        </div>
      )}

      {/* Demo Action Notice */}
      {showNotice && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl z-50 animate-fade-in">
          <p className="text-sm">
            ✨ Action simulated in demo mode.
            <span className="text-slate-400 ml-1">Changes won't persist.</span>
          </p>
        </div>
      )}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

/**
 * Hook to get data - returns demo data if in demo mode, otherwise fetches real data
 */
export function useDemoOrReal<T>(
  demoData: T,
  fetchRealData: () => Promise<T>,
): { data: T | null; isLoading: boolean; isDemo: boolean } {
  const { isDemoMode } = useDemo();
  const [data, setData] = useState<T | null>(isDemoMode ? demoData : null);
  const [isLoading, setIsLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setData(demoData);
      setIsLoading(false);
    } else {
      fetchRealData()
        .then(setData)
        .finally(() => setIsLoading(false));
    }
  }, [isDemoMode, demoData, fetchRealData]);

  return { data, isLoading, isDemo: isDemoMode };
}

/**
 * Component wrapper that shows demo data when in demo mode
 */
export function DemoAware<T>({
  demoData,
  children,
  loadingFallback,
}: {
  demoData: T;
  children: (data: T, isDemo: boolean) => ReactNode;
  loadingFallback?: ReactNode;
}) {
  const { isDemoMode } = useDemo();

  if (isDemoMode) {
    return <>{children(demoData, true)}</>;
  }

  // In real mode, children should handle their own data fetching
  return <>{children(demoData, false)}</>;
}
