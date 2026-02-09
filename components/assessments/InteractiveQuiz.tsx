"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "multiple_select";
  options: string[];
  correct_answer: string | string[];
  explanation: string;
  points: number;
}

interface InteractiveQuizProps {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  onComplete: (score: number, answers: Record<string, any>) => Promise<void>;
}

export function InteractiveQuiz({
  quizId,
  title,
  questions,
  passingScore,
  onComplete,
}: InteractiveQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const supabase = createClient();

  // Log quiz start and create attempt record
  useEffect(() => {
    async function startQuizAttempt() {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user?.id,
          started_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .select('id')
        .single();
      
      if (attempt) setAttemptId(attempt.id);
    }
    startQuizAttempt();
  }, [quizId, supabase]);

  // Save answer to DB when user answers
  const saveAnswerToDB = async (questionId: string, answer: any) => {
    if (!attemptId) return;
    await supabase
      .from('quiz_answers')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        answer,
        answered_at: new Date().toISOString()
      }, { onConflict: 'attempt_id,question_id' });
  };

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleAnswer = (data: any) => {
    setAnswers({ ...answers, [question.id]: answer });
  };

  const checkAnswer = () => {
    const userAnswer = answers[question.id];
    const correct = JSON.stringify(userAnswer) === JSON.stringify(question.correct_answer);
    setShowFeedback(true);
    return correct;
  };

  const handleNext = () => {
    const correct = checkAnswer();

    if (isLastQuestion) {
      const totalScore = Object.keys(answers).reduce((acc, qId) => {
        const q = questions.find((q) => q.id === qId);
        if (!q) return acc;
        const userAnswer = answers[qId];
        const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.correct_answer);
        return acc + (isCorrect ? q.points : 0);
      }, 0);

      const maxScore = questions.reduce((acc, q) => acc + q.points, 0);
      const percentage = (totalScore / maxScore) * 100;

      setScore(percentage);
      setIsComplete(true);
      onComplete(percentage, answers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setShowFeedback(false);
    }
  };

  if (isComplete) {
    const passed = score >= passingScore;

    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
          passed ? "bg-green-500/20" : "bg-brand-orange-500/20"
        }`}>
          {passed ? (
            <CheckCircle className="w-12 h-12 text-green-400" />
          ) : (
            <XCircle className="w-12 h-12 text-red-400" />
          )}
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
          {passed ? "Congratulations!" : "Keep Practicing"}
        </h2>

        <p className="text-xl text-slate-300 mb-6">
          You scored {Math.round(score)}%
        </p>

        <p className="text-slate-400 mb-8">
          {passed
            ? `You passed! The passing score was ${passingScore}%.`
            : `You need ${passingScore}% to pass. Review the material and try again.`}
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
          >
            Retake Quiz
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-orange-500 rounded-full h-2 transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-2xl font-bold text-white mb-6">{question.question_text}</h3>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          const isSelected = question.question_type === "multiple_select"
            ? (answers[question.id] || []).includes(option)
            : answers[question.id] === option;

          return (
            <button
              key={index}
              onClick={() => {
                if (question.question_type === "multiple_select") {
                  const current = answers[question.id] || [];
                  const updated = current.includes(option)
                    ? current.filter((o: string) => o !== option)
                    : [...current, option];
                  handleAnswer(updated);
                } else {
                  handleAnswer(option);
                }
              }}
              disabled={showFeedback}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-slate-700 bg-slate-900 hover:border-slate-600"
              } ${showFeedback ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-white">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`p-4 rounded-lg mb-6 ${
          JSON.stringify(answers[question.id]) === JSON.stringify(question.correct_answer)
            ? "bg-green-500/20 border border-green-500/50"
            : "bg-brand-orange-500/20 border border-red-500/50"
        }`}>
          <div className="flex items-start gap-3">
            {JSON.stringify(answers[question.id]) === JSON.stringify(question.correct_answer) ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            )}
            <div>
              <p className={`font-semibold mb-2 ${
                JSON.stringify(answers[question.id]) === JSON.stringify(question.correct_answer)
                  ? "text-green-400"
                  : "text-red-400"
              }`}>
                {JSON.stringify(answers[question.id]) === JSON.stringify(question.correct_answer)
                  ? "Correct!"
                  : "Incorrect"}
              </p>
              <p className="text-slate-300">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!answers[question.id]}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
