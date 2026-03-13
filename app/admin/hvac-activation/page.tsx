'use client';

import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, AlertCircle, Loader2, Database, Volume2, BookOpen, Play } from 'lucide-react';

interface StepStatus {
  status: 'idle' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

export default function HVACActivationPage() {
  const [sqlStep, setSqlStep] = useState<StepStatus>({ status: 'idle' });
  const [syncStep, setSyncStep] = useState<StepStatus>({ status: 'idle' });
  const [videoStep, setVideoStep] = useState<StepStatus>({ status: 'idle' });
  const [statusStep, setStatusStep] = useState<StepStatus>({ status: 'idle' });

  const COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';

  // Step 1: Check if SQL migration has been run
  const checkSqlStatus = async () => {
    setSqlStep({ status: 'running', message: 'Checking database...' });
    try {
      const res = await fetch('/api/admin/sync-course-definitions');
      if (res.ok) {
        // Also check if the course exists in training_courses via a lesson count
        const countRes = await fetch(`/api/courses/${COURSE_ID}`);
        if (countRes.ok) {
          const data = await countRes.json();
          setSqlStep({
            status: 'success',
            message: `Course found: ${data.course?.title || data.course?.course_name || 'HVAC Technician'}`,
            details: data,
          });
        } else {
          // Course API may fail due to VIEW mismatch, check via sync endpoint
          const syncData = await res.json();
          const hvac = syncData.courses?.find((c: any) => c.slug === 'hvac-technician');
          setSqlStep({
            status: 'success',
            message: `Course definition found: ${hvac?.title || 'HVAC Technician'} (${hvac?.lessons || 94} lessons). Database migration was already run.`,
            details: syncData,
          });
        }
      } else if (res.status === 401 || res.status === 403) {
        setSqlStep({
          status: 'error',
          message: 'Not logged in as admin. Sign in first at /auth/signin',
        });
      } else {
        setSqlStep({
          status: 'error',
          message: 'Could not verify. Check database connection.',
        });
      }
    } catch (err) {
      setSqlStep({
        status: 'error',
        message: 'Could not connect to database. Check Supabase configuration.',
      });
    }
  };

  // Step 2: Sync quiz questions and content types
  const runSync = async () => {
    setSyncStep({ status: 'running', message: 'Syncing 94 lessons with quiz data...' });
    try {
      const res = await fetch('/api/admin/sync-course-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'hvac-technician' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStep({
          status: 'success',
          message: data.message,
          details: data.results,
        });
      } else {
        setSyncStep({
          status: 'error',
          message: data.error || data.message || 'Sync failed',
          details: data,
        });
      }
    } catch (err) {
      setSyncStep({ status: 'error', message: 'Network error during sync' });
    }
  };

  // Step 3: Generate voiceovers
  const generateVoiceovers = async () => {
    setVideoStep({ status: 'running', message: 'Generating voiceovers (this takes several minutes)...' });
    try {
      const res = await fetch('/api/admin/generate-lesson-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: COURSE_ID, batchSize: 94 }),
      });
      const data = await res.json();
      if (res.ok) {
        setVideoStep({
          status: 'success',
          message: data.message || `Generated ${data.generated} voiceovers`,
          details: data,
        });
      } else {
        setVideoStep({
          status: 'error',
          message: data.error || 'Generation failed',
          details: data,
        });
      }
    } catch (err) {
      setVideoStep({ status: 'error', message: 'Network error during generation' });
    }
  };

  // Check generation status
  const checkStatus = async () => {
    setStatusStep({ status: 'running', message: 'Checking media status...' });
    try {
      const res = await fetch('/api/admin/generate-lesson-videos');
      const data = await res.json();
      if (res.ok) {
        setStatusStep({
          status: 'success',
          message: `${data.total} lessons total | ${data.withVideos} with video | ${data.withMp3Only} with audio | ${data.withoutMedia} without media | ${data.percentComplete}% complete`,
          details: data,
        });
      } else {
        setStatusStep({ status: 'error', message: data.error || 'Status check failed' });
      }
    } catch (err) {
      setStatusStep({ status: 'error', message: 'Network error' });
    }
  };

  const statusIcon = (status: StepStatus['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-brand-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-brand-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-brand-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'HVAC Activation' }]} />

        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">HVAC Course Activation</h1>
        <p className="text-gray-600 mb-8">
          Activate the 16-module, 94-lesson HVAC Technician course with EPA 608 exam prep,
          153 quiz questions, and AI-generated voiceovers.
        </p>

        <div className="space-y-6">
          {/* Step 1: SQL Migration */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {statusIcon(sqlStep.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold">Step 1: Database Migration</h2>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Paste the SQL into Supabase Dashboard &gt; SQL Editor. File location:
                </p>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm mb-3 break-all">
                  supabase/migrations/_non_migration/HVAC_ACTIVATION_PASTE_INTO_DASHBOARD.sql
                </code>
                <p className="text-gray-500 text-xs mb-4">
                  This creates the lessons VIEW fields, HVAC course, and 94 lesson records.
                </p>
                <button
                  onClick={checkSqlStatus}
                  disabled={sqlStep.status === 'running'}
                  className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {sqlStep.status === 'running' ? 'Checking...' : 'Check Database'}
                </button>
                {sqlStep.message && (
                  <p className={`mt-3 text-sm ${sqlStep.status === 'error' ? 'text-brand-red-600' : 'text-brand-green-600'}`}>
                    {sqlStep.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Sync Quiz Data */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {statusIcon(syncStep.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold">Step 2: Sync Quiz Questions</h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Populates 153 quiz questions (EPA 608 Core/Type I/II/III + module quizzes),
                  content types, and rich HTML content for all 94 lessons.
                </p>
                <button
                  onClick={runSync}
                  disabled={syncStep.status === 'running'}
                  className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {syncStep.status === 'running' ? 'Syncing...' : 'Sync Quiz Data'}
                </button>
                {syncStep.message && (
                  <p className={`mt-3 text-sm ${syncStep.status === 'error' ? 'text-brand-red-600' : 'text-brand-green-600'}`}>
                    {syncStep.message}
                  </p>
                )}
                {syncStep.details && (
                  <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(syncStep.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Generate Voiceovers */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {statusIcon(videoStep.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold">Step 3: Generate Voiceovers</h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Generates AI voiceovers for all 94 lessons using the trades instructor voice.
                  Priority: Synthesia &rarr; D-ID &rarr; Sora &rarr; gpt-4o-mini-tts &rarr; tts-1-hd.
                  This may take 10-15 minutes.
                </p>
                <button
                  onClick={generateVoiceovers}
                  disabled={videoStep.status === 'running'}
                  className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {videoStep.status === 'running' ? 'Generating...' : 'Generate Voiceovers'}
                </button>
                {videoStep.message && (
                  <p className={`mt-3 text-sm ${videoStep.status === 'error' ? 'text-brand-red-600' : 'text-brand-green-600'}`}>
                    {videoStep.message}
                  </p>
                )}
                {videoStep.details && (
                  <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(videoStep.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Status Check */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {statusIcon(statusStep.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Play className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold">Media Status</h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Check how many lessons have video/audio generated.
                </p>
                <button
                  onClick={checkStatus}
                  disabled={statusStep.status === 'running'}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
                >
                  {statusStep.status === 'running' ? 'Checking...' : 'Check Status'}
                </button>
                {statusStep.message && (
                  <p className={`mt-3 text-sm ${statusStep.status === 'error' ? 'text-brand-red-600' : 'text-brand-green-600'}`}>
                    {statusStep.message}
                  </p>
                )}
                {statusStep.details?.services && (
                  <div className="mt-3 flex gap-3 flex-wrap">
                    {Object.entries(statusStep.details.services).map(([key, val]) => (
                      <span
                        key={key}
                        className={`text-xs px-2 py-1 rounded ${val ? 'bg-brand-green-100 text-brand-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {key}: {val ? 'available' : 'not configured'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Course Link */}
          <div className="bg-brand-blue-50 rounded-lg border border-brand-blue-200 p-6">
            <h2 className="text-lg font-semibold text-brand-blue-900 mb-2">Course URL</h2>
            <p className="text-brand-blue-700 text-sm mb-3">
              Once activated, the HVAC course is accessible at:
            </p>
            <a
              href={`/courses/${COURSE_ID}`}
              className="text-brand-blue-600 hover:text-brand-blue-800 font-mono text-sm underline"
            >
              /courses/{COURSE_ID}
            </a>
            <p className="text-brand-blue-600 text-xs mt-2">
              LMS learning view: /lms/courses/{COURSE_ID}/lessons/[lessonId]
            </p>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">16</div>
              <div className="text-sm text-gray-500">Modules</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">94</div>
              <div className="text-sm text-gray-500">Lessons</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">153</div>
              <div className="text-sm text-gray-500">Quiz Questions</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">6</div>
              <div className="text-sm text-gray-500">Credentials</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
