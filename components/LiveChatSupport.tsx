"use client";

import React from 'react';

import { useState, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export function LiveChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: 'Hello! How can I help you today?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/session', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.session_id) {
        setSessionId(data.session_id);
      }
    } catch {
      // Session creation failed — chat still works locally
    }
  }, []);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen, sessionId, initSession]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Persist via API route
    if (sessionId) {
      fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          sender_type: 'user',
          body: message,
        }),
      }).catch(() => {});
    }

    // Auto-response (would be replaced by real agent or AI in production)
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: 'Thank you for your message. An agent will respond shortly. You can also visit our FAQ at /faq or submit a request at /contact.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, agentResponse]);

      if (sessionId) {
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            sender_type: 'agent',
            body: agentResponse.text,
          }),
        }).catch(() => {});
      }
    }, 1000);
  };

  if (!isOpen) return null; {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16    text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-2xl z-50"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      <div className="   text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold">Live Support</h3>
          <p className="text-xs text-brand-red-100">● Online</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-2xl hover:opacity-80">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.sender === 'user' ? 'bg-brand-orange-600 text-white' : 'bg-gray-100 text-black'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-brand-red-200' : 'text-gray-500'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
