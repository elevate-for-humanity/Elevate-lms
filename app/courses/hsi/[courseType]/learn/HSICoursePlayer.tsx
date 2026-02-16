'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AIInstructorWidget } from '@/components/AIInstructorWidget';

interface HSICoursePlayerProps {
  courseId: string;
  courseName: string;
  hsiUrl: string;
  userId: string;
  enrollmentId: string;
}

export function HSICoursePlayer({
  courseId,
  courseName,
  hsiUrl,
  userId,
  enrollmentId,
}: HSICoursePlayerProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [useIframe, setUseIframe] = useState(true);

  const handleCompletion = async () => {
    setCompleted(true);

    // Save completion to database
    await fetch('/api/courses/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        userId,
        enrollmentId,
        completionData: {
          courseName,
          completedAt: new Date().toISOString(),
        },
      }),
    });
  };

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
              <h1 className="text-lg font-semibold text-black">
                {courseName}
              </h1>
              <p className="text-sm text-black">
                HSI Health & Safety Training
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseIframe(!useIframe)}
              className="px-4 py-2 text-sm font-medium text-black bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {useIframe ? 'Open in New Tab' : 'Embed Course'}
            </button>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="flex-1 relative overflow-hidden">
        {useIframe ? (
          <>
            {/* Iframe Embedding */}
            <iframe
              src={hsiUrl}
              className="w-full h-full border-0"
              allow="fullscreen; camera; microphone"
              title={courseName}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              loading="lazy"
            />

            {/* Overlay Instructions */}
            <div className="absolute top-4 left-4 right-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">i</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-1">
                    HSI Course Instructions
                  </h3>
                  <p className="text-sm text-black mb-2">
                    Complete the course in the HSI system below. When finished,
                    click "Mark as Complete" to generate your certificate.
                  </p>
                  <button
                    onClick={handleCompletion}
                    className="px-4 py-2 bg-brand-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    • Mark as Complete
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Redirect Option */
          <div className="flex items-center justify-center h-full p-8">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExternalLink className="w-10 h-10 text-brand-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-4">
                Continue to HSI Training
              </h2>
              <p className="text-black mb-8">
                Click the button below to access your HSI course in a new
                window. Complete the training, then return here to mark it as
                complete.
              </p>
              <div className="space-y-4">
                <a
                  href={hsiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-lg hover:bg-brand-blue-700 transition-colors shadow-lg"
                >
                  Open HSI Course
                  <ExternalLink className="w-5 h-5" />
                </a>
                <div className="pt-4">
                  <button
                    onClick={handleCompletion}
                    className="px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    • I've Completed the Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Banner */}
      {completed && (
        <div className="bg-brand-green-600 text-white px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-semibold">Course Complete!</div>
                <div className="text-sm text-green-100">
                  Your certificate is being generated and will be emailed to you
                  shortly
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/student/courses')}
              className="px-6 py-2 bg-white text-brand-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {/* AI Instructor */}
      <AIInstructorWidget context="lesson" />
    </div>
  );
}
