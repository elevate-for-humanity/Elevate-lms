'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, ChevronRight, MessageCircle, Volume2, VolumeX, Play, Pause, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SideAvatarGuideProps {
  avatarVideoUrl: string;
  avatarName: string;
  avatarRole: string;
  welcomeMessage: string;
  context: string;
  side?: 'left' | 'right';
}

export default function SideAvatarGuide({
  avatarVideoUrl,
  avatarName,
  avatarRole,
  welcomeMessage,
  context,
  side = 'right',
}: SideAvatarGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Delay showing to let page load first
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Play video when visible - with retry for mobile
  useEffect(() => {
    if (!isVisible || !videoRef.current) return;
    
    const video = videoRef.current;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setTimeout(async () => {
          try {
            await video.play();
            setIsPlaying(true);
          } catch {
            // Silent fail
          }
        }, 500);
      }
    };
    
    playVideo();
  }, [isVisible]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  if (!isVisible) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
      
      const response = await fetch('/api/chat/avatar-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          route: currentRoute,
          context,
          history: messages.slice(-10),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm sorry, I encountered an issue. Please try again or call (317) 314-3757.",
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
        }]);
        playVideo();
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Connection issue. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sideClasses = side === 'right' 
    ? 'right-0 rounded-l-2xl' 
    : 'left-0 rounded-r-2xl';

  const toggleClasses = side === 'right'
    ? '-left-12 rounded-l-xl'
    : '-right-12 rounded-r-xl';

  return (
    <div 
      className={`fixed top-1/4 ${sideClasses} z-40 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-0'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute ${toggleClasses} top-1/2 -translate-y-1/2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white p-3 shadow-lg transition-colors`}
        title={isExpanded ? 'Hide Guide' : 'Show Guide'}
      >
        {isExpanded ? (
          side === 'right' ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />
        ) : (
          side === 'right' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />
        )}
      </button>

      {/* Collapsed indicator */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`absolute ${side === 'right' ? '-left-20' : '-right-20'} top-1/2 -translate-y-1/2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-colors`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="font-medium whitespace-nowrap">Ask {avatarName}</span>
        </button>
      )}

      {/* Main Panel */}
      {isExpanded && (
        <div className={`bg-white shadow-2xl border border-gray-200 h-[600px] flex flex-col overflow-hidden ${side === 'right' ? 'rounded-l-2xl' : 'rounded-r-2xl'}`}>
          {/* Avatar Video Section - Larger */}
          <div className="bg-slate-900 p-4">
            <div className="relative">
              {!videoFailed ? (
                <video
                  ref={videoRef}
                  src={avatarVideoUrl}
                  muted
                  playsInline
                  autoPlay
                  className="w-full h-52 object-contain rounded-xl bg-slate-900"
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setVideoFailed(true)}
                />
              ) : (
                <div className="w-full h-52 rounded-xl bg-slate-800 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-brand-orange-500 flex items-center justify-center text-white text-3xl font-bold">
                    {avatarName?.charAt(0) ?? 'E'}
                  </div>
                </div>
              )}
              
              {/* Play/Pause overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all transform hover:scale-110"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" fill="white" />
                  )}
                </button>
              </div>
              
              {/* Mute/unmute button */}
              <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-3 text-center">
              <div className="text-white font-semibold text-lg">{avatarName}</div>
              <div className="text-brand-blue-300">{avatarRole}</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-brand-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 bg-brand-blue-600 text-white rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
