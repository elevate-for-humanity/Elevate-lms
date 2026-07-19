'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  Image, 
  Code, 
  FileText, 
  BarChart3,
  Github,
  Layers,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  Play,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Settings
} from 'lucide-react';
import Link from 'next/link';

// Command categories
const COMMAND_CATEGORIES = [
  {
    id: 'import',
    label: 'Import & Connect',
    icon: Github,
    color: 'from-purple-500 to-purple-600',
    commands: [
      { text: 'Import this GitHub repository', desc: 'Analyze and import a codebase' },
      { text: 'Connect to an API', desc: 'Import OpenAPI/Swagger spec' },
      { text: 'Analyze this repo', desc: 'Quick analysis of any GitHub repo' },
      { text: 'Clone this website', desc: 'Use existing site as starting point' },
    ],
  },
  {
    id: 'agents',
    label: 'AI Workforce',
    icon: Bot,
    color: 'from-blue-500 to-blue-600',
    commands: [
      { text: 'Hire a recruiter agent', desc: 'AI for job matching and outreach' },
      { text: 'Create a marketing agent', desc: 'AI for content and campaigns' },
      { text: 'Add a grant writer', desc: 'AI for grant proposals' },
      { text: 'Train the support agent', desc: 'Add knowledge to existing agent' },
    ],
  },
  {
    id: 'content',
    label: 'Content Studio',
    icon: FileText,
    color: 'from-pink-500 to-pink-600',
    commands: [
      { text: 'Generate a video reel', desc: 'Create social media video' },
      { text: 'Write social posts', desc: 'Multi-platform content' },
      { text: 'Create a flyer', desc: 'Program/event flyer' },
      { text: 'Draft newsletter', desc: 'Email newsletter' },
    ],
  },
  {
    id: 'media',
    label: 'Media Studio',
    icon: Image,
    color: 'from-amber-500 to-amber-600',
    commands: [
      { text: 'Find a hero image', desc: 'Search stock photos' },
      { text: 'Generate an image', desc: 'AI image creation' },
      { text: 'Edit this image', desc: 'Remove background, etc.' },
      { text: 'Create brand assets', desc: 'Logo variants, icons' },
    ],
  },
  {
    id: 'build',
    label: 'Build & Deploy',
    icon: Code,
    color: 'from-emerald-500 to-emerald-600',
    commands: [
      { text: 'Build a landing page', desc: 'Create new page from scratch' },
      { text: 'Update the homepage', desc: 'Modify existing page' },
      { text: 'Add a new program', desc: 'Create program page' },
      { text: 'Deploy to production', desc: 'Push changes live' },
    ],
  },
];

// Demo data for Live Canvas
const DEMO_MESSAGES = [
  { id: '1', type: 'narration' as const, content: "I'm creating the Employer Apprenticeship page now.", timestamp: new Date().toISOString() },
  { id: '2', type: 'ai' as const, content: "I've connected the application form to your CRM.", timestamp: new Date().toISOString() },
  { id: '3', type: 'ai' as const, content: "Adding Stripe payment processing for enrollment deposits.", timestamp: new Date().toISOString() },
  { id: '4', type: 'narration' as const, content: "The Digital Student Binder is now linked to enrollment.", timestamp: new Date().toISOString() },
];

const DEMO_WORKERS = [
  { id: '1', name: 'Developer AI', role: 'dev', icon: '💻', color: 'blue', status: 'working' as const, currentTask: 'Building Student Dashboard', progress: 92 },
  { id: '2', name: 'Designer AI', role: 'designer', icon: '🎨', color: 'purple', status: 'working' as const, currentTask: 'Creating Hero Banner', progress: 75 },
  { id: '3', name: 'Marketing AI', role: 'marketing', icon: '📢', color: 'pink', status: 'working' as const, currentTask: 'Writing SEO content', progress: 45 },
  { id: '4', name: 'Video AI', role: 'video', icon: '🎥', color: 'orange', status: 'waiting' as const, currentTask: 'Creating promo reel', progress: 20 },
  { id: '5', name: 'QA AI', role: 'qa', icon: '🧪', color: 'emerald', status: 'idle' as const, currentTask: 'Running tests', progress: 0 },
];

