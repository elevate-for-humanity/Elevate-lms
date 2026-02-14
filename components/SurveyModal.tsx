"use client";

import React from 'react';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating' | 'scale';
  question: string;
  options?: string[];
  required: boolean;
  order: number;
}

interface SurveyModalProps {
  survey: Survey;
  userId: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function SurveyModal({
  survey,
  userId,
  onComplete,
  onClose,
}: SurveyModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = survey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;

  const handleAnswer = (data: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      alert('This question is required');
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          surveyId: survey.id,
          answers,
        }),
      });

      if (response.ok) {
        onComplete();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit survey');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    const answer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answer || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleAnswer(currentQuestion.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            placeholder="Your answer..."
          />
        );

      case 'textarea':
        return (
          <textarea
            value={answer || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleAnswer(currentQuestion.id, e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            placeholder="Your answer..."
          />
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map(option => (
              <label
                key={option}
                className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={answer === option}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-5 h-5 text-brand-blue-600 border-gray-300 focus:ring-brand-blue-500"
                />
                <span className="text-black">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map(option => (
              <label
                key={option}
                className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={(answer || []).includes(option)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                    const currentAnswers = answer || [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter((a: string) => a !== option);
                    handleAnswer(currentQuestion.id, newAnswers);
                  }}
                  className="w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
                />
                <span className="text-black">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => handleAnswer(currentQuestion.id, rating)}
                className={`w-12 h-12 rounded-full font-bold transition-all ${
                  answer === rating
                    ? 'bg-brand-blue-600 text-white scale-110'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="10"
              value={answer || 5}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleAnswer(currentQuestion.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-black">
              <span>0</span>
              <span className="text-2xl font-bold text-brand-blue-600">{answer || 5}</span>
              <span>10</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-black mb-2">
                {survey.title}
              </h3>
              <p className="text-black">
                {survey.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-black">
              <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-black mb-2">
              {currentQuestion.question}
              {currentQuestion.required && (
                <span className="text-brand-orange-600 ml-1">*</span>
              )}
            </h4>
            {currentQuestion.type === 'checkbox' && (
              <p className="text-sm text-gray-500">Select all that apply</p>
            )}
          </div>

          {renderQuestion()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={isFirstQuestion || isSubmitting}
            className="flex items-center gap-2 px-6 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-1">
            {survey.questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-brand-blue-600 w-6'
                    : answers[survey.questions[index].id]
                    ? 'bg-brand-blue-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : isLastQuestion ? (
              <>
                <Check className="w-4 h-4" />
                Submit
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
