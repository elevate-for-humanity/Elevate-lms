"use client";

import { Circle, Lock, PlayCircle } from 'lucide-react';

interface MobileLessonCardProps {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  type: 'video' | 'quiz' | 'reading';
  onClick?: () => void;
}

export default function MobileLessonCard({
  id,
  title,
  duration,
  completed,
  locked,
  type,
  onClick,
}: MobileLessonCardProps) {
  const getIcon = () => {
    if (locked) return <Lock size={20} className="text-gray-400" />;
    if (completed) return <span className="text-slate-400 flex-shrink-0">•</span>;
    if (type === 'video')
      return <PlayCircle size={20} className="text-brand-blue-500" />;
    return <Circle size={20} className="text-gray-400" />;
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'quiz':
        return 'Quiz';
      case 'reading':
        return 'Reading';
      default:
        return '';
    }
  };

  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
        locked
          ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
          : completed
            ? 'bg-brand-green-50 border-brand-green-200 active:scale-98'
            : 'bg-white border-gray-200 active:scale-98 hover:border-brand-blue-300'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0">{getIcon()}</div>
      {/* Content */}
      <div className="flex-1 text-left">
        <h4
          className={`font-medium text-sm mb-1 ${
            locked
              ? 'text-gray-400'
              : completed
                ? 'text-black'
                : 'text-black'
          }`}
        >
          {title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{getTypeLabel()}</span>
          <span>•</span>
          <span>{duration}</span>
        </div>
      </div>
      {/* Status Badge */}
      {completed && (
        <div className="flex-shrink-0 px-2 py-2 bg-brand-green-100 text-brand-green-700 text-xs font-medium rounded-full">
          Completed
        </div>
      )}
      {locked && (
        <div className="flex-shrink-0 px-2 py-2 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
          Locked
        </div>
      )}
    </button>
  );
}