const DEMO_TASKS = [
  { id: '1', title: 'Create page structure', status: 'completed' as const, progress: 100, priority: 'high' as const, createdAt: new Date().toISOString() },
  { id: '2', title: 'Add hero section', status: 'in_progress' as const, progress: 75, priority: 'high' as const, createdAt: new Date().toISOString() },
  { id: '3', title: 'Build enrollment form', status: 'pending' as const, progress: 0, priority: 'high' as const, createdAt: new Date().toISOString() },
  { id: '4', title: 'Add testimonials', status: 'pending' as const, progress: 0, priority: 'medium' as const, createdAt: new Date().toISOString() },
  { id: '5', title: 'Connect Stripe', status: 'pending' as const, progress: 0, priority: 'high' as const, createdAt: new Date().toISOString() },
  { id: '6', title: 'Add funding calculator', status: 'pending' as const, progress: 0, priority: 'medium' as const, createdAt: new Date().toISOString() },
];

export default function ParisOSPage() {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const startLiveDemo = useCallback(() => {
    setShowDemo(true);
    setIsLiveMode(true);
  }, []);

  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;
    
    setInputValue(command);
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setShowDemo(true);
    setIsLiveMode(true);
    setIsProcessing(false);
  }, []);

  const executeQuickCommand = useCallback((text: string) => {
    handleCommand(text);
  }, [handleCommand]);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PARIS</h1>
              <p className="text-xs text-slate-400">AI Operating System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <Link 
              href="/admin"
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {showDemo ? (
        <LiveCanvasDemo 
          onClose={() => {
            setShowDemo(false);
            setIsLiveMode(false);
          }}
          isMuted={isMuted}
        />
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Platform
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              What would you like to build?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Tell PARIS what you need. Import code, create agents, generate content, or build features.
            </p>
          </div>

          {/* Command Input */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="flex gap-4">
                <button className="p-3 bg-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommand(inputValue)}
                  placeholder="Type a command... (e.g., 'Import this GitHub repo' or 'Create a recruiter agent')"
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-lg outline-none"
                />
                <button
                  onClick={() => handleCommand(inputValue)}
                  disabled={isProcessing || !inputValue.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Execute
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <QuickActionCard
              icon={Play}
              title="Live Demo"
              desc="See Live Canvas in action"
              color="from-red-500 to-red-600"
              onClick={startLiveDemo}
            />
            <QuickActionCard
              icon={Github}
              title="Import Repo"
              desc="Connect GitHub repository"
              color="from-slate-600 to-slate-700"
              onClick={() => handleCommand('Import this GitHub repository')}
            />
            <QuickActionCard
              icon={Bot}
              title="Hire Agent"
              desc="Create AI workforce"
              color="from-blue-500 to-blue-600"
              onClick={() => handleCommand('Hire a recruiter agent')}
            />
          </div>

          {/* Command Categories */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Or choose a category</h3>
            {COMMAND_CATEGORIES.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                isExpanded={activeCategory === category.id}
                onToggle={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                onSelect={executeQuickCommand}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick Action Card
function QuickActionCard({ 
  icon: Icon, 
  title, 
  desc, 
  color, 
  onClick 
}: { 
  icon: React.ElementType; 
  title: string; 
  desc: string; 
  color: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-[1.02]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
    </button>
  );
}

// Category Section
function CategorySection({ 
  category, 
  isExpanded, 
  onToggle, 
  onSelect 
}: { 
  category: typeof COMMAND_CATEGORIES[0]; 
  isExpanded: boolean; 
  onToggle: () => void;
  onSelect: (text: string) => void;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
            <category.icon className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-white">{category.label}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-700 p-4 grid grid-cols-2 gap-3">
          {category.commands.map((cmd) => (
            <button
              key={cmd.text}
              onClick={() => onSelect(cmd.text)}
              className="flex items-start gap-3 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{cmd.text}</p>
                <p className="text-xs text-slate-400 mt-0.5">{cmd.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Live Canvas Demo Component
function LiveCanvasDemo({ onClose, isMuted }: { onClose: () => void; isMuted: boolean }) {
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [workers] = useState(DEMO_WORKERS);
  const [tasks] = useState(DEMO_TASKS);
  const [inputValue, setInputValue] = useState('');
  const [isLive] = useState(true);
  const [followMode, setFollowMode] = useState(true);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      const newMessages = [
        "I'm updating the hero section with your brand colors.",
        "Adding the enrollment form now.",
        "Connecting to the student database.",
        "The preview is almost ready!",
        "I've added the funding calculator.",
      ];
      
      const randomMsg = newMessages[Math.floor(Math.random() * newMessages.length)];
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: followMode && !isMuted ? 'narration' : 'ai',
        content: randomMsg,
        timestamp: new Date().toISOString(),
      }]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive, followMode, isMuted]);

  const handleSendMessage = (msg: string) => {
    if (!msg.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm on it! Making that change now.",
        timestamp: new Date().toISOString(),
      }]);
    }, 1500);
    
    setInputValue('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-medium text-white text-sm">
              {isLive ? 'Building...' : 'Paused'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-lg">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-white">Apprenticeship Page</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFollowMode(!followMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              followMode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {followMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Follow Me
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 font-medium text-sm transition-colors"
          >
            Exit Demo
          </button>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              PARIS AI
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  msg.type === 'user' ? 'bg-slate-600' : 
                  msg.type === 'narration' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}>
                  {msg.type === 'user' ? '👤' : msg.type === 'narration' ? '🎙️' : '🤖'}
                </div>
                <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                  {msg.type === 'narration' && (
                    <div className="text-xs text-yellow-400 mb-1">Narrating</div>
                  )}
                  <p className={`text-sm ${msg.type === 'user' ? 'text-white' : 'text-slate-300'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Type a command..."
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel - Preview */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Device Switcher */}
          <div className="flex items-center justify-center gap-2 p-2 bg-slate-800 border-b border-slate-700">
            {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
              <button
                key={device}
                onClick={() => setDeviceView(device)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  deviceView === device 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {device.charAt(0).toUpperCase() + device.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all ${
              deviceView === 'desktop' ? 'w-full max-w-5xl h-[600px]' :
              deviceView === 'tablet' ? 'w-[768px] h-[800px]' :
              'w-[375px] h-[700px]'
            }`}>
              {/* Mock Website Preview */}
              <div className="h-full flex flex-col">
                <div className="bg-brand-red-600 text-white text-center py-8 px-4">
                  <h1 className="text-2xl font-bold mb-2">Employer Apprenticeship</h1>
                  <p className="text-sm opacity-90">Train the workforce of tomorrow</p>
                  <button className="mt-4 px-6 py-2 bg-white text-brand-red-600 rounded-lg font-medium text-sm">
                    Get Started
                  </button>
                </div>
                <div className="flex-1 bg-slate-50 p-4">
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Earn While You Learn</p>
                          <p className="text-xs text-slate-500">Get paid during training</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Flexible Schedule</p>
                          <p className="text-xs text-slate-500">Work and train at your own pace</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Nationally Certified</p>
                          <p className="text-xs text-slate-500">DOL registered apprenticeship</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Project */}
        <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Project
            </h3>
            <div className="mt-2">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-red-600 to-brand-red-500 rounded-full w-[45%] transition-all" />
              </div>
              <p className="text-xs text-slate-400 mt-1">45% Complete</p>
            </div>
          </div>
          
          {/* Workers */}
          <div className="p-4 border-b border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-3">AI Workers</h4>
            <div className="space-y-2">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                  <span className="text-lg">{worker.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{worker.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {worker.status === 'working' ? `${worker.progress}%` : worker.status}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    worker.status === 'working' ? 'bg-blue-500 animate-pulse' :
                    worker.status === 'idle' ? 'bg-slate-500' :
                    'bg-yellow-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Tasks */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Tasks</h4>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-start gap-2 p-2 rounded-lg border-l-4 ${
                    task.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500' :
                    task.status === 'in_progress' ? 'bg-blue-500/10 border-blue-500' :
                    'bg-slate-700/50 border-slate-500'
                  }`}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  ) : task.status === 'in_progress' ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  )}
                  <p className={`text-sm flex-1 ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {task.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
