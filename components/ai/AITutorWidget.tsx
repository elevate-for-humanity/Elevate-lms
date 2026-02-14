'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AITutorWidget({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI tutor for ${courseName}. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const sessionId = useRef(crypto.randomUUID());

  // Log AI tutor interaction to DB
  const logTutorInteraction = async (userMessage: string, assistantResponse: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('ai_tutor_interactions')
      .insert({
        user_id: user?.id,
        session_id: sessionId.current,
        course_id: courseId,
        user_message: userMessage,
        assistant_response: assistantResponse.substring(0, 2000),
        timestamp: new Date().toISOString()
      });
  };

  // Load previous chat history from DB
  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_tutor_interactions')
        .select('user_message, assistant_response')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('timestamp', { ascending: true })
        .limit(10);

      if (data && data.length > 0) {
        const history: Message[] = [];
        data.forEach(d => {
          history.push({ role: 'user', content: d.user_message });
          history.push({ role: 'assistant', content: d.assistant_response });
        });
        setMessages(prev => [...prev, ...history]);
      }
    }
    if (isOpen) loadHistory();
  }, [isOpen, courseId, supabase]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseName,
          message: userMessage,
          history: messages
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-full p-4 shadow-lg transition-all z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-brand-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold">AI Tutor</h3>
              <p className="text-xs opacity-90">{courseName}</p>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-brand-blue-600 text-white'
                      : 'bg-gray-100 text-black'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask a question..."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-600"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
