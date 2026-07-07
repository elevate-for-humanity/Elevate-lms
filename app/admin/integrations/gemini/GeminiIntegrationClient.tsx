'use client';

import { useState } from 'react';
import { Bot, RefreshCw, CheckCircle, AlertCircle, Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function GeminiIntegrationClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [usageStats, setUsageStats] = useState({ requests: 0, tokens: 0 });

  const connectGemini = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/gemini/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        setConnected(true);
        fetchStats();
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/integrations/gemini/stats');
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !connected) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/integrations/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        fetchStats();
      }
    } catch (err) {
      console.error('Chat failed:', err);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Gemini AI Integration</h1>
        {connected && (
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh Stats
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Requests</p>
              <p className="text-xl font-bold text-slate-900">{usageStats.requests.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tokens Used</p>
              <p className="text-xl font-bold text-slate-900">{usageStats.tokens.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${connected ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Bot className={`w-6 h-6 ${connected ? 'text-green-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h2 className="font-medium text-slate-900">Gemini AI</h2>
            <p className="text-sm text-slate-500">
              {connected ? 'Connected and ready' : 'Connect with your Gemini API key'}
            </p>
          </div>
        </div>

        {!connected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              onClick={connectGemini}
              disabled={loading || !apiKey}
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Gemini'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 h-64 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <p className="text-slate-500 text-center">Start a conversation with Gemini</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-brand-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-200 text-slate-900 rounded-lg p-3">
                    <p className="text-sm animate-pulse">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
