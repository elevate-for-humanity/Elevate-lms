"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react';
import { AIInstructorWidget } from '@/components/AIInstructorWidget';

interface UniversalCoursePlayerProps {
  courseId: string;
  courseName: string;
  partnerName: string;
  courseUrl: string;
  userId: string;
  enrollmentId: string;
  isScorm?: boolean;
  scormLaunchUrl?: string;
}

export function UniversalCoursePlayer({
  courseId,
  courseName,
  partnerName,
  courseUrl,
  userId,
  enrollmentId,
  isScorm = false,
  scormLaunchUrl,
}: UniversalCoursePlayerProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [useIframe, setUseIframe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCompletion = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/courses/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          userId,
          enrollmentId,
          completionData: {
            courseName,
            partnerName,
            completedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        setCompleted(true);
      } else {
        alert('Failed to mark course as complete. Please try again.');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Error marking course as complete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayUrl = scormLaunchUrl || courseUrl;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/student/courses')}
              className="flex items-center gap-2 text-black hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Courses</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-lg font-semibold text-black">{courseName}</h1>
              <p className="text-sm text-black">{partnerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isScorm && (
              <button
                onClick={() => setUseIframe(!useIframe)}
                className="px-4 py-2 text-sm font-medium text-black bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {useIframe ? 'Open in New Tab' : 'Embed Course'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="flex-1 relative overflow-hidden">
        {useIframe || isScorm ? (
          <>
            {/* Iframe Embedding */}
            <iframe
              src={displayUrl}
              className="w-full h-full border-0"
              allow="fullscreen; camera; microphone"
              title={courseName}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            />

            {/* Completion Instructions Overlay */}
            {!isScorm && (
              <div className="absolute top-4 left-4 right-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 shadow-lg z-10">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-1">Course Instructions</h3>
                    <p className="text-sm text-black mb-3">
                      Complete the course in the {partnerName} system below. When finished, click "Mark as Complete" to generate your Elevate For Humanity certificate.
                    </p>
                    <button
                      onClick={handleCompletion}
                      disabled={loading}
                      className="px-4 py-2 bg-brand-green-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : '• Mark as Complete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Redirect Option */
          <div className="flex items-center justify-center h-full p-8">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExternalLink className="w-10 h-10 text-brand-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-4">
                Continue to {partnerName}
              </h2>
              <p className="text-black mb-8">
                Click the button below to access your course in a new window. Complete the training, then return here to mark it as complete and receive your Elevate For Humanity certificate.
              </p>
              <div className="space-y-4">
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-lg hover:bg-brand-blue-700 transition-colors shadow-lg"
                >
                  Open {partnerName} Course
                  <ExternalLink className="w-5 h-5" />
                </a>
                <div className="pt-4">
                  <button
                    onClick={handleCompletion}
                    disabled={loading}
                    className="px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : '• I\'ve Completed the Course'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <h4 className="font-semibold text-black mb-2">📋 Important:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• Complete all course modules in the {partnerName} system</li>
                  <li>• Pass any required assessments or quizzes</li>
                  <li>• Return to this page when finished</li>
                  <li>• Click "Mark as Complete" to receive your certificate</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Banner */}
      {completed && (
        <div className="bg-brand-blue-700 text-white px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <div>
                <div className="font-semibold">Course Complete!</div>
                <div className="text-sm text-brand-green-100">
                  Your Elevate For Humanity certificate is being generated and will be emailed to you shortly
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/student/courses')}
              className="px-6 py-2 bg-white text-brand-green-600 font-semibold rounded-lg hover:bg-brand-green-50 transition-colors"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {/* AI Instructor */}
      <AIInstructorWidget context="lesson" programId={courseId} />
    </div>
  );
}
