"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SimpleCaptchaProps {
  onVerify: (verified: boolean) => void;
  className?: string;
  formId?: string;
}

/**
 * Simple math-based CAPTCHA to prevent automated form submissions.
 * More user-friendly than image CAPTCHAs and doesn't require external services.
 */
export function SimpleCaptcha({ onVerify, className = '', formId }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // Generate random numbers between 1 and 10
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  // Log captcha attempt to DB for security monitoring
  const logCaptchaAttempt = async (success: boolean) => {
    await supabase
      .from('captcha_attempts')
      .insert({
        form_id: formId,
        success,
        attempts: attempts + 1,
        ip_address: null, // Set server-side
        user_agent: navigator.userAgent,
        attempted_at: new Date().toISOString()
      });
  };

  const handleVerify = async () => {
    const correctAnswer = num1 + num2;
    const answer = parseInt(userAnswer);
    setAttempts(prev => prev + 1);

    if (answer === correctAnswer) {
      setIsVerified(true);
      setError('');
      await logCaptchaAttempt(true);
      onVerify(true);
    } else {
      setError('Incorrect answer. Please try again.');
      setIsVerified(false);
      await logCaptchaAttempt(false);
      onVerify(false);
      // Generate new numbers
      setNum1(Math.floor(Math.random() * 10) + 1);
      setNum2(Math.floor(Math.random() * 10) + 1);
      setUserAnswer('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
    setError('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2 text-lg font-semibold text-black">
          <span className="text-2xl">{num1}</span>
          <span>+</span>
          <span className="text-2xl">{num2}</span>
          <span>=</span>
        </div>
        <input
          type="number"
          value={userAnswer}
          onChange={handleChange}
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
          placeholder="?"
          className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          disabled={isVerified}
        />
        {!isVerified && (
          <button
            type="button"
            onClick={handleVerify}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            Verify
          </button>
        )}
        {isVerified && (
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="font-medium">Verified</span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-brand-orange-600">{error}</p>
      )}
      {!isVerified && (
        <p className="text-xs text-black">
          Please solve the math problem to verify you're human
        </p>
      )}
    </div>
  );
}

interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Honeypot field - invisible to humans, visible to bots.
 * If filled, the form submission is from a bot.
 */
export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div className="absolute left-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
      <label htmlFor="website_url">Website</label>
      <input
        type="text"
        id="website_url"
        name="website_url"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

interface TimingCheckProps {
  onMount: () => void;
  minimumTime?: number; // milliseconds
}

/**
 * Timing check - bots typically submit forms instantly.
 * Tracks time from component mount to form submission.
 */
export function TimingCheck({ onMount, minimumTime = 3000 }: TimingCheckProps) {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return null;
}

/**
 * Hook to validate form submission timing
 */
export function useFormTiming(minimumTime: number = 3000) {
  const [mountTime, setMountTime] = useState<number | null>(null);

  const handleMount = () => {
    setMountTime(Date.now());
  };

  const isValidTiming = () => {
    if (!mountTime) return false;
    const elapsed = Date.now() - mountTime;
    return elapsed >= minimumTime;
  };

  return { handleMount, isValidTiming };
}

/**
 * Complete bot protection wrapper for forms
 */
interface BotProtectionProps {
  onVerify: (verified: boolean) => void;
  honeypotValue: string;
  onHoneypotChange: (value: string) => void;
  children?: React.ReactNode;
}

export function BotProtection({
  onVerify,
  honeypotValue,
  onHoneypotChange,
  children
}: BotProtectionProps) {
  const { handleMount, isValidTiming } = useFormTiming(3000);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  useEffect(() => {
    // Check all conditions
    const isBot = honeypotValue !== '' || !isValidTiming();
    const isVerified = captchaVerified && !isBot;
    onVerify(isVerified);
  }, [captchaVerified, honeypotValue, onVerify, isValidTiming]);

  return (
    <div className="space-y-4">
      <TimingCheck onMount={handleMount} />
      <HoneypotField value={honeypotValue} onChange={onHoneypotChange} />
      <SimpleCaptcha onVerify={setCaptchaVerified} />
      {children}
    </div>
  );
}
