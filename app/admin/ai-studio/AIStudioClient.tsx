'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Lazy-load all AI tool components
const AssetGenerator = dynamic(() => import('@/components/AssetGenerator'), { ssr: false });
const AdvancedVideoUploader = dynamic(() => import('@/components/admin/AdvancedVideoUploader'), { ssr: false });
const AutoProgramGenerator = dynamic(() => import('@/components/admin/AutoProgramGenerator'), { ssr: false });
const CopilotAssistant = dynamic(() => import('@/components/admin/CopilotAssistant'), { ssr: false });
const AutoFlowCharts = dynamic(() => import('@/components/admin/AutoFlowCharts'), { ssr: false });
const ExcelChartGenerator = dynamic(() => import('@/components/admin/ExcelChartGenerator'), { ssr: false });
const IntelligentDataProcessor = dynamic(() => import('@/components/admin/IntelligentDataProcessor'), { ssr: false });
const LearningBarrierAnalyzer = dynamic(() => import('@/components/admin/LearningBarrierAnalyzer'), { ssr: false });
const AutomaticCourseBuilder = dynamic(() => import('@/components/course/AutomaticCourseBuilder'), { ssr: false });

const TOOLS = [
  { id: 'asset-gen', label: 'Asset Generator', desc: 'DALL-E images and AI content' },
  { id: 'video-upload', label: 'Video Uploader', desc: 'Chunked upload with progress' },
  { id: 'course-builder', label: 'Course Builder', desc: 'AI-powered course generation' },
  { id: 'program-gen', label: 'Program Generator', desc: 'Auto-generate program structures' },
  { id: 'copilot', label: 'Copilot', desc: 'Admin AI assistant' },
  { id: 'flowcharts', label: 'Flow Charts', desc: 'Auto-generated process flows' },
  { id: 'excel-charts', label: 'Excel Charts', desc: 'Data visualization generator' },
  { id: 'data-processor', label: 'Data Processor', desc: 'AI data analysis' },
  { id: 'barrier-analyzer', label: 'Barrier Analyzer', desc: 'Student barrier analysis' },
] as const;

type ToolId = typeof TOOLS[number]['id'];

export default function AIStudioPage() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const renderTool = () => {
    switch (activeTool) {
      case 'asset-gen': return <AssetGenerator />;
      case 'video-upload': return <AdvancedVideoUploader />;
      case 'course-builder': return <AutomaticCourseBuilder />;
      case 'program-gen': return <AutoProgramGenerator />;
      case 'copilot': return <CopilotAssistant />;
      case 'flowcharts': return <AutoFlowCharts />;
      case 'excel-charts': return <ExcelChartGenerator />;
      case 'data-processor': return <IntelligentDataProcessor />;
      case 'barrier-analyzer': return <LearningBarrierAnalyzer />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'AI Studio' }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Studio</h1>
        <p className="text-gray-600 mb-8">All AI-powered tools in one place.</p>

        {/* Tool Grid */}
        {!activeTool && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-left"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{tool.label}</h3>
                <p className="text-sm text-gray-600">{tool.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Active Tool */}
        {activeTool && (
          <div>
            <button
              onClick={() => setActiveTool(null)}
              className="mb-4 text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to all tools
            </button>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {renderTool()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
