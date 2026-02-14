'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message, OpenFile } from '../types';

interface AIChatProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  currentFile?: OpenFile;
  repoId?: string;
  userId?: string;
  onApplyCode: (code: string) => void;
}

export function AIChat({ messages, setMessages, currentFile, repoId, userId, onApplyCode }: AIChatProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages([...messages, { role: 'user', content: userMessage }]);
    setLoading(true);
    setStreamingContent('');

    const fileContext = currentFile 
      ? `File: ${currentFile.path}\n\n${currentFile.content.slice(0, 4000)}`
      : '';

    try {
      const res = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          fileContext,
          repo_id: repoId,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {
              // Partial JSON chunk — skip until complete
            }
          }
        }
      }

      setMessages([...messages, { role: 'user', content: userMessage }, { role: 'assistant', content: fullContent }]);
      setStreamingContent('');
    } catch (e) {
      setMessages([...messages, { role: 'user', content: userMessage }, { role: 'assistant', content: `Error: ${e}` }]);
    }
    
    setLoading(false);
  };

  const quickActions = [
    { label: '✨ Explain', prompt: 'Explain this code' },
    { label: '🐛 Fix bugs', prompt: 'Find and fix bugs in this code' },
    { label: '♻️ Refactor', prompt: 'Refactor this code to be cleaner' },
    { label: '🧪 Tests', prompt: 'Write tests for this code' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #30363d', 
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(168, 85, 247, 0.05)',
      }}>
        <span style={{ 
          fontSize: 24,
          filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))',
        }}>
          🤖
        </span>
        <div>
          <div style={{ 
            fontWeight: 600, 
            fontSize: 14,
            background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AI Assistant
          </div>
          {currentFile && (
            <div style={{ fontSize: 11, color: '#8b949e' }}>
              Context: {currentFile.path.split('/').pop()}
            </div>
          )}
        </div>
      </div>
      
      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {messages.length === 0 && !streamingContent && (
          <div style={{ 
            textAlign: 'center', 
            padding: 24,
            color: '#8b949e',
          }}>
            <div style={{ 
              fontSize: 48, 
              marginBottom: 16,
              filter: 'grayscale(0.5)',
            }}>
              💬
            </div>
            <div style={{ fontSize: 14, marginBottom: 16 }}>
              Ask me anything about your code
            </div>
            
            {/* Quick actions */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 8, 
              justifyContent: 'center',
              marginTop: 16,
            }}>
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => {
                    setInput(action.prompt);
                  }}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #30363d',
                    borderRadius: 20,
                    color: '#e6edf3',
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = 'rgba(168, 85, 247, 0.2)';
                    (e.target as HTMLElement).style.borderColor = 'rgba(168, 85, 247, 0.5)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                    (e.target as HTMLElement).style.borderColor = '#30363d';
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} onApply={onApplyCode} />
        ))}
        
        {streamingContent && (
          <ChatMessage message={{ role: 'assistant', content: streamingContent }} onApply={onApplyCode} />
        )}
        
        {loading && !streamingContent && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            color: '#a855f7', 
            fontSize: 13, 
            padding: 12,
          }}>
            <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>●</span>
            <span style={{ animation: 'pulse 1s ease-in-out infinite', animationDelay: '0.2s' }}>●</span>
            <span style={{ animation: 'pulse 1s ease-in-out infinite', animationDelay: '0.4s' }}>●</span>
            <span style={{ marginLeft: 8, color: '#8b949e' }}>Thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div style={{ 
        padding: 16, 
        borderTop: '1px solid #30363d', 
        display: 'flex', 
        gap: 10,
        background: 'rgba(0,0,0,0.2)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask AI..."
          disabled={loading}
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid #30363d', 
            borderRadius: 12, 
            color: '#e6edf3',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={e => (e.target as HTMLElement).style.borderColor = '#a855f7'}
          onBlur={e => (e.target as HTMLElement).style.borderColor = '#30363d'}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
          style={{ 
            padding: '12px 20px', 
            background: loading || !input.trim() 
              ? '#21262d' 
              : 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', 
            border: 'none', 
            borderRadius: 12, 
            color: '#fff', 
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: loading || !input.trim() 
              ? 'none' 
              : '0 4px 12px rgba(168, 85, 247, 0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function ChatMessage({ message, onApply }: { message: Message; onApply: (code: string) => void }) {
  const isUser = message.role === 'user';
  const code = !isUser ? extractCode(message.content) : null;
  
  return (
    <div style={{ 
      marginBottom: 16, 
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: 14,
        background: isUser 
          ? 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)' 
          : 'rgba(255,255,255,0.05)',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        border: isUser ? 'none' : '1px solid #30363d',
        boxShadow: isUser ? '0 4px 12px rgba(31, 111, 235, 0.3)' : 'none',
      }}>
        {!isUser && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            marginBottom: 8,
            fontSize: 11,
            color: '#a855f7',
            fontWeight: 600,
          }}>
            <span>🤖</span>
            <span>AI</span>
          </div>
        )}
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          fontSize: 13,
          lineHeight: 1.6,
          color: '#e6edf3',
        }}>
          {renderContent(message.content)}
        </div>
        {code && (
          <button 
            onClick={() => onApply(code)} 
            style={{ 
              marginTop: 12, 
              padding: '8px 16px', 
              background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)', 
              border: 'none', 
              borderRadius: 8, 
              color: '#fff', 
              cursor: 'pointer', 
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(35, 134, 54, 0.3)',
            }}
          >
            <span>✓</span>
            Apply Code
          </button>
        )}
      </div>
    </div>
  );
}

function extractCode(content: string): string | null {
  const match = content.match(/```[\w.]*\n([\s\S]*?)```/);
  return match ? match[1] : null;
}

function renderContent(content: string) {
  // Simple markdown-like rendering for code blocks
  const parts = content.split(/(```[\w.]*\n[\s\S]*?```)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```([\w.]*)\n([\s\S]*?)```/);
      if (match) {
        const [, lang, code] = match;
        return (
          <div key={i} style={{
            margin: '12px 0',
            background: '#0d1117',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #30363d',
          }}>
            {lang && (
              <div style={{
                padding: '6px 12px',
                background: '#161b22',
                borderBottom: '1px solid #30363d',
                fontSize: 11,
                color: '#8b949e',
                fontFamily: 'monospace',
              }}>
                {lang}
              </div>
            )}
            <pre style={{
              margin: 0,
              padding: 12,
              overflow: 'auto',
              fontSize: 12,
              fontFamily: '"Fira Code", monospace',
              color: '#e6edf3',
            }}>
              {code}
            </pre>
          </div>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}
