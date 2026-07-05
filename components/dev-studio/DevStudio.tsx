'use client';

import { useState } from 'react';
import { Code, Palette, Database, GitBranch, Rocket, FileCode, Layers, Zap, Play, Eye, Settings } from 'lucide-react';

const TOOLS = [
  { id: 'builder', name: 'Visual Builder', icon: Palette, desc: 'Drag-and-drop page editor' },
  { id: 'course', name: 'Course Builder', icon: Layers, desc: 'Create LMS content' },
  { id: 'sop', name: 'SOP Builder', icon: FileCode, desc: 'Build procedures' },
  { id: 'form', name: 'Form Builder', icon: Database, desc: 'Design forms' },
  { id: 'workflow', name: 'Workflow Builder', icon: Zap, desc: 'Automate processes' },
  { id: 'ai', name: 'AI Prompt Manager', icon: Code, desc: 'Configure AI' },
];

export function DevStudio() {
  const [activeTool, setActiveTool] = useState('builder');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Rocket className="w-8 h-8 text-brand-red-500" />
            <div>
              <h1 className="text-xl font-bold">Dev Studio</h1>
              <p className="text-sm text-slate-400">Internal Development Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600">
              <GitBranch className="w-4 h-4" />main
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700">
              <Play className="w-4 h-4" />Deploy
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 min-h-[calc(100vh-73px)]">
          <h3 className="text-xs uppercase text-slate-500 font-bold mb-4">Development Tools</h3>
          <div className="space-y-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTool === tool.id ? 'bg-brand-red-600 text-white' : 'hover:bg-slate-700'
                }`}
              >
                <tool.icon className="w-5 h-5" />
                <span>{tool.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-slate-800 rounded-xl p-8 h-full min-h-[500px] flex flex-col items-center justify-center">
            <Code className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h2 className="text-2xl font-bold mb-2">{TOOLS.find(t => t.id === activeTool)?.name}</h2>
            <p className="text-slate-400 mb-6">{TOOLS.find(t => t.id === activeTool)?.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DevStudio;
