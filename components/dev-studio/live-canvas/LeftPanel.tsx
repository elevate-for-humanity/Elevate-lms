'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Brain, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import type { 
  ChatMessage, 
  AIThought, 
  ApprovalRequest, 
  PanelTab,
  TaskStatus,
  STATUS_COLORS,
  MessageType
} from './types';

interface LeftPanelProps {
  messages: ChatMessage[];
  thoughts: AIThought[];
  approvals: ApprovalRequest[];
  currentTask?: string;
  isLive: boolean;
  followMode: boolean;
  onFollowModeToggle: () => void;
  onSendMessage: (message: string) => void;
  onApprove: (id: string, value?: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export function LeftPanel({
  messages,
  thoughts,
  approvals,
  currentTask,
  isLive,
  followMode,
  onFollowModeToggle,
  onSendMessage,
  onApprove,
  onReject,
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showThoughts, setShowThoughts] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Filter messages by tab
  const tabMessages = activeTab === 'thoughts' 
    ? messages.filter(m => m.type === 'thought' || m.type === 'narration')
    : messages;

  // Pending approvals count
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          PARIS AI
        </h2>
        <div className="flex items-center gap-2">
          {/* Follow Me Toggle */}
          <button
            onClick={onFollowModeToggle}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              followMode 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-slate-100 text-slate-600'
            }`}
            title="Follow Me Mode"
          >
            {followMode ? '🔊 Narrating' : '🔇 Silent'}
          </button>
          {/* Live Indicator */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-600 rounded-full">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-xs font-medium">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'chat' as PanelTab, label: 'Chat', icon: MessageCircle },
          { id: 'thoughts' as PanelTab, label: 'Thoughts', icon: Brain },
          { id: 'progress' as PanelTab, label: 'Progress', icon: Clock },
          { id: 'approvals' as PanelTab, label: 'Approvals', icon: CheckCircle2, badge: pendingApprovals },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-brand-red-600 border-b-2 border-brand-red-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <ChatTab 
            messages={tabMessages} 
            messagesEndRef={messagesEndRef}
          />
        )}
        
        {activeTab === 'thoughts' && (
          <ThoughtsTab 
            thoughts={thoughts}
            isExpanded={showThoughts}
            onToggle={() => setShowThoughts(!showThoughts)}
          />
        )}
        
        {activeTab === 'progress' && (
          <ProgressTab currentTask={currentTask} />
        )}
        
        {activeTab === 'approvals' && (
          <ApprovalsTab 
            approvals={approvals.filter(a => a.status === 'pending')}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}
      </div>

      {/* Input */}
      {activeTab === 'chat' && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a command or ask PARIS..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Try: "Make the hero larger" or "Use blue instead of red"
          </p>
        </div>
      )}
    </div>
  );
}

// Chat Tab Component
function ChatTab({ 
  messages, 
  messagesEndRef 
}: { 
  messages: ChatMessage[]; 
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-2">Start a conversation</h3>
        <p className="text-sm text-slate-500">
          Tell PARIS what to build or ask questions about the project
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

// Message Bubble
function MessageBubble({ message }: { message: ChatMessage }) {
  const isAI = message.type === 'ai' || message.type === 'thought' || message.type === 'narration';
  const isSystem = message.type === 'system';
  
  const getIcon = () => {
    switch (message.type) {
      case 'narration':
        return '🎙️';
      case 'thought':
        return '💭';
      case 'approval':
        return '⚠️';
      case 'user':
        return '👤';
      default:
        return '🤖';
    }
  };

  return (
    <div className={`flex gap-3 ${isSystem ? 'justify-center' : ''}`}>
      {!isSystem && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
          isAI ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
        }`}>
          {getIcon()}
        </div>
      )}
      <div className={`flex-1 ${isSystem ? 'text-center' : ''}`}>
        {message.type === 'narration' && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-800 text-xs font-medium rounded-full mb-1">
            <Volume2 className="w-3 h-3" />
            Narrating
          </div>
        )}
        <div className={`prose prose-sm max-w-none ${
          isAI ? 'text-slate-700' : isSystem ? 'text-slate-500 italic' : 'text-slate-900'
        }`}>
          {message.content}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

// Thoughts Tab Component
function ThoughtsTab({ 
  thoughts, 
  isExpanded, 
  onToggle 
}: { 
  thoughts: AIThought[]; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  if (thoughts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Brain className="w-16 h-16 text-slate-200 mb-4" />
        <h3 className="font-semibold text-slate-900 mb-2">AI Reasoning</h3>
        <p className="text-sm text-slate-500">
          Watch PARIS think through each decision
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-4"
      >
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {thoughts.length} thoughts
      </button>
      
      <div className="space-y-3">
        {thoughts.map((thought, index) => (
          <div 
            key={thought.id} 
            className={`p-4 rounded-lg border ${
              index === thoughts.length - 1 
                ? 'border-blue-200 bg-blue-50' 
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {thought.step}
              </span>
              <span className="text-xs text-slate-500">
                Confidence: {Math.round(thought.confidence * 100)}%
              </span>
            </div>
            <p className="font-medium text-slate-900 mb-1">{thought.thought}</p>
            <p className="text-sm text-slate-600">{thought.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Progress Tab Component
function ProgressTab({ currentTask }: { currentTask?: string }) {
  return (
    <div className="p-4">
      {currentTask ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-700">Currently Working</span>
          </div>
          <p className="text-slate-900">{currentTask}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <Clock className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Waiting for tasks</h3>
          <p className="text-sm text-slate-500">
            Tasks will appear here as PARIS works
          </p>
        </div>
      )}
    </div>
  );
}

// Approvals Tab Component
function ApprovalsTab({ 
  approvals, 
  onApprove, 
  onReject 
}: { 
  approvals: ApprovalRequest[]; 
  onApprove: (id: string, value?: string) => void;
  onReject: (id: string, reason?: string) => void;
}) {
  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <CheckCircle2 className="w-16 h-16 text-emerald-200 mb-4" />
        <h3 className="font-semibold text-slate-900 mb-2">All clear!</h3>
        <p className="text-sm text-slate-500">
          No pending approvals
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {approvals.map(approval => (
        <div key={approval.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">{approval.title}</h4>
              <p className="text-sm text-slate-600 mb-3">{approval.description}</p>
              
              {approval.options && approval.options.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {approval.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onApprove(approval.id, option.value)}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => onApprove(approval.id)}
                    className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(approval.id)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                Requested {new Date(approval.requestedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LeftPanel;
