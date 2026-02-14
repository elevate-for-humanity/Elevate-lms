'use client';

import { useEffect, useState, useCallback } from 'react';

interface AutoPlayTTSProps {
  text: string;
  voice?: string;
  delay?: number;
}

// Detect iOS/iPadOS
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export default function AutoPlayTTS({ text, delay = 1500 }: AutoPlayTTSProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  const playTTS = useCallback(() => {
    if (!text || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // More natural speech settings - slower rate, warmer pitch
    utterance.rate = 0.88;
    utterance.pitch = 1.1;
    utterance.volume = 0.85;

    // Try to find a natural-sounding English voice
    const voices = window.speechSynthesis.getVoices();
    
    // Prefer these voices in order (most natural sounding)
    const preferredVoices = [
      'Samantha', // macOS - very natural
      'Karen', // macOS Australian - natural
      'Daniel', // macOS British - natural
      'Google US English', // Chrome - decent
      'Microsoft Zira', // Windows - decent female
      'Microsoft David', // Windows - decent male
    ];
    
    let selectedVoice = null;
    for (const preferred of preferredVoices) {
      selectedVoice = voices.find(v => v.name.includes(preferred) && v.lang.startsWith('en'));
      if (selectedVoice) break;
    }
    
    // Fallback to any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                      voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      setHasPlayed(true);
      setShowPlayButton(false);
    };
    
    utterance.onstart = () => {
      setHasPlayed(true);
      setShowPlayButton(false);
    };
    
    // Chrome bug workaround: speech cuts off after ~15 seconds
    // Keep speech alive by resuming periodically
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);
    
    utterance.onend = () => {
      clearInterval(keepAlive);
      setHasPlayed(true);
      setShowPlayButton(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [text]);

  useEffect(() => {
    if (hasPlayed || !text || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    // Load voices (needed for some browsers)
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const isiOSDevice = isIOS();

    // On iOS/iPad, we need user interaction - show play button immediately
    if (isiOSDevice) {
      // Try to play on first user interaction
      const handleInteraction = () => {
        if (!hasPlayed) {
          playTTS();
        }
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('click', handleInteraction);
      };

      document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
      document.addEventListener('click', handleInteraction, { once: true });

      // Show play button after delay if not played
      const buttonTimer = setTimeout(() => {
        if (!hasPlayed) {
          setShowPlayButton(true);
        }
      }, delay);

      return () => {
        clearTimeout(buttonTimer);
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('click', handleInteraction);
      };
    }

    // On desktop/laptop - autoplay works
    // Wait for voices to load, then play
    const timer = setTimeout(() => {
      // Ensure voices are loaded
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices not loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
          playTTS();
        };
      } else {
        playTTS();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, delay, hasPlayed, playTTS]);

  // Show a small play button only on iOS if autoplay was blocked
  if (showPlayButton && !hasPlayed) {
    return (
      <button
        onClick={playTTS}
        className="fixed bottom-24 right-6 z-50 bg-brand-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-brand-blue-700 transition-all animate-pulse"
        aria-label="Play welcome message"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    );
  }

  return null;
}
