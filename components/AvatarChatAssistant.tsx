'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
import { getAvatar, AVATARS } from '@/lib/ai-avatars';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AvatarChatAssistantProps {
  avatarVideoUrl: string;
  avatarName: string;
  avatarRole: string;
  welcomeMessage: string;
  context: 'store' | 'home' | 'course' | 'financial' | 'vita' | 'general';
  position?: 'bottom-right' | 'bottom-left';
  autoOpen?: boolean;
  autoPlayVideo?: boolean;
}

// Context-specific system prompts
const CONTEXT_PROMPTS: Record<string, string> = {
  store: `You are a helpful store assistant for Elevate for Humanity's online store. Help customers find:
- Study materials and workbooks
- Certification prep resources
- Course bundles
- Digital downloads
Be friendly, helpful, and guide them to the right products. If they ask about pricing, direct them to the product pages.`,

  home: `You are a welcome guide for Elevate for Humanity, a workforce training organization. Help visitors:
- Understand available programs (Healthcare, Trades, Technology, Barber)
- Learn about free training through WIOA funding
- Navigate to the right pages
- Start their application
Be warm, encouraging, and emphasize that most training is FREE for qualified students.`,

  course: `You are an AI tutor helping students with their coursework. You can:
- Explain concepts from their current course
- Create study guides and summaries
- Generate practice questions
- Help prepare for exams
Be patient, clear, and encouraging. Break down complex topics into simple explanations.`,

  financial: `You are a financial aid advisor for Elevate for Humanity. Help visitors understand:
- WIOA eligibility and funding
- Workforce Ready Grants
- JRI funding for justice-involved individuals
- How to apply for free training
Be informative and reassuring - most people qualify for free training!`,

  vita: `You are a VITA (Volunteer Income Tax Assistance) guide. Help visitors:
- Understand if they qualify (income under $64,000)
- Learn what documents to bring
- Schedule appointments
- Understand the free tax preparation process
Emphasize that this service is at no cost and saves them $200+ in tax prep fees.`,

  general: `You are a helpful assistant for Elevate for Humanity, a workforce training organization offering free career training in healthcare, skilled trades, technology, and more. Be helpful, friendly, and guide users to the information they need.`,
};

export default function AvatarChatAssistant({
  avatarVideoUrl,
  avatarName,
  avatarRole,
  welcomeMessage,
  context,
  position = 'bottom-right',
  autoOpen = false,
  autoPlayVideo = true,
}: AvatarChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Play intro video when chat opens - with retry for mobile
  useEffect(() => {
    if (!isOpen || hasPlayedIntro || !videoRef.current) return;
    
    const video = videoRef.current;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.currentTime = 0;
    
    const playVideo = async () => {
      try {
        await video.play();
        setHasPlayedIntro(true);
      } catch {
        setTimeout(async () => {
          try {
            await video.play();
            setHasPlayedIntro(true);
          } catch {
            // Silent fail
          }
        }, 500);
      }
    };
    
    playVideo();
  }, [isOpen, hasPlayedIntro]);

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
          context,
          history: messages.slice(-10), // Last 10 messages for context
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm sorry, I encountered an issue. Please try again or contact us directly at (317) 314-3757.",
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
        }]);
        
        // Play video when assistant responds
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again in a moment.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6' 
    : 'left-4 sm:left-6';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-6 ${positionClasses} z-40 flex items-center gap-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105`}
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-green-500 rounded-full animate-pulse" />
        </div>
        <span className="font-medium hidden sm:inline">Chat with {avatarName}</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 ${positionClasses} z-40 w-[calc(100%-2rem)] md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all flex flex-col ${
        isMinimized ? 'h-16' : 'h-[500px] sm:h-[550px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mini avatar video */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-blue-800 flex-shrink-0">
            <video
              ref={videoRef}
              src={avatarVideoUrl}
              muted={isMuted}
              playsInline
              autoPlay={autoPlayVideo}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-semibold text-sm">{avatarName}</div>
            <div className="text-xs text-white">{avatarRole}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-brand-blue-500 rounded-full transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-brand-blue-500 rounded-full transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-brand-blue-500 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Avatar Video Display - cropped to hide branding */}
          <div className="bg-slate-900 p-2 overflow-hidden">
            <video
              src={avatarVideoUrl}
              muted={isMuted}
              playsInline
              autoPlay={autoPlayVideo}
              className="w-full h-28 object-cover object-top rounded-lg"
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 h-[220px] sm:h-[250px] bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
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
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export { CONTEXT_PROMPTS };
