"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Play, BookOpen } from 'lucide-react';
import {
  Tutorial,
  TutorialStep,
  TUTORIALS,
} from '@/lib/onboarding-types';

interface TutorialSystemProps {
  tutorial?: Tutorial | null;
  userId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function TutorialSystem({
  tutorial,
  userId,
  onComplete,
  onClose,
}: TutorialSystemProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  const currentStep = tutorial?.steps?.[currentStepIndex];
  const isLastStep = currentStepIndex === (tutorial?.steps?.length ?? 1) - 1;
  const isFirstStep = currentStepIndex === 0;

  const tutorialId = tutorial?.id;

  // Load progress on mount
  useEffect(() => {
    if (!userId || !tutorialId) return;

    async function loadProgress() {
      try {
        const response = await fetch(`/api/tutorials?action=progress&tutorialId=${tutorialId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.progress) {
            setCurrentStepIndex(data.progress.currentStep);
            setCompletedSteps(data.progress.completedSteps);
          }
        }
      } catch (error) {
        // Progress load failure is non-fatal — tutorial starts from step 0
      }
    }
    loadProgress();
  }, [userId, tutorialId]);

  const handleNext = async () => {
    if (!tutorialId || !currentStep) return;

    // Mark current step as completed via API
    try {
      await fetch('/api/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-progress',
          tutorialId,
          stepId: currentStep.id,
          stepIndex: currentStepIndex,
        }),
      });
    } catch {
      // Progress save failure is non-fatal
    }

    setCompletedSteps([...completedSteps, currentStep.id]);

    if (isLastStep) {
      try {
        await fetch('/api/tutorials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            tutorialId,
          }),
        });
      } catch {
        // Completion save failure is non-fatal
      }
      setIsVisible(false);
      onComplete?.();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !tutorial?.steps?.length || !currentStep) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b   ">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
              <span className="text-sm font-medium text-brand-blue-600">
                {tutorial.category}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-black">
              {tutorial.title}
            </h2>
            <p className="text-sm text-black mt-1">
              {tutorial.description} • {tutorial.duration} min
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-black transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-black">
              Step {currentStepIndex + 1} of {tutorial.steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStepIndex + 1) / tutorial.steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / tutorial.steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-black mb-3">
              {currentStep.title}
            </h3>

            {/* Step type indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm mb-4">
              {currentStep.type === 'video' && <Play className="w-4 h-4" />}
              {currentStep.type === 'interactive' && '🎯'}
              {currentStep.type === 'quiz' && '❓'}
              {currentStep.type === 'text' && '📝'}
              <span className="capitalize">{currentStep.type}</span>
            </div>

            <div className="prose max-w-none">
              <p className="text-black leading-relaxed whitespace-pre-line">
                {currentStep.content}
              </p>
            </div>
          </div>

          {/* Media content */}
          {currentStep.media && currentStep.type === 'video' && (
            <div className="mt-6 rounded-lg overflow-hidden bg-gray-100">
              <video
                src={currentStep.media}
                controls
                playsInline
                className="w-full"
                poster="/images/pages/training-cohort.jpg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {currentStep.media && currentStep.type === 'text' && (
            <div className="relative mt-6 w-full h-64">
              <Image
                src={currentStep.media}
                alt={currentStep.title}
                fill
                className="object-contain rounded-lg shadow-md"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}

          {/* Interactive action */}
          {currentStep.action && currentStep.type === 'interactive' && (
            <div className="mt-6 p-4 bg-brand-blue-50 border-2 border-brand-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  !
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-brand-blue-900 mb-1">
                    Try it yourself
                  </h4>
                  <p className="text-sm text-brand-blue-700">
                    {currentStep.action.type === 'click' && 'Click the highlighted element to continue'}
                    {currentStep.action.type === 'input' && 'Fill in the required field'}
                    {currentStep.action.type === 'navigate' && 'Navigate to the specified page'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quiz */}
          {currentStep.type === 'quiz' && (
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-black mb-3">
                  Test your understanding before moving forward
                </p>
                <button className="w-full py-2 px-4 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors">
                  Start Quiz
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-1">
            {tutorial.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStepIndex
                    ? 'bg-brand-blue-600 w-6'
                    : completedSteps.includes(tutorial.steps[index].id)
                    ? 'bg-brand-blue-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tutorial Library Component
export function TutorialLibrary({ userId, userRole }: { userId: string; userRole: string }) {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  // Filter tutorials by user role
  const availableTutorials = Object.values(TUTORIALS).filter(tutorial => {
    if (tutorial.category === 'Instructor' && userRole !== 'instructor') {
      return false;
    }
    return true;
  });

  // Group tutorials by category
  const tutorialsByCategory = availableTutorials.reduce((acc, tutorial) => {
    if (!acc[tutorial.category]) {
      acc[tutorial.category] = [];
    }
    acc[tutorial.category].push(tutorial);
    return acc;
  }, {} as Record<string, Tutorial[]>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Interactive Tutorials
        </h2>
        <p className="text-black">
          Learn how to use all the features of the platform with step-by-step guides
        </p>
      </div>

      {Object.entries(tutorialsByCategory).map(([category, tutorials]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-black mb-4">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map(tutorial => {
              const isCompleted = completedTutorials.includes(tutorial.id);

              return (
                <button
                  key={tutorial.id}
                  onClick={() => setSelectedTutorial(tutorial)}
                  className="text-left p-6 bg-white border border-gray-200 rounded-lg hover:border-brand-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-black mb-1">
                        {tutorial.title}
                      </h4>
                      <p className="text-sm text-black">
                        {tutorial.description}
                      </p>
                    </div>
                    {isCompleted && (
                      <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 ml-2" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{tutorial.duration} min</span>
                    <span>•</span>
                    <span>{tutorial.steps.length} steps</span>
                  </div>

                  {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
                    <div className="mt-3 text-xs text-amber-600">
                      Prerequisites required
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedTutorial && (
        <TutorialSystem
          tutorial={selectedTutorial}
          userId={userId}
          onComplete={() => {
            setCompletedTutorials([...completedTutorials, selectedTutorial.id]);
            setSelectedTutorial(null);
          }}
          onClose={() => setSelectedTutorial(null)}
        />
      )}
    </div>
  );
}
