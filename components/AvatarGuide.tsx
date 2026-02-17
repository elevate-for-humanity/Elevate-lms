'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, X, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface GuideStep {
  title: string;
  message: string;
  highlight?: string; // CSS selector to highlight
}

interface AvatarGuideProps {
  avatarImage: string;
  avatarName?: string;
  welcomeMessage: string;
  steps: GuideStep[];
  onComplete?: () => void;
  autoStart?: boolean;
}

export default function AvatarGuide({
  avatarImage,
  avatarName = 'Elevate Guide',
  welcomeMessage,
  steps,
  onComplete,
  autoStart = true,
}: AvatarGuideProps) {
  const [isVisible, setIsVisible] = useState(autoStart);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  const currentMessage = currentStep === -1 ? welcomeMessage : steps[currentStep]?.message || '';
  const currentTitle = currentStep === -1 ? 'Welcome!' : steps[currentStep]?.title || '';
  const totalSteps = steps.length;

  // Typing effect
  useEffect(() => {
    if (!isVisible) return;
    
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;

    if (typingRef.current) {
      clearInterval(typingRef.current);
    }

    typingRef.current = setInterval(() => {
      if (index < currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        if (typingRef.current) {
          clearInterval(typingRef.current);
        }
      }
    }, 30);

    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
      }
    };
  }, [currentStep, currentMessage, isVisible]);

  // Highlight element when step changes
  useEffect(() => {
    if (currentStep >= 0 && steps[currentStep]?.highlight) {
      const element = document.querySelector(steps[currentStep].highlight!);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-brand-orange-500', 'ring-offset-2', 'transition-all');
        
        return () => {
          element.classList.remove('ring-4', 'ring-brand-orange-500', 'ring-offset-2', 'transition-all');
        };
      }
    }
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
    // Save to localStorage so it doesn't show again
    if (typeof window !== 'undefined') {
      localStorage.setItem('avatar-guide-completed', 'true');
    }
  };

  const handleRestart = () => {
    setCurrentStep(-1);
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => {
          setIsVisible(true);
          setCurrentStep(-1);
        }}
        className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
          <Image src={avatarImage} alt={avatarName} width={32} height={32} className="object-cover" />
        </div>
        <span className="text-sm font-medium">Need Help?</span>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b-4 border-brand-orange-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-brand-orange-500 shadow-lg">
                <Image
                  src={avatarImage}
                  alt={avatarName}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              {/* Speaking indicator */}
              {isTyping && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-white text-sm font-medium mt-2">{avatarName}</p>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg sm:text-xl font-bold text-white">{currentTitle}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-slate-400 hover:text-white transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSkip}
                  className="p-2 text-slate-400 hover:text-white transition"
                  title="Close guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Speech bubble */}
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-lg mb-4 relative">
              <p className="text-gray-800 text-base sm:text-lg leading-relaxed min-h-[60px]">
                {displayedText}
                {isTyping && <span className="inline-block w-2 h-5 bg-brand-orange-500 ml-1 animate-pulse" />}
              </p>
            </div>

            {/* Progress and Navigation */}
            <div className="flex items-center justify-between">
              {/* Progress dots */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${currentStep === -1 ? 'bg-brand-orange-500 w-4' : 'bg-slate-600'}`}
                />
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${currentStep === index ? 'bg-brand-orange-500 w-4' : currentStep > index ? 'bg-brand-green-500' : 'bg-slate-600'}`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                {currentStep > -1 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-3 py-2 text-slate-300 hover:text-white transition text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                
                {currentStep === totalSteps - 1 ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleRestart}
                      className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restart
                    </button>
                    <button
                      onClick={handleComplete}
                      className="flex items-center gap-1 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition text-sm font-medium"
                    >
                      Got it!
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={isTyping}
                    className="flex items-center gap-1 px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    {currentStep === -1 ? "Let's Go" : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
