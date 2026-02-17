"use client";

import React from 'react';

import { useState } from 'react';
import { XCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizSystemProps {
  questions: Question[];
  onComplete: (score: number) => void;
  passingScore?: number;
}

export function QuizSystem({
  questions,
  onComplete,
  passingScore = 70,
}: QuizSystemProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    new Array(questions.length).fill(-1)
  );
  const [showResults, setShowResults] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = () => {
    const score = calculateScore();
    setShowResults(true);
    onComplete(score);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const retakeQuiz = () => {
    setAnswers(new Array(questions.length).fill(-1));
    setCurrentQuestion(0);
    setShowResults(false);
    setTimeElapsed(0);
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= passingScore;
    const correctCount = answers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;

    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center mb-8">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-brand-green-100' : 'bg-brand-red-100'}`}
          >
            {passed ? (
              <span className="text-slate-400 flex-shrink-0">•</span>
            ) : (
              <XCircle className="w-12 h-12 text-brand-orange-600" />
            )}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Keep Trying!'}
          </h2>
          <p className="text-black mb-4">
            You scored {score}% ({correctCount} out of {questions.length}{' '}
            correct)
          </p>
          <p className="text-sm text-slate-500">
            {passed
              ? `You passed! (Required: ${passingScore}%)`
              : `You need ${passingScore}% to pass`}
          </p>
        </div>

        {/* Review Answers */}
        <div className="space-y-6 mb-8">
          <h3 className="text-xl font-bold">Review Your Answers</h3>
          {questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div
                key={question.id}
                className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-brand-green-200 bg-brand-green-50' : 'border-brand-red-200 bg-brand-red-50'}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <XCircle className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold mb-2">
                      Question {index + 1}: {question.question}
                    </p>
                    <p className="text-sm text-black mb-1">
                      Your answer:{' '}
                      <span
                        className={
                          isCorrect
                            ? 'text-brand-green-700 font-semibold'
                            : 'text-brand-red-700 font-semibold'
                        }
                      >
                        {question.options[userAnswer]}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-black">
                        Correct answer:{' '}
                        <span className="text-brand-green-700 font-semibold">
                          {question.options[question.correctAnswer]}
                        </span>
                      </p>
                    )}
                    {question.explanation && (
                      <p className="text-sm text-black mt-2 italic">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={retakeQuiz}
            className="flex-1 bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Retake Quiz
          </button>
          {passed && (
            <button
              onClick={() => (window.location.href = '/lms/courses')}
              className="flex-1 bg-brand-green-600 hover:bg-brand-green-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Continue to Next Lesson
            </button>
          )}
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const allAnswered = answers.every((a) => a !== -1);

  return (
    <div className="bg-white rounded-lg p-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-black mb-2">
          <span>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-brand-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-6">{question.question}</h3>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                answers[currentQuestion] === index
                  ? 'border-brand-blue-600 bg-brand-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion] === index
                      ? 'border-brand-blue-600 bg-brand-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {answers[currentQuestion] === index && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={goToPrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 hover:bg-slate-200 text-black"
        >
          Previous
        </button>

        <div className="text-sm text-black">
          {answers.filter((a) => a !== -1).length} of {questions.length}{' '}
          answered
        </div>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={submitQuiz}
            disabled={!allAnswered}
            className="px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed bg-brand-green-600 hover:bg-brand-green-700 text-white"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="px-6 py-3 rounded-lg font-semibold transition bg-brand-blue-600 hover:bg-brand-blue-700 text-white"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
