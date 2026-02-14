'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { getAssistantScript, AssistantScript, QuickAction } from '@/lib/chat/scripts';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface UnifiedChatAssistantProps {
  assistantId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  defaultOpen?: boolean;
  onMessage?: (message: Message) => void;
  className?: string;
}

/**
 * Unified Chat Assistant
 * 
 * Single chat component that loads behavior from the canonical script registry.
 * Supports multiple assistant personalities via assistantId prop.
 * 
 * Usage:
 * <UnifiedChatAssistant assistantId="elevate-main" />
 * <UnifiedChatAssistant assistantId="lms-tutor" />
 * <UnifiedChatAssistant assistantId="employer-assistant" />
 */
export default function UnifiedChatAssistant({
  assistantId = 'elevate-main',
  position = 'bottom-right',
  defaultOpen = false,
  onMessage,
  className = '',
}: UnifiedChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<AssistantScript | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load script from registry
  useEffect(() => {
    const loadedScript = getAssistantScript(assistantId, 'prod');
    
    if (!loadedScript) {
      setScriptError(`Assistant script "${assistantId}" not found or inactive`);
      console.error(`Failed to load assistant script: ${assistantId}`);
      return;
    }

    setScript(loadedScript);
    setScriptError(null);

    // Log script version for session tracking
    console.info(`[Chat] Loaded script: ${loadedScript.id} v${loadedScript.version}`, {
      sessionId,
      assistantId: loadedScript.id,
      scriptVersion: loadedScript.version,
      environment: loadedScript.environment,
    });

    // Set initial greeting
    if (loadedScript.greeting) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: loadedScript.greeting,
        timestamp: new Date(),
      }]);
    }
  }, [assistantId, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {
        // Silent fail
      }
    }
  }, [soundEnabled]);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !script) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    onMessage?.(userMessage);

    try {
      // Check for escalation triggers
      const escalationRule = script.escalation_rules.find(rule =>
        content.toLowerCase().includes(rule.trigger.toLowerCase())
      );

      if (escalationRule) {
        const escalationMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: escalationRule.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, escalationMessage]);
        playSound();
        onMessage?.(escalationMessage);
        setIsLoading(false);
        return;
      }

      // Build conversation history for API
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      // Add the new user message
      conversationHistory.push({
        role: 'user',
        content: content,
      });

      // Call public AI chat API (no auth required)
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.response || data.message || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      playSound();
      onMessage?.(assistantMessage);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment, or contact us at (317) 314-3757 for immediate assistance.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [script, messages, sessionId, onMessage, playSound]);

  // Handle quick action click
  const handleQuickAction = useCallback((action: QuickAction) => {
    sendMessage(action.label);
  }, [sendMessage]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative',
  };

  // Error state - don't render if script failed to load
  if (scriptError) {
    console.error(scriptError);
    return null; // Silent fail in production
  }

  // Loading state
  if (!script) {
    return null;
  }

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      {/* Chat Toggle Button */}
      {!isOpen && position !== 'inline' && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {(isOpen || position === 'inline') && (
        <div
          className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${
            isMinimized ? 'h-14' : 'h-[500px]'
          } ${position === 'inline' ? 'w-full' : 'w-[380px]'}`}
        >
          {/* Header */}
          <div className="bg-brand-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{script.name}</h3>
                <p className="text-xs text-brand-blue-100">{script.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              {position !== 'inline' && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' ? 'bg-brand-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-brand-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-brand-blue-100' : 'text-gray-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-blue-600" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length <= 1 && script.quick_actions.length > 0 && (
                <div className="px-4 py-2 border-t bg-white">
                  <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {script.quick_actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-gray-300 text-white rounded-full p-2.5 transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
