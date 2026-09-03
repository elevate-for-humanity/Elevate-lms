'use client';

import { useState, useCallback } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX,
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
  TaskState
} from './types';

interface LiveCanvasProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialProject?: ProjectState;
}

export function LiveCanvas({ isOpen = true, onClose, initialProject }: LiveCanvasProps) {
  // State
  const [state, setState] = useState<LiveCanvasState>({
    mode: initialProject ? 'building' : 'preview',
    isLive: Boolean(initialProject),
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

  const [messages, setMessages] = useState<ChatMessage[]>(() => initialProject ? [] : [{
    id: 'canvas-empty',
    type: 'system',
    content: 'No project is connected. Open a project from Repository or Course Builder to begin a real build.',
    timestamp: new Date().toISOString(),
  }]);
  const [thoughts] = useState<AIThought[]>([]);
  const [approvals] = useState<ApprovalRequest[]>([]);
  const [workers] = useState<WorkerState[]>([]);
  const [tasks] = useState<TaskState[]>([]);

  // Handlers
  const handleSendMessage = useCallback((message: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);

    if (!state.currentProject) {
      const systemMessage: ChatMessage = {
        id: `msg_${Date.now()}_system`,
        type: 'system',
        content: 'Command not run: no project or executor is connected to this canvas.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  }, [state.currentProject]);

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
    if (!state.currentProject || !state.previewUrl) return;
    setIsPublishing(true);
    setMessages(prev => [...prev, {
      id: `publish_${Date.now()}`,
      type: 'system',
      content: 'Publishing is unavailable until a verified deployment executor is connected.',
      timestamp: new Date().toISOString(),
    }]);
    setIsPublishing(false);
    setShowPublishModal(false);
  }, [state.currentProject, state.previewUrl]);

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
              {!state.currentProject ? 'No project' : state.isLive ? 'Building...' : 'Paused'}
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
            disabled={!state.currentProject || !state.previewUrl}
            title={!state.currentProject ? 'Open a project before publishing' : !state.previewUrl ? 'A verified preview is required before publishing' : 'Publish project'}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 font-medium text-sm transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
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
            isLoading={Boolean(state.currentProject) && state.isLive && workers.some(w => w.status === 'working')}
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
