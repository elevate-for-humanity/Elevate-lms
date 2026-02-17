
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function FeatureTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if user has seen tour
    const hasSeenTour = localStorage.getItem('hasSeenFeatureTour');
    if (!hasSeenTour) {
      // Show tour after 2 seconds
      const timer = setTimeout(() => setShowTour(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const features = [
    {
      emoji: '🤖',
      title: 'Meet Your AI Tutor',
      description: 'Get instant help 24/7 with automated tutoring support',
      link: '/ai-tutor',
      cta: 'Try AI Tutor',
    },
    {
      emoji: '<Trophy className="w-5 h-5 inline-block" />',
      title: 'Earn Achievements',
      description: 'Collect badges and climb leaderboards as you learn',
      link: '/lms/badges',
      cta: 'View Badges',
    },
    {
      emoji: '⭐',
      title: 'Partner Courses',
      description: 'Access 1,200+ courses from industry leaders',
      link: '/admin/partners',
      cta: 'Browse Partners',
    },
  ];

  const handleComplete = () => {
    localStorage.setItem('hasSeenFeatureTour', 'true');
    setShowTour(false);
  };

  if (!showTour) return null;

  const feature = features[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">{feature.emoji}</div>
          <h2 className="text-2xl font-bold mb-2 text-black">
            {feature.title}
          </h2>
          <p className="text-black">{feature.description}</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Link
            href={feature.link}
            className="flex-1 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition text-center"
            onClick={handleComplete}
          >
            {feature.cta}
          </Link>
          <button
            onClick={() => {
              if (currentStep < features.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                handleComplete();
              }
            }}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            {currentStep < features.length - 1 ? 'Next' : 'Done'}
          </button>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {features.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition ${
                index === currentStep ? 'bg-brand-blue-600 w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleComplete}
          className="w-full text-sm text-black hover:text-black transition"
        >
          Skip tour
        </button>
      </div>
    </div>
  );
}
