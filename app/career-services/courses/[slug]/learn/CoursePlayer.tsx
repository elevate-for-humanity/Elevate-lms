'use client';

import { useState } from 'react';
import { 
  Play, 
  
  Clock, 
  ChevronRight,
  Download,
  MessageSquare
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  sort_order: number;
  is_preview: boolean;
  video_url?: string;
}

interface Course {
  id: string;
  title: string;
  subtitle: string;
}

interface CoursePlayerProps {
  course: Course;
  modules: Module[];
}

export function CoursePlayer({ course, modules }: CoursePlayerProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  const currentModule = modules[currentModuleIndex];

  const markComplete = () => {
    if (!completedModules.includes(currentModule.id)) {
      setCompletedModules([...completedModules, currentModule.id]);
    }
    // Auto-advance to next module
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const progress = Math.round((completedModules.length / modules.length) * 100);

  return (
    <div className="flex h-[calc(100vh-60px)]">
      {/* Video Player Area */}
      <div className="flex-1 flex flex-col">
        {/* Video */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {currentModule?.video_url ? (
            <video
              key={currentModule.id}
              src={currentModule.video_url}
              controls
              autoPlay
              className="max-h-full max-w-full"
              onEnded={markComplete}
            />
          ) : (
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10" />
              </div>
              <p className="text-xl font-semibold mb-2">{currentModule?.title}</p>
              <p className="text-gray-400">Click play to start the lesson</p>
            </div>
          )}
        </div>

        {/* Module Info */}
        <div className="bg-gray-800 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {currentModule?.title}
                </h2>
                <p className="text-gray-400">{currentModule?.description}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{currentModule?.duration_minutes} min</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={markComplete}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  completedModules.includes(currentModule?.id)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <span className="text-slate-400 flex-shrink-0">•</span>
                {completedModules.includes(currentModule?.id) ? 'Completed' : 'Mark Complete'}
              </button>

              {currentModuleIndex < modules.length - 1 && (
                <button
                  onClick={() => setCurrentModuleIndex(currentModuleIndex + 1)}
                  className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 flex items-center gap-2"
                >
                  Next Lesson
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Module List */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
        {/* Progress */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Your Progress</span>
            <span className="text-sm font-medium text-white">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {completedModules.length} of {modules.length} lessons completed
          </p>
        </div>

        {/* Module List */}
        <div className="p-2">
          <h3 className="text-sm font-semibold text-gray-400 px-2 py-2">Course Content</h3>
          <div className="space-y-1">
            {modules.map((module, index) => (
              <button
                key={module.id}
                onClick={() => setCurrentModuleIndex(index)}
                className={`w-full text-left p-3 rounded-lg transition flex items-start gap-3 ${
                  currentModuleIndex === index
                    ? 'bg-brand-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {completedModules.includes(module.id) ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                      currentModuleIndex === index ? 'border-white' : 'border-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{module.title}</p>
                  <p className={`text-xs ${currentModuleIndex === index ? 'text-brand-blue-200' : 'text-gray-500'}`}>
                    {module.duration_minutes} min
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Resources</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 text-sm text-gray-300 hover:text-white p-2 rounded hover:bg-gray-700">
              <Download className="w-4 h-4" />
              Download Worksheets
            </button>
            <button className="w-full flex items-center gap-2 text-sm text-gray-300 hover:text-white p-2 rounded hover:bg-gray-700">
              <MessageSquare className="w-4 h-4" />
              Ask a Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
