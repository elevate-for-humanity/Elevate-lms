"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
interface SCORMPlayerProps {
  scormPackageId: string;
  enrollmentId: string;
  userId: string;
  packageTitle: string;
  launchUrl: string;
  passingScore?: number;
  maxAttempts?: number;
}
interface SCORMData {
  'cmi.core.lesson_status': string;
  'cmi.core.score.raw': string;
  'cmi.core.score.min': string;
  'cmi.core.score.max': string;
  'cmi.core.session_time': string;
  'cmi.core.total_time': string;
  'cmi.suspend_data': string;
  [key: string]: string;
}
export function SCORMPlayer({
  scormPackageId,
  enrollmentId,
  userId,
  packageTitle,
  launchUrl,
  passingScore = 80,
  maxAttempts,
}: SCORMPlayerProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<string>('not_attempted');
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scormData, setScormData] = useState<SCORMData>({
    'cmi.core.lesson_status': 'not attempted',
    'cmi.core.score.raw': '',
    'cmi.core.score.min': '0',
    'cmi.core.score.max': '100',
    'cmi.core.session_time': '00:00:00',
    'cmi.core.total_time': '00:00:00',
    'cmi.suspend_data': '',
  });
  const supabase = createClient();

  // Load existing enrollment data from DB
  useEffect(() => {
    async function loadFromDB() {
      // Direct DB query for enrollment data
      const { data: enrollment } = await supabase
        .from('scorm_enrollments')
        .select('status, progress_percentage, score, attempts, time_spent_seconds, cmi_data')
        .eq('scorm_package_id', scormPackageId)
        .eq('user_id', userId)
        .single();

      if (enrollment) {
        setStatus(enrollment.status || 'not_attempted');
        setProgress(enrollment.progress_percentage || 0);
        setScore(enrollment.score);
        setAttempts(enrollment.attempts || 0);
        setTimeSpent(enrollment.time_spent_seconds || 0);
        if (enrollment.cmi_data) {
          setScormData(prev => ({ ...prev, ...enrollment.cmi_data }));
        }
      }
      
      // Log SCORM session start
      await supabase
        .from('scorm_session_log')
        .insert({
          scorm_package_id: scormPackageId,
          enrollment_id: enrollmentId,
          user_id: userId,
          event_type: 'session_start',
          timestamp: new Date().toISOString()
        });
    }
    loadFromDB();
    loadEnrollmentData();
  }, [scormPackageId, userId, supabase, enrollmentId]);
  // SCORM API Implementation
  useEffect(() => {
    // Create SCORM API for the iframe
    const API = {
      LMSInitialize: () => {
        setIsLoading(false);
        return 'true';
      },
      LMSFinish: () => {
        saveScormData();
        return 'true';
      },
      LMSGetValue: (element: string) => {
        return scormData[element] || '';
      },
      LMSSetValue: (element: string, value: string) => {
        setScormData(prev => ({ ...prev, [element]: value }));
        // Update UI based on key values
        if (element === 'cmi.core.lesson_status') {
          setStatus(value);
          if (value === 'completed' || value === 'passed') {
            setProgress(100);
          }
        }
        if (element === 'cmi.core.score.raw') {
          const scoreValue = parseFloat(value);
          setScore(scoreValue);
          if (scoreValue >= passingScore) {
            setStatus('passed');
          }
        }
        return 'true';
      },
      LMSCommit: () => {
        saveScormData();
        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => '',
      LMSGetDiagnostic: () => '',
    };
    // Expose API to iframe
    (window as string).API = API;
    (window as string).API_1484_11 = API; // SCORM 2004
    return () => {
      delete (window as string).API;
      delete (window as string).API_1484_11;
    };
  }, [scormData, passingScore]);
  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  async function loadEnrollmentData() {
    try {
      const response = await fetch(`/api/scorm/enrollment/${enrollmentId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status || 'not_attempted');
        setProgress(data.progress_percentage || 0);
        setScore(data.score);
        setAttempts(data.attempts || 0);
        setTimeSpent(data.time_spent_seconds || 0);
        if (data.cmi_data) {
          setScormData(prev => ({ ...prev, ...data.cmi_data }));
        }
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      setError('Failed to load course data');
    }
  }
  async function saveScormData() {
    try {
      await fetch('/api/scorm/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scormPackageId,
          enrollmentId,
          userId,
          status,
          progress,
          score,
          timeSpent,
          cmiData: scormData,
        }),
      });
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  }
  async function handleRestart() {
    if (maxAttempts && attempts >= maxAttempts) {
      setError(`Maximum attempts (${maxAttempts}) reached`);
      return;
    }
    setAttempts(prev => prev + 1);
    setStatus('incomplete');
    setProgress(0);
    setScore(null);
    setScormData({
      'cmi.core.lesson_status': 'incomplete',
      'cmi.core.score.raw': '',
      'cmi.core.score.min': '0',
      'cmi.core.score.max': '100',
      'cmi.core.session_time': '00:00:00',
      'cmi.core.total_time': '00:00:00',
      'cmi.suspend_data': '',
    });
    // Reload iframe
    if (iframeRef.current) {
      iframeRef.current.src = launchUrl;
    }
  }
  const isPassed = score !== null && score >= passingScore;
  const isCompleted = status === 'completed' || status === 'passed' || isPassed;
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-black hover:text-black transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-black">{packageTitle}</h1>
                <p className="text-sm text-gray-500">
                  Attempt {attempts + 1}{maxAttempts ? ` of ${maxAttempts}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Progress */}
              {progress > 0 && !isCompleted && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-black">Progress:</div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-black">{progress}%</div>
                </div>
              )}
              {/* Score */}
              {score !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black">Score:</span>
                  <span className={`text-sm font-semibold ${isPassed ? 'text-green-600' : 'text-brand-orange-600'}`}>
                    {score}%
                  </span>
                </div>
              )}
              {/* Restart Button */}
              {isCompleted && (!maxAttempts || attempts < maxAttempts) && (
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      {/* SCORM Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-black">Loading course content...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={launchUrl}
          className="w-full h-full border-0"
          allow="fullscreen; camera; microphone; autoplay"
          title={packageTitle}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
      {/* Completion Banner */}
      {isCompleted && (
        <div className={`${isPassed ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">
                    {isPassed ? 'Course Completed Successfully!' : 'Course Completed'}
                  </p>
                  <p className="text-sm opacity-90">
                    {isPassed
                      ? `You scored ${score}% (passing score: ${passingScore}%)`
                      : `You scored ${score}%. Passing score is ${passingScore}%`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/student/courses')}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
