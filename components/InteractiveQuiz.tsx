"use client";

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { XCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number) => void;
}

export function InteractiveQuiz({ questions, onComplete }: InteractiveQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleAnswer = (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowFeedback(true);
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = (score / questions.length) * 100;
      onComplete?.(finalScore);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {questions.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{question.question}</h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedAnswer === index
                    ? showFeedback
                      ? isCorrect
                        ? 'border-brand-green-500 bg-brand-green-50'
                        : 'border-brand-red-500 bg-brand-red-50'
                      : 'border-brand-red-600 bg-brand-red-50'
                    : 'border-gray-200 hover:border-brand-red-300'
                } ${showFeedback && index === question.correctAnswer ? 'border-brand-green-500 bg-brand-green-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showFeedback && index === question.correctAnswer && (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  )}
                  {showFeedback && selectedAnswer === index && !isCorrect && (
                    <XCircle className="text-brand-orange-600" size={20} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {showFeedback && (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-brand-red-50 border border-brand-red-200'}`}>
            <p className={`font-semibold mb-2 ${isCorrect ? 'text-brand-green-800' : 'text-brand-red-800'}`}>
              {isCorrect ? '• Correct!' : '✗ Incorrect'}
            </p>
            <p className="text-sm text-black">{question.explanation}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-black">
            Score: {score} / {currentQuestion + (showFeedback ? 1 : 0)}
          </div>

          {!showFeedback ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="bg-brand-orange-600 hover:bg-brand-orange-700"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-brand-orange-600 hover:bg-brand-orange-700"
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
