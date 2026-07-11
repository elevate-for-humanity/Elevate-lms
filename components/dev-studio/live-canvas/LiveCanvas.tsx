'use client';

import { useState, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Layers,
  Eye,
  Settings
} from 'lucide-react';
import { LeftPanel } from './LeftPanel';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';
import { BeforePublishModal } from './BeforePublishModal';
import type { 
  LiveCanvasState, 
  ChatMessage, 
  AIThought, 
  ApprovalRequest,
  DeviceView,
  ProjectState,
  WorkerState,
  TaskState,
  MessageType
} from './types';

interface LiveCanvasProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialProject?: ProjectState;
}

export function LiveCanvas({ isOpen = true, onClose, initialProject }: LiveCanvasProps) {
  // State
  const [state, setState] = useState<LiveCanvasState>({
    mode: 'building',
    isLive: true,
    followMode: true,
    currentProject: initialProject,
    workers: [],
    tasks: [],
    messages: [],
    deviceView: 'desktop',
  });
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Add sample data for demo
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'narration',
      content: "I'm creating the Employer Apprenticeship page now.",
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'ai',
      content: "I've connected the application form to your CRM. Students can now apply directly through the page.",
      timestamp: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'thought',
      content: "Adding Stripe payment processing for the enrollment deposit.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [thoughts] = useState<AIThought[]>([
    {
      id: '1',
      step: 1,
      thought: 'Designing the hero section',
      reasoning: 'First impressions matter. I should use a large hero with the program image and a clear CTA.',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      step: 2,
      thought: 'Building the enrollment form',
      reasoning: 'The form needs to capture all required information for WIOA eligibility.',
      confidence: 0.88,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [approvals] = useState<ApprovalRequest[]>([
    {
      id: '1',
      type: 'color_scheme',
      title: 'Color Scheme Change',
      description: 'Should I use red or blue as the primary color for this page?',
      options: [
        { label: 'Red (Brand)', value: 'red' },
        { label: 'Blue (Professional)', value: 'blue' },
      ],
      requestedAt: new Date().toISOString(),
      status: 'pending',
    },
  ]);

  const [workers] = useState<WorkerState[]>([
    { id: '1', name: 'Developer AI', role: 'dev', icon: '💻', color: 'blue', status: 'working', currentTask: 'Building Student Dashboard', progress: 92 },
    { id: '2', name: 'Designer AI', role: 'designer', icon: '🎨', color: 'purple', status: 'working', currentTask: 'Creating Hero Banner', progress: 75 },
    { id: '3', name: 'Marketing AI', role: 'marketing', icon: '📢', color: 'pink', status: 'working', currentTask: 'Writing SEO content', progress: 45 },
    { id: '4', name: 'QA AI', role: 'qa', icon: '🧪', color: 'emerald', status: 'idle', progress: 0 },
  ]);

  const [tasks] = useState<TaskState[]>([
    { id: '1', title: 'Create page structure', status: 'completed', progress: 100, priority: 'high', createdAt: new Date().toISOString() },
    { id: '2', title: 'Add hero section', status: 'in_progress', progress: 75, priority: 'high', createdAt: new Date().toISOString() },
    { id: '3', title: 'Build enrollment form', status: 'pending', progress: 0, priority: 'high', createdAt: new Date().toISOString() },
    { id: '4', title: 'Add testimonials', status: 'pending', progress: 0, priority: 'medium', createdAt: new Date().toISOString() },
    { id: '5', title: 'Connect Stripe', status: 'pending', progress: 0, priority: 'high', createdAt: new Date().toISOString() },
  ]);

  // Handlers
  const handleSendMessage = useCallback((message: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I'm on it! Making that change now.",
        "Got it. I'll update the design.",
        "Interesting idea. Let me adjust the layout.",
        "Sure, I can do that. This will take just a moment.",
      ];
      const aiResponse: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        type: 'ai',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  }, []);

  const handleApprove = useCallback((id: string, value?: string) => {
    console.info('Approved:', id, value);
  }, []);

  const handleReject = useCallback((id: string, reason?: string) => {
    console.info('Rejected:', id, reason);
  }, []);

  const handleDeviceChange = useCallback((device: DeviceView) => {
    setState(prev => ({ ...prev, deviceView: device }));
  }, []);

  const handleFollowModeToggle = useCallback(() => {
    setState(prev => ({ ...prev, followMode: !prev.followMode }));
  }, []);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    // Simulate publishing
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsPublishing(false);
    setShowPublishModal(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${state.isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-medium text-slate-700">
              {state.isLive ? 'Building...' : 'Paused'}
            </span>
          </div>
          
          {/* Project Name */}
          {state.currentProject && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {state.currentProject.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Follow Me Toggle */}
          <button
            onClick={handleFollowModeToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              state.followMode
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {state.followMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Follow Me
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-500" />
          </button>

          {/* Publish Button */}
          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 font-medium text-sm transition-colors"
          >
            Publish
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat/Progress */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200">
          <LeftPanel
            messages={messages}
            thoughts={thoughts}
            approvals={approvals}
            currentTask={workers.find(w => w.status === 'working')?.currentTask}
            isLive={state.isLive}
            followMode={state.followMode}
            onFollowModeToggle={handleFollowModeToggle}
            onSendMessage={handleSendMessage}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>

        {/* Center Panel - Live Preview */}
        <div className="flex-1">
          <CenterPanel
            previewUrl={state.previewUrl}
            isLoading={state.isLive && workers.some(w => w.status === 'working')}
            loadingMessage="Building your page..."
            deviceView={state.deviceView}
            onDeviceChange={handleDeviceChange}
            isLive={state.isLive}
          />
        </div>

        {/* Right Panel - Project Outline */}
        <div className="w-72 flex-shrink-0 border-l border-slate-200">
          <RightPanel
            project={state.currentProject}
            workers={workers}
            tasks={tasks}
          />
        </div>
      </div>

      {/* Before Publish Modal */}
      <BeforePublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />
    </div>
  );
}

export default LiveCanvas;
