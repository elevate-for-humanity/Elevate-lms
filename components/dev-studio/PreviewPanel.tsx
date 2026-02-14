"use client";

import React from 'react';

import { useState } from 'react';
import { RefreshCw, ExternalLink, Monitor, Smartphone, Tablet } from 'lucide-react';

interface PreviewPanelProps {
  url?: string;
  filePath?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export default function PreviewPanel({ url = 'http://localhost:3000', filePath }: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState(url);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [key, setKey] = useState(0);

  const refresh = () => {
    setKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  const deviceSizes = {
    desktop: 'w-full',
    tablet: 'w-[768px] mx-auto',
    mobile: 'w-[375px] mx-auto'
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-black">Live Preview</span>
          {filePath && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {filePath}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device Selector */}
          <div className="flex gap-1 bg-white border rounded p-1">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1 rounded ${device === 'desktop' ? 'bg-brand-blue-100 text-brand-blue-600' : 'text-black hover:bg-gray-100'}`}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1 rounded ${device === 'tablet' ? 'bg-brand-blue-100 text-brand-blue-600' : 'text-black hover:bg-gray-100'}`}
              title="Tablet view"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1 rounded ${device === 'mobile' ? 'bg-brand-blue-100 text-brand-blue-600' : 'text-black hover:bg-gray-100'}`}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refresh}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4 text-black" />
          </button>

          {/* Open in New Tab */}
          <button
            onClick={openInNewTab}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className={`${deviceSizes[device]} h-full bg-white shadow-lg`}>
          <iframe
            key={key}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
}
