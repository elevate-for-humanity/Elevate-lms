'use client';

import React from 'react';
import { useEffect } from 'react';

interface AIInstructorMessage {
  type: 'welcome' | 'lesson_start' | 'quiz_start' | 'encouragement' | 'completion' | 'certificate';
  message: string;
}

export function useAIInstructor() {
  const speak = (message: string) => {
    // Dispatch custom event for AI instructor to speak
    window.dispatchEvent(new CustomEvent('ai-instructor-speak', {
      detail: { message }
    }));
  };

  const triggerMessage = (type: AIInstructorMessage['type'], customMessage?: string) => {
    const messages: Record<AIInstructorMessage['type'], string> = {
      welcome: "Welcome! I'm your AI instructor, here to guide you through this learning journey. Let's get started!",
      lesson_start: "Great! Let's dive into this lesson. Take your time and don't hesitate to review any section.",
      quiz_start: "Time to test your knowledge! Remember, this is a learning opportunity. You've got this!",
      encouragement: "You're doing great! Keep up the excellent work. Learning takes time and effort, and you're showing both.",
      completion: "Congratulations! You've completed this section. I'm proud of your dedication and progress!",
      certificate: "Amazing achievement! You've earned your certificate. This is a testament to your hard work and commitment!"
    };

    const message = customMessage || messages[type];
    speak(message);
  };

  return { speak, triggerMessage };
}

// Hook for lesson-specific AI guidance
export function useAILessonGuidance(lessonTitle: string) {
  const { triggerMessage } = useAIInstructor();

  useEffect(() => {
    // Welcome message when lesson loads
    const timer = setTimeout(() => {
      triggerMessage('lesson_start', `Welcome to ${lessonTitle}. I'll be here to help you throughout this lesson.`);
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonTitle]);

  return { triggerMessage };
}

// Hook for quiz guidance
export function useAIQuizGuidance() {
  const { triggerMessage } = useAIInstructor();

  const onQuizStart = () => {
    triggerMessage('quiz_start');
  };

  const onQuizComplete = (score: number, passed: boolean) => {
    if (passed) {
      triggerMessage('completion', `Excellent work! You scored ${score}%. You've demonstrated a strong understanding of the material.`);
    } else {
      triggerMessage('encouragement', `You scored ${score}%. Don't worry - learning is a process. Review the material and try again when you're ready.`);
    }
  };

  return { onQuizStart, onQuizComplete };
}

// Hook for certificate celebration
export function useAICertificateGuidance() {
  const { triggerMessage } = useAIInstructor();

  const onCertificateEarned = (certificateType: 'module' | 'program', courseName: string) => {
    if (certificateType === 'program') {
      triggerMessage('certificate', `Congratulations on completing ${courseName}! This program certificate represents your dedication and achievement. I'm so proud of you!`);
    } else {
      triggerMessage('certificate', `Well done! You've earned your certificate for ${courseName}. Keep building on this success!`);
    }
  };

  return { onCertificateEarned };
}
