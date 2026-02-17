
"use client";

import React from 'react';

import { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  type?: 'info' | 'help';
  children?: React.ReactNode;
}

/**
 * Tooltip component following student-first language patterns
 *
 * Every tooltip must answer:
 * 1. What does this mean?
 * 2. Why does it matter to me?
 * 3. What should I do (if anything)?
 *
 * Pattern: Cause → Action → Result
 */
export function Tooltip({ content, type = 'help', children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const Icon = type === 'info' ? Info : HelpCircle;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 text-gray-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-brand-blue-500 rounded-full"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="More information"
      >
        <Icon className="w-4 h-4" />
      </button>

      {isVisible && (
        <div
          className="absolute z-50 w-64 p-3 text-sm text-black bg-white border border-gray-200 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2"
          role="tooltip"
        >
          <div className="relative">
            {content}
            <div className="absolute w-3 h-3 bg-white border-b border-r border-gray-200 transform rotate-45 -bottom-4 left-1/2 -translate-x-1/2" />
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Pre-configured tooltips for common patterns
 */
export const CommonTooltips = {
  whyDoISeeThis: (
    <Tooltip content="This section shows what's required for your next step." />
  ),

  whyIsThisEmpty: (
    <Tooltip content="This will update after you complete the step listed above." />
  ),

  whatHappensIfISubmit: (
    <Tooltip content="Your information is saved and reviewed by staff. You'll see updates here." />
  ),

  whyCantIAccessThis: (
    <Tooltip content="This step unlocks after you complete the requirements shown on this page." />
  ),

  whoCanSeeThis: (
    <Tooltip content="Only you and authorized staff working with your program." />
  ),

  // Dashboard-specific
  emptyCourseList: (
    <Tooltip content="You haven't enrolled in any courses yet. Browse programs to get started." />
  ),

  emptyHoursLog: (
    <Tooltip content="Your hours will appear here after you log time and your instructor verifies it." />
  ),

  emptyCertifications: (
    <Tooltip content="Certifications you earn will be listed here. Complete your program requirements to earn your first certification." />
  ),

  emptyMessages: (
    <Tooltip content="You have no new messages. Staff will contact you here if they need information." />
  ),

  emptyAssignments: (
    <Tooltip content="No assignments are due right now. New assignments appear when your instructor posts them." />
  ),

  // Form fields
  requiredField: (
    <Tooltip content="This information is required to process your application." />
  ),

  optionalField: (
    <Tooltip content="This information is optional but helps us serve you better." />
  ),

  documentUpload: (
    <Tooltip content="Upload a clear photo or scan. Accepted formats: PDF, JPG, PNG. Maximum size: 10MB." />
  ),

  // Application status
  underReview: (
    <Tooltip
      content="Staff are reviewing your application. You'll receive an update within 5-7 business days."
      type="info"
    />
  ),

  additionalInfoNeeded: (
    <Tooltip
      content="Check your messages for what's needed. Your application will be reviewed after you provide it."
      type="info"
    />
  ),

  accepted: (
    <Tooltip
      content="Congratulations! Check your messages for enrollment instructions."
      type="info"
    />
  ),

  // Progress indicators
  courseProgress: (
    <Tooltip
      content="Shows percentage of course completed based on assignments, quizzes, and attendance."
      type="info"
    />
  ),

  hoursProgress: (
    <Tooltip
      content="Shows hours completed out of total required. Updates after instructor verification."
      type="info"
    />
  ),

  skillMastery: (
    <Tooltip
      content="Shows skills you've demonstrated. Updates after instructor assessment."
      type="info"
    />
  ),
};

/**
 * Empty state component with built-in tooltip
 */
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  tooltipContent?: string;
}

export function EmptyState({
  title,
  description,
  action,
  tooltipContent,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-medium text-black">{title}</h3>
        {tooltipContent && <Tooltip content={tooltipContent} />}
      </div>
      <p className="max-w-md mb-4 text-sm text-black">{description}</p>
      {action && (
        <a
          href={action.href}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-blue-600 rounded-md hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

/**
 * Form field with integrated tooltip
 */
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  tooltipContent?: string;
  Content?: string;
  error?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  required = false,
  tooltipContent,
  Content,
  error,
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-black"
        >
          {label}
          {required && <span className="text-brand-red-500 ml-1">*</span>}
        </label>
        {tooltipContent && <Tooltip content={tooltipContent} />}
      </div>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500 ${
          error ? 'border-brand-red-500' : 'border-gray-300'
        }`}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-brand-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
