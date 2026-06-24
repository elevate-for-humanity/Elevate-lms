'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Play, ChevronRight, ChevronLeft,
  Lock, Clock, FileText, Video, Award, Search, Loader2, AlertCircle
} from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'lab';
  duration?: string;
  description?: string;
  completed: boolean;
  contentUrl?: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: number;
  completed: number;
  locked: boolean;
  unlockAt: number;
  chapters: Chapter[];
}

interface TrainingData {
  course: {
    title: string;
    subtitle: string;
    partner: string;
    estimatedWeeks: number;
  };
  modules: Module[];
  progress: {
    totalLessons: number;
    completedLessons: number;
    percentComplete: number;
  };
  apprenticeHours: number;
}

function ModuleCard({ module, onSelect, apprenticeHours }: { 
  module: Module; 
  onSelect: () => void;
  apprenticeHours: number;
}) {
  const progress = module.lessons > 0 ? (module.completed / module.lessons) * 100 : 0;
  
  return (
    <button
      onClick={onSelect}
      disabled={module.locked}
      className={`w-full text-left bg-slate-800 rounded-xl p-4 ${
        module.locked ? 'opacity-60' : 'active:bg-slate-700'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          module.locked 
            ? 'bg-slate-700' 
            : progress === 100 
              ? 'bg-brand-green-500/20' 
              : 'bg-brand-blue-500/20'
        }`}>
          {module.locked ? (
            <Lock className="w-6 h-6 text-slate-500" />
          ) : progress === 100 ? (
            <span className="text-slate-500 flex-shrink-0">•</span>
          ) : (
            <BookOpen className="w-6 h-6 text-brand-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{module.title}</h3>
          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{module.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-slate-500 text-xs">
              {module.completed}/{module.lessons} lessons
            </span>
            {module.locked && (
              <span className="text-amber-400 text-xs">
                Unlocks at {module.unlockAt} hours
              </span>
            )}
          </div>
          {!module.locked && (
            <div className="mt-3">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    progress === 100 ? 'bg-brand-green-500' : 'bg-brand-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <ChevronRight className={`w-5 h-5 ${module.locked ? 'text-slate-600' : 'text-slate-500'}`} />
      </div>
    </button>
  );
}

function ChapterItem({ chapter, onComplete }: { 
  chapter: Chapter;
  onComplete: (lessonId: string, completed: boolean) => void;
}) {
  const [completing, setCompleting] = useState(false);
  
  const TypeIcon = chapter.type === 'video' ? Video 
    : chapter.type === 'quiz' ? Award 
    : chapter.type === 'lab' ? BookOpen
    : FileText;
    
  const typeColor = chapter.type === 'video' ? 'text-brand-blue-400' 
    : chapter.type === 'quiz' ? 'text-amber-400' 
    : chapter.type === 'lab' ? 'text-brand-blue-400'
    : 'text-brand-green-400';
    
  const typeBg = chapter.type === 'video' ? 'bg-brand-blue-500/20' 
    : chapter.type === 'quiz' ? 'bg-amber-500/20' 
    : chapter.type === 'lab' ? 'bg-brand-blue-500/20'
    : 'bg-brand-green-500/20';

  const handleToggleComplete = async () => {
    setCompleting(true);
    await onComplete(chapter.id, !chapter.completed);
    setCompleting(false);
  };
  
  return (
    <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4">
      <button
        onClick={handleToggleComplete}
        disabled={completing}
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeBg} ${
          completing ? 'opacity-50' : ''
        }`}
      >
        {completing ? (
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        ) : chapter.completed ? (
          <span className="text-slate-500 flex-shrink-0">•</span>
        ) : (
          <TypeIcon className={`w-5 h-5 ${typeColor}`} />
        )}
      </button>
      <div className="flex-1">
        <p className={`font-medium ${chapter.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
          {chapter.title}
        </p>
        {chapter.duration && (
          <p className="text-slate-500 text-sm">{chapter.duration}</p>
        )}
      </div>
      {chapter.type === 'video' && !chapter.completed && chapter.contentUrl && (
        <a href={chapter.contentUrl} target="_blank" rel="noopener noreferrer">
          <Play className="w-5 h-5 text-brand-blue-400" />
        </a>
      )}
    </div>
  );
}

export default function BarberTrainingPage() {
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const response = await fetch('/api/pwa/barber/training');
      
      if (response.status === 401) {
        setError('Please sign in to access training materials');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch training data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching training:', err);
      setError('Failed to load training materials');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/pwa/barber/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, completed }),
      });

      if (response.ok) {
        await fetchTrainingData();
        
        if (selectedModule && data) {
          const updatedModule = data.modules.find(m => m.id === selectedModule.id);
          if (updatedModule) {
            setSelectedModule(updatedModule);
          }
        }
      }
    } catch (err) {
      console.error('Error updating lesson:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-white">Loading training materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-brand-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link
            href="/login?redirect=/pwa/barber/training"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filteredModules = data.modules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedModule) {
    const currentModule = data.modules.find(m => m.id === selectedModule.id) || selectedModule;
    
    return (
      <div className="min-h-screen bg-slate-900 pb-20">
        <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
          <button 
            onClick={() => setSelectedModule(null)}
            className="flex items-center gap-2 text-brand-blue-400 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Modules
          </button>
          <h1 className="text-xl font-bold text-white">{currentModule.title}</h1>
          <p className="text-slate-500 mt-1">{currentModule.description}</p>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(currentModule.completed / currentModule.lessons) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-white text-sm font-medium">
              {currentModule.completed}/{currentModule.lessons}
            </span>
          </div>
        </header>

        <main className="px-4 py-6 space-y-3">
          {currentModule.chapters.map((chapter) => (
            <ChapterItem 
              key={chapter.id} 
              chapter={chapter} 
              onComplete={handleLessonComplete}
            />
          ))}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
          <div className="flex justify-around">
            <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
              <Clock className="w-6 h-6" />
              <span className="text-xs">Log</span>
            </Link>
            <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-brand-blue-400">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Learn</span>
            </Link>
            <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
              <Award className="w-6 h-6" />
              <span className="text-xs">Progress</span>
            </Link>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-slate-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <h1 className="text-2xl font-bold text-white mb-1">{data.course.title}</h1>
        <p className="text-blue-200 text-sm mb-1">{data.course.subtitle}</p>
        <p className="text-brand-blue-300 text-xs">Powered by {data.course.partner}</p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-200 text-sm">Overall Progress</span>
            <span className="text-white font-bold">{data.progress.percentComplete}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${data.progress.percentComplete}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-blue-200 text-sm">
              {data.progress.completedLessons} of {data.progress.totalLessons} lessons
            </p>
            <p className="text-blue-200 text-sm">
              {data.apprenticeHours} hours logged
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl pl-10 pr-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
      </div>

      <main className="px-4 pb-6 space-y-3">
        {filteredModules.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            apprenticeHours={data.apprenticeHours}
            onSelect={() => !module.locked && setSelectedModule(module)}
          />
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <Award className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
