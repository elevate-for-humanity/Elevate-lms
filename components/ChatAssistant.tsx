"use client";

import React from 'react';

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  HelpCircle,
  Book,
  Users,
  Calendar,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  pageContext?: string;
  userRole?: 'student' | 'instructor' | 'admin' | 'guest';
}

export default function ChatAssistant({
  pageContext = 'general',
  userRole = 'guest',
}: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const getWelcomeMessage = () => {
    const contextMessages: Record<string, string> = {
      courses:
        "👋 Hi! I'm here to help you with courses. Ask me about enrolling, course content, or finding the right program for you!",
      dashboard:
        '👋 Welcome! I can help you navigate your dashboard, track your progress, or answer questions about your learning journey.',
      profile:
        "👋 Hi! Need help updating your profile, managing settings, or understanding your achievements? I'm here to assist!",
      admin:
        '👋 Hello! I can help with administrative tasks, reporting, user management, and system configuration.',
      general:
        "👋 Hi! I'm your AI assistant. I can help you navigate the platform, answer questions, and guide you to the right resources. How can I help you today?",
    };
    return contextMessages[pageContext] || contextMessages.general;
  };

  const getQuickActions = () => {
    const actions: Record<string, string[]> = {
      courses: [
        'Show me available courses',
        'How do I enroll?',
        'What certifications can I earn?',
        'Tell me about financial aid',
      ],
      dashboard: [
        "What's my progress?",
        'Show upcoming deadlines',
        'How do I access my courses?',
        'View my certificates',
      ],
      profile: [
        'How do I update my info?',
        'Change my password',
        'View my achievements',
        'Download my transcript',
      ],
      admin: [
        'Generate a report',
        'View user analytics',
        'Manage enrollments',
        'System settings',
      ],
      general: [
        'How do I get started?',
        'What programs do you offer?',
        'How much does it cost?',
        'Contact support',
      ],
    };
    return actions[pageContext] || actions.general;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
          context: {
            page: pageContext,
            userRole,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setConversationId(data.conversationId);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) { /* Error handled silently */ 
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I'm having trouble connecting right now. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null; {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="chat-assistant-button"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '100px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--brand-info)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow =
            '0 6px 16px rgba(59, 130, 246, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow =
            '0 4px 12px rgba(59, 130, 246, 0.4)';
        }}
        aria-label="Open chat assistant"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div
      className="chat-assistant-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '100px',
        width: isMinimized ? '320px' : '400px',
        height: isMinimized ? '60px' : '600px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--brand-info)',
          color: 'white',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageCircle size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              AI Assistant
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
              Always here to help
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: 'var(--brand-surface)',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent:
                    message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor:
                      message.role === 'user' ? 'var(--brand-info)' : 'white',
                    color:
                      message.role === 'user' ? 'white' : 'var(--brand-text)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div
                      className="typing-dot"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-text-light)',
                        animation: 'typing 1.4s infinite',
                      }}
                    />
                    <div
                      className="typing-dot"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-text-light)',
                        animation: 'typing 1.4s infinite 0.2s',
                      }}
                    />
                    <div
                      className="typing-dot"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-text-light)',
                        animation: 'typing 1.4s infinite 0.4s',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Quick Actions */}
          {messages.length === 1 && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'white',
                borderTop: '1px solid var(--brand-border)',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  color: 'var(--brand-text-muted)',
                  fontWeight: '500',
                }}
              >
                Quick actions:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getQuickActions().map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid var(--brand-border)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--brand-text)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--brand-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Input */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderTop: '1px solid var(--brand-border)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid var(--brand-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-info)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-border)';
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  padding: '12px 16px',
                  backgroundColor:
                    input.trim() && !loading
                      ? 'var(--brand-info)'
                      : 'var(--brand-border)',
                  color:
                    input.trim() && !loading
                      ? 'white'
                      : 'var(--brand-text-light)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
