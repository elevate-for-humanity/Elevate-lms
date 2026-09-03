'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { InterviewSession, ConversationMessage, InterviewQuestion, InterviewScore, EligibilityResult } from '@/lib/paris/interview/types';

// Elevate Brand Colors
const BRAND_COLORS = {
  gold: '#D4AF37',
  darkGold: '#B8962E',
  dark: '#1a1a2e',
  darkBlue: '#16213e',
  accent: '#e8d5b7',
  white: '#ffffff',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

// PARS Avatar SVG
const PARSAvatar = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={BRAND_COLORS.dark}/>
    <circle cx="24" cy="18" r="8" fill={BRAND_COLORS.gold}/>
    <path d="M12 38C12 30.268 17.373 24 24 24C30.627 24 36 30.268 36 38" stroke={BRAND_COLORS.gold} strokeWidth="3" strokeLinecap="round"/>
    <circle cx="24" cy="18" r="4" fill={BRAND_COLORS.dark}/>
    <circle cx="22" cy="17" r="1" fill={BRAND_COLORS.gold}/>
    <circle cx="26" cy="17" r="1" fill={BRAND_COLORS.gold}/>
  </svg>
);

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND_COLORS.gold }}></div>
  </div>
);

// Progress Bar Component
const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between text-sm mb-2" style={{ color: BRAND_COLORS.gray }}>
        <span>Question {current} of {total}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS.lightGray }}>
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: BRAND_COLORS.gold 
          }}
        />
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message }: { message: ConversationMessage }) => {
  const isPARS = message.role === 'paris';
  
  return (
    <div className={`flex ${isPARS ? 'justify-start' : 'justify-end'} mb-4`}>
      {isPARS && (
        <div className="flex-shrink-0 mr-3">
          <PARSAvatar />
        </div>
      )}
      <div 
        className="max-w-[80%] rounded-2xl px-4 py-3"
        style={{ 
          backgroundColor: isPARS ? BRAND_COLORS.lightGray : BRAND_COLORS.gold,
          color: isPARS ? BRAND_COLORS.dark : BRAND_COLORS.dark,
        }}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs mt-1 block" style={{ color: BRAND_COLORS.gray }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// Question Card Component
const QuestionCard = ({ 
  question, 
  onSubmit, 
  onSkip,
  isLoading 
}: { 
  question: InterviewQuestion | null;
  onSubmit: (response: string) => void;
  onSkip: () => void;
  isLoading: boolean;
}) => {
  const [response, setResponse] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [response]);

  const handleSubmit = () => {
    if (response.trim().length >= 10) {
      onSubmit(response.trim());
      setResponse('');
    }
  };

  if (!question) {
    return (
      <div className="rounded-xl p-6" style={{ backgroundColor: BRAND_COLORS.lightGray }}>
        <p style={{ color: BRAND_COLORS.gray }}>Loading question...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: BRAND_COLORS.white }}>
      <div className="flex items-center justify-between mb-4">
        <span 
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: BRAND_COLORS.accent, color: BRAND_COLORS.darkGold }}
        >
          {question.domain}
        </span>
        {question.requiredDomain && (
          <span className="text-xs" style={{ color: BRAND_COLORS.warning }}>
            Required
          </span>
        )}
      </div>

      <h3 className="text-lg font-medium mb-4" style={{ color: BRAND_COLORS.dark }}>
        {question.question}
      </h3>

      {question.followUps && question.followUps.length > 0 && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: BRAND_COLORS.lightGray }}>
          <p className="text-sm" style={{ color: BRAND_COLORS.gray }}>
            <span className="font-medium">Tip:</span> Consider addressing:
          </p>
          <ul className="text-sm mt-2 space-y-1">
            {question.followUps.map((followUp, index) => (
              <li key={index} className="flex items-start" style={{ color: BRAND_COLORS.gray }}>
                <span className="mr-2">•</span>
                <span>{followUp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <textarea
          ref={textareaRef}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Share your thoughts and experiences here..."
          className="w-full px-4 py-3 rounded-lg border-2 resize-none outline-none"
          style={{ 
            borderColor: response.length > 0 ? BRAND_COLORS.gold : '#e5e7eb',
            minHeight: '100px'
          }}
          disabled={isLoading}
        />
        <div className="flex justify-between text-sm mt-2" style={{ color: BRAND_COLORS.gray }}>
          <span>Min 10 characters</span>
          <span className={response.length < 10 ? 'text-red-500' : ''}>
            {response.length} chars
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isLoading || response.trim().length < 10}
          className="flex-1 py-3 px-6 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: BRAND_COLORS.gold }}
        >
          {isLoading ? 'Submitting...' : 'Submit Response'}
        </button>
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="py-3 px-6 rounded-lg font-medium"
          style={{ 
            backgroundColor: 'transparent', 
            color: BRAND_COLORS.gray,
            border: `1px solid ${BRAND_COLORS.gray}`
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

// Completion Screen Component
const CompletionScreen = ({ 
  score,
  eligibility,
  onClose
}: { 
  score: InterviewScore;
  eligibility: EligibilityResult;
  onClose: () => void;
}) => {
  const statusColors = {
    eligible: BRAND_COLORS.success,
    review: BRAND_COLORS.warning,
    denied: BRAND_COLORS.error
  };

  const statusIcons = {
    eligible: '🎉',
    review: '📋',
    denied: '⚠️'
  };

  return (
    <div className="rounded-xl p-8 shadow-lg" style={{ backgroundColor: BRAND_COLORS.white }}>
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{statusIcons[eligibility.status]}</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: BRAND_COLORS.dark }}>
          Interview {eligibility.status === 'eligible' ? 'Complete!' : 'Submitted'}
        </h2>
        <p className="text-lg" style={{ color: BRAND_COLORS.gray }}>
          {eligibility.reason}
        </p>
      </div>

      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: BRAND_COLORS.lightGray }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold" style={{ color: BRAND_COLORS.dark }}>Interview Score</span>
          <span 
            className="text-3xl font-bold"
            style={{ color: score.percentage >= 70 ? BRAND_COLORS.success : BRAND_COLORS.warning }}
          >
            {score.percentage}%
          </span>
        </div>
        <div className="h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.white }}>
          <div 
            className="h-full rounded-full"
            style={{ 
              width: `${score.percentage}%`, 
              backgroundColor: score.percentage >= 70 ? BRAND_COLORS.success : BRAND_COLORS.warning 
            }}
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <span 
          className="inline-block px-6 py-2 rounded-full font-semibold text-white"
          style={{ backgroundColor: statusColors[eligibility.status] }}
        >
          Status: {eligibility.status.toUpperCase()}
        </span>
      </div>

      {eligibility.fundingRecommendations && eligibility.fundingRecommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3" style={{ color: BRAND_COLORS.dark }}>
            Funding Options Available
          </h3>
          <div className="space-y-3">
            {eligibility.fundingRecommendations.slice(0, 3).map((option, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border-l-4"
                style={{ 
                  backgroundColor: BRAND_COLORS.lightGray,
                  borderColor: option.coverage >= 80 ? BRAND_COLORS.success : BRAND_COLORS.gold
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium" style={{ color: BRAND_COLORS.dark }}>{option.name}</h4>
                    {option.coverage > 0 && (
                      <span className="text-sm" style={{ color: BRAND_COLORS.success }}>
                        Up to {option.coverage}% coverage
                      </span>
                    )}
                  </div>
                  <a
                    href={option.applicationUrl}
                    className="text-sm font-medium"
                    style={{ color: BRAND_COLORS.gold }}
                  >
                    Apply →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-semibold mb-3" style={{ color: BRAND_COLORS.dark }}>
          Next Steps
        </h3>
        <ol className="space-y-2">
          {eligibility.nextSteps.slice(0, 5).map((step, index) => (
            <li key={index} className="flex items-start">
              <span 
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium text-white mr-3"
                style={{ backgroundColor: BRAND_COLORS.gold }}
              >
                {index + 1}
              </span>
              <span style={{ color: BRAND_COLORS.gray }}>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 px-6 rounded-lg font-semibold text-white"
        style={{ backgroundColor: BRAND_COLORS.gold }}
      >
        Continue to Dashboard
      </button>
    </div>
  );
};

// Main Interview Page Component
export default function PARSInterviewPage() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState<InterviewScore | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 8, percentage: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  const getApplicationRef = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('applicationRef') || localStorage.getItem('paris_application_ref');
  }, []);

  const initializeInterview = useCallback(async () => {
    const applicationRef = getApplicationRef();
    if (!applicationRef) {
      setError('No application reference found. Please access this page from your application.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/paris/interview?applicationRef=${applicationRef}`);
      const data = await response.json();

      if (data.exists && data.canResume) {
        sessionIdRef.current = data.sessionId;
        setSession(data);
        setMessages(data.messages || []);
        setProgress(data.progress || { current: 0, total: 8, percentage: 0 });
        if (data.currentQuestion) {
          setCurrentQuestion(data.currentQuestion);
        }
      } else if (!data.exists) {
        const startResponse = await fetch('/api/paris/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationRef })
        });
        
        const startData = await startResponse.json();
        
        if (startData.sessionId) {
          sessionIdRef.current = startData.sessionId;
          const programSlug = startData.programSlug;
          const questionsResponse = await fetch(`/api/paris/interview/questions?program=${programSlug}`);
          const questionsData = await questionsResponse.json();
          
          if (questionsData.questions && questionsData.questions.length > 0) {
            setCurrentQuestion(questionsData.questions[0]);
            setProgress({ current: 0, total: questionsData.questions.length, percentage: 0 });
            setMessages([{
              id: `intro-${Date.now()}`,
              role: 'paris',
              content: `Hello! I'm PARS, your AI interview assistant. This interview has ${questionsData.questions.length} questions. Take your time and answer thoughtfully.`,
              timestamp: new Date()
            }]);
          }
        }
      }
    } catch (err) {
      setError('Failed to initialize interview. Please try again.');
      console.error('Interview init error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getApplicationRef]);

  const handleSubmitResponse = async (responseText: string) => {
    if (!currentQuestion || !sessionIdRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const response_data = await fetch('/api/paris/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationRef: getApplicationRef(),
          questionId: currentQuestion.id,
          response: responseText,
          sessionId: sessionIdRef.current
        })
      });

      const data = await response_data.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.messages) {
        setMessages(prev => [...prev, ...data.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))]);
      }

      if (data.progress) {
        setProgress(data.progress);
      }

      if (data.isComplete) {
        setIsComplete(true);
        setScore(data.finalScore);
        setEligibility(data.eligibility);
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
      }
    } catch (err) {
      setError('Failed to submit response. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!currentQuestion || !sessionIdRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/paris/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationRef: getApplicationRef(),
          questionId: currentQuestion.id,
          response: null,
          sessionId: sessionIdRef.current
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.messages) {
        setMessages(prev => [...prev, ...data.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))]);
      }

      if (data.progress) {
        setProgress(data.progress);
      }

      if (data.isComplete) {
        setIsComplete(true);
        setScore(data.finalScore);
        setEligibility(data.eligibility);
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
      }
    } catch (err) {
      setError('Failed to skip question. Please try again.');
      console.error('Skip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    initializeInterview();
  }, [initializeInterview]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/portals';
    }
  };

  if (isLoading && !session && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.dark }}>
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4" style={{ color: BRAND_COLORS.gold }}>Initializing your interview...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.dark }}>
        <div className="text-center max-w-md mx-auto p-8 rounded-xl" style={{ backgroundColor: BRAND_COLORS.white }}>
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: BRAND_COLORS.dark }}>Unable to Start Interview</h2>
          <p className="mb-6" style={{ color: BRAND_COLORS.gray }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="py-3 px-6 rounded-lg font-semibold text-white"
            style={{ backgroundColor: BRAND_COLORS.gold }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BRAND_COLORS.dark }}>
      <header className="sticky top-0 z-50 px-6 py-4" style={{ backgroundColor: BRAND_COLORS.darkBlue }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PARSAvatar />
            <div>
              <h1 className="text-xl font-bold" style={{ color: BRAND_COLORS.gold }}>PARS Interview</h1>
              <p className="text-sm" style={{ color: BRAND_COLORS.gray }}>Elevate for Humanity</p>
            </div>
          </div>
          {!isComplete && (
            <ProgressBar current={progress.current} total={progress.total} />
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {isComplete && score && eligibility ? (
          <CompletionScreen 
            score={score} 
            eligibility={eligibility} 
            onClose={handleClose}
          />
        ) : (
          <>
            <div className="mb-6 max-h-[50vh] overflow-y-auto">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                onSubmit={handleSubmitResponse}
                onSkip={handleSkip}
                isLoading={isLoading}
              />
            )}

            {error && (
              <div 
                className="mt-4 p-4 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: `1px solid ${BRAND_COLORS.error}` }}
              >
                <p style={{ color: BRAND_COLORS.error }}>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-sm font-medium"
                  style={{ color: BRAND_COLORS.error }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 px-6 py-3" style={{ backgroundColor: BRAND_COLORS.darkBlue }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm" style={{ color: BRAND_COLORS.gray }}>
          <p>Powered by PARS AI • Elevate for Humanity</p>
          <p>Your responses are confidential</p>
        </div>
      </footer>
    </div>
  );
}
