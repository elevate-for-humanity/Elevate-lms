"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Circle, Clock } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  progress: number;
  lessons: number;
  completedLessons: number;
}

interface ProgressTrackerProps {
  modules: Module[];
  overallProgress: number;
}

export function ProgressTracker({ modules, overallProgress }: ProgressTrackerProps) {
  const getStatusIcon = (status: Module['status']) => {
    if (status === 'completed') return <span className="text-slate-400 flex-shrink-0">•</span>;
    if (status === 'in-progress') return <Clock className="text-orange-600" size={24} />;
    return <Circle className="text-gray-400" size={24} />;
  };

  return (
    <div className="space-y-6">
      <Card className="  ">
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Overall Progress</span>
              <span className="text-2xl font-bold text-brand-orange-600">{overallProgress}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full    transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div key={module.id} className="relative">
                {index < modules.length - 1 && (
                  <div className="absolute left-3 top-12 bottom-0 w-0.5 bg-gray-200" />
                )}
                <div className="flex gap-4">
                  <div className="relative z-10 bg-white">
                    {getStatusIcon(module.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{module.title}</div>
                    <div className="text-sm text-black mb-2">
                      {module.completedLessons} of {module.lessons} lessons completed
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange-600 transition-all"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
