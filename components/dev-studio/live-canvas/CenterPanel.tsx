'use client';

import { useState } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import type { DeviceView } from './types';

interface CenterPanelProps {
  previewUrl?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  deviceView: DeviceView;
  onDeviceChange: (device: DeviceView) => void;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  isLive?: boolean;
}

export function CenterPanel({
  previewUrl,
  isLoading,
  loadingMessage,
  deviceView,
  onDeviceChange,
  onRefresh,
  onFullscreen,
  isLive = false,
}: CenterPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onFullscreen?.();
  };

  // Device dimensions
  const deviceDimensions: Record<DeviceView, { width: string; height: string }> = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '812px' },
  };

  return (
    <div className={`flex flex-col h-full bg-slate-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          {/* Device Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            {[
              { view: 'desktop' as DeviceView, icon: Monitor, label: 'Desktop' },
              { view: 'tablet' as DeviceView, icon: Tablet, label: 'Tablet' },
              { view: 'mobile' as DeviceView, icon: Smartphone, label: 'Mobile' },
            ].map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => onDeviceChange(view)}
                className={`p-2 rounded-md transition-colors ${
                  deviceView === view
                    ? 'bg-white shadow-sm text-brand-red-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Zoom indicator */}
          <span className="text-xs text-slate-500 font-medium">
            {deviceView === 'desktop' ? '100%' : deviceView === 'tablet' ? '75%' : '50%'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live indicator */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-600 rounded-full">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          )}

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-md transition-colors ${
              showPreview ? 'bg-slate-100 text-slate-700' : 'text-slate-400'
            }`}
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh preview"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-[#1a1a2e]">
        {isLoading ? (
          <LoadingPreview message={loadingMessage} />
        ) : showPreview ? (
          <DeviceFrame 
            device={deviceView} 
            dimensions={deviceDimensions[deviceView]}
            isFullscreen={isFullscreen}
          >
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 bg-white"
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <EmptyPreview />
            )}
          </DeviceFrame>
        ) : (
          <div className="text-center text-slate-400">
            <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Preview hidden</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-slate-200">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {previewUrl && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                Connected
              </span>
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-brand-red-600"
              >
                Open in new tab
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-red-600"
        >
          <RotateCcw className="w-3 h-3" />
          Reload
        </button>
      </div>
    </div>
  );
}

// Device Frame Component
function DeviceFrame({ 
  device, 
  dimensions, 
  isFullscreen,
  children 
}: { 
  device: DeviceView; 
  dimensions: { width: string; height: string };
  isFullscreen: boolean;
  children: React.ReactNode;
}) {
  if (device === 'desktop' || isFullscreen) {
    return <div className="w-full h-full">{children}</div>;
  }

  return (
    <div 
      className="bg-white rounded-3xl p-2 shadow-2xl"
      style={{ 
        width: dimensions.width,
        height: isFullscreen ? '100%' : 'calc(100vh - 200px)',
        maxHeight: isFullscreen ? '100vh' : '800px',
      }}
    >
      {/* Phone/Tablet notch/bar */}
      {device === 'mobile' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
      )}
      
      {/* Screen */}
      <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-slate-200 bg-white">
        {children}
      </div>

      {/* Home indicator (mobile) */}
      {device === 'mobile' && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full" />
      )}
    </div>
  );
}

// Loading Preview
function LoadingPreview({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
        <Loader2 className="absolute inset-0 w-20 h-20 animate-spin text-brand-red-600 mx-auto" />
      </div>
      <p className="mt-6 text-white font-medium">
        {message || 'Building preview...'}
      </p>
      <p className="mt-2 text-slate-400 text-sm">
        This may take a few seconds
      </p>
    </div>
  );
}

// Empty Preview
function EmptyPreview() {
  return (
    <div className="flex flex-col items-center justify-center text-slate-400">
      <div className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center mb-4">
        <Monitor className="w-12 h-12 opacity-50" />
      </div>
      <p className="text-lg font-medium">No preview yet</p>
      <p className="text-sm mt-1">
        Start a project to see the live preview
      </p>
    </div>
  );
}

export default CenterPanel;
