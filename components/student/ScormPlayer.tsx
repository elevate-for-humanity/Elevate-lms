'use client';

import React from 'react';
/**
 * SCORM Player Component
 *
 * Loads and plays SCORM 1.2 and SCORM 2004 packages
 * Tracks progress and completion
 */
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
interface ScormPlayerProps {
  scormPackage: {
    id: string;
    title: string;
    provider: string;
    storage_path: string;
    launch_url: string;
    scorm_version: string;
  };
  moduleId: string;
  enrollmentId: string;
  progressId?: string;
}
export default function ScormPlayer({
  scormPackage,
  moduleId,
  enrollmentId,
  progressId,
}: ScormPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scormUrl, setScormUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const supabase = createClient();
  useEffect(() => {
    loadScormPackage();
  }, [scormPackage.id]);
  async function loadScormPackage() {
    try {
      setLoading(true);
      setError(null);
      // In production, you'd get a signed URL from Supabase Storage
      // For now, we'll use the launch_url directly
      const url = scormPackage.launch_url;
      if (!url) {
        throw new Error('SCORM launch URL not configured');
      }
      setScormUrl(url);
      setLoading(false);
    } catch (err: any) {
      // Error: $1
      setError(
        (err instanceof Error ? err.message : String(err)) ||
          'Failed to load SCORM package'
      );
      setLoading(false);
    }
  }
  // SCORM API implementation (simplified)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Create SCORM API object
    const API = {
      LMSInitialize: function (param: string) {
        return 'true';
      },
      LMSFinish: function (param: string) {
        handleScormCompletion();
        return 'true';
      },
      LMSGetValue: function (element: string) {
        // Return appropriate values based on element
        switch (element) {
          case 'cmi.core.lesson_status':
            return 'incomplete';
          case 'cmi.core.student_id':
            return enrollmentId;
          case 'cmi.core.student_name':
            return 'Student';
          default:
            return '';
        }
      },
      LMSSetValue: function (element: string, value: string) {
        // Track important values
        if (element === 'cmi.core.lesson_status' && value === 'completed') {
          handleScormCompletion();
        }
        if (element === 'cmi.core.score.raw') {
          handleScormScore(parseFloat(value));
        }
        return 'true';
      },
      LMSCommit: function (param: string) {
        return 'true';
      },
      LMSGetLastError: function () {
        return '0';
      },
      LMSGetErrorString: function (errorCode: string) {
        return 'No error';
      },
      LMSGetDiagnostic: function (errorCode: string) {
        return 'No error';
      },
    };
    // Expose API to iframe
    (window as string).API = API;
    (window as string).API_1484_11 = API; // SCORM 2004
    return () => {
      delete (window as string).API;
      delete (window as string).API_1484_11;
    };
  }, [enrollmentId]);
  async function handleScormCompletion() {
    if (!progressId) return;
    try {
      // Update module progress to completed
      const { error } = await supabase
        .from('enrollment_module_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', progressId);
      if (error) {
        // Error: $1
      } else {
        // Show success message
        alert('Module completed! Great job!');
      }
    } catch (err) {
      // Error: $1
    }
  }
  async function handleScormScore(score: number) {
    if (!progressId) return;
    try {
      // Store score in module_progress
      const { error } = await supabase
        .from('enrollment_module_progress')
        .update({
          score: score,
        })
        .eq('id', progressId);
      if (error) {
        // Error: $1
      }
    } catch (err) {
      // Error: $1
    }
  }
  if (loading) {
    return (
      <div className="scorm-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading SCORM package...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="scorm-container flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4 text-3xl md:text-4xl lg:text-5xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Failed to Load Module
          </h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button onClick={loadScormPackage} className="glow-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (!scormUrl) {
    return (
      <div className="scorm-container flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">SCORM URL not available</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* SCORM Info Bar */}
      <div className="glow-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">{scormPackage.title}</h3>
            <p className="text-slate-400 text-sm">
              Provider: {scormPackage.provider} | Version:{' '}
              {scormPackage.scorm_version}
            </p>
          </div>
          <button
            onClick={loadScormPackage}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ↻ Reload
          </button>
        </div>
      </div>
      {/* SCORM Player */}
      <div className="scorm-container">
        <iframe
          ref={iframeRef}
          src={scormUrl}
          title={scormPackage.title}
          className="w-full h-full border-none"
          allow="fullscreen"
        />
      </div>
      {/* Help Text */}
      <div className="glow-card p-4">
        <p className="text-slate-400 text-sm">
          💡 <strong>Tip:</strong> Make sure to complete all activities and
          click "Finish" or "Submit" within the course to save your progress.
        </p>
      </div>
    </div>
  );
}
