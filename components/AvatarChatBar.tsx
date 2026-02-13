'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, MessageCircle, Send, X, ChevronUp, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Avatar video mapping based on page
const getAvatarConfig = (pathname: string) => {
  if (pathname.includes('/programs/healthcare') || pathname.includes('/cna') || pathname.includes('/medical')) {
    return { video: '/videos/avatars/healthcare-guide.mp4', name: 'Healthcare Guide', message: 'Interested in healthcare careers? I can help you explore CNA, Medical Assistant, and more!' };
  }
  if (pathname.includes('/programs/barber') || pathname.includes('/cosmetology')) {
    return { video: '/videos/avatars/barber-guide.mp4', name: 'Beauty Guide', message: 'Ready to start your career in barbering or cosmetology? Let me show you how!' };
  }
  if (pathname.includes('/programs/skilled-trades') || pathname.includes('/hvac') || pathname.includes('/electrical')) {
    return { video: '/videos/avatars/trades-guide.mp4', name: 'Trades Guide', message: 'Skilled trades offer great careers! Ask me about HVAC, electrical, welding, and more.' };
  }
  if (pathname.includes('/store') || pathname.includes('/shop')) {
    return { video: '/videos/avatars/store-assistant.mp4', name: 'Store Assistant', message: 'Looking for courses, licenses, or tools? I can help you find what you need!' };
  }
  // Tax preparation pages - separate from financial aid
  if (pathname.includes('/tax') || pathname.includes('/supersonic-fast-cash')) {
    return { video: '/videos/avatars/financial-guide.mp4', name: 'Tax Guide', message: 'Need help with tax preparation? I can guide you through free VITA services or Supersonic Fast Cash options!' };
  }
  // Financial aid and funding pages
  if (pathname.includes('/financial-aid') || pathname.includes('/funding') || pathname.includes('/wioa') || pathname.includes('/grants')) {
    return { video: '/videos/avatars/financial-guide.mp4', name: 'Funding Guide', message: 'Looking for free training? I can help you understand WIOA funding, grants, and financial aid options!' };
  }
  if (pathname.includes('/onboarding') || pathname.includes('/orientation')) {
    return { video: '/videos/avatars/orientation-guide.mp4', name: 'Orientation Guide', message: 'Welcome! Let me help you get started with your training journey.' };
  }
  if (pathname.includes('/lms') || pathname.includes('/courses') || pathname.includes('/learn')) {
    return { video: '/videos/avatars/ai-tutor.mp4', name: 'AI Tutor', message: 'Need help with your coursework? I\'m your AI tutor - ask me anything!' };
  }
  return { video: '/videos/avatars/home-welcome.mp4', name: 'Elevate Guide', message: 'Hi! I\'m here to help you find the right career training program. What are you interested in?' };
};

// Pages that should NOT show the avatar/chat bar
const excludedPatterns = [
  /^\/admin/i,
  /^\/api/i,
  /^\/login/i,
  /^\/signup/i,
  /^\/register/i,
  /^\/staff-portal/i,
  /^\/partner-portal/i,
  /^\/employer-portal/i,
  /^\/instructor/i,
];

export default function AvatarChatBar() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { video, name, message: welcomeMessage } = getAvatarConfig(pathname);

  // Don't show on excluded pages
  const isExcluded = excludedPatterns.some(pattern => pattern.test(pathname));

  // Initialize welcome message
  useEffect(() => {
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
  }, [welcomeMessage]);

  // Auto-play video with sound
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isExcluded) return;

    videoEl.muted = false;
    videoEl.play().catch(() => {
      // If autoplay with sound fails, try muted (browser policy)
      videoEl.muted = true;
      setIsMuted(true);
      videoEl.play().catch(() => {});
    });
    setIsPlaying(true);
  }, [video, isExcluded]);

  const togglePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    
    if (isPlaying) {
      videoEl.pause();
    } else {
      videoEl.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/avatar-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          route: pathname,
          history: messages.slice(-10),
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || data.response || "I'm here to help! Please try again or call (317) 314-3757.",
      }]);

      // Play video when assistant responds
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Connection issue. Please call (317) 314-3757 for immediate help.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isExcluded || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* Avatar Video Section */}
          <div className="relative w-full lg:w-64 flex-shrink-0">
            <div className="relative aspect-video lg:aspect-square rounded-xl overflow-hidden shadow-lg bg-slate-900">
              <video
                ref={videoRef}
                src={video}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
              />
              
              {/* Play/Pause Overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              >
                <div className="p-3 bg-black/50 rounded-full">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" fill="white" />
                  )}
                </div>
              </button>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">{name}</span>
                  <button
                    onClick={toggleMute}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 w-full">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Chat Header */}
              <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-blue-200">Ask me anything!</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsChatExpanded(!isChatExpanded)}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors lg:hidden"
                  >
                    {isChatExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages - Always visible on desktop, collapsible on mobile */}
              <div className={`${isChatExpanded ? 'block' : 'hidden'} lg:block`}>
                <div className="h-40 lg:h-48 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-slate-200 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your question..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Mobile: Show input even when collapsed */}
              <div className={`${isChatExpanded ? 'hidden' : 'block'} lg:hidden p-3 border-t border-slate-200 bg-white`}>
                <button
                  onClick={() => setIsChatExpanded(true)}
                  className="w-full py-2 text-blue-600 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Tap to chat with {name}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
