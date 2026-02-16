"use client";

import { Award, Lock } from 'lucide-react';

interface MobileAchievementCardProps {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  total?: number;
}

export default function MobileAchievementCard({
  id,
  title,
  description,
  icon,
  unlocked,
  unlockedAt,
  progress = 0,
  total = 100,
}: MobileAchievementCardProps) {
  const progressPercent = (progress / total) * 100;

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all ${
        unlocked
          ? '   border-yellow-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            unlocked
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
              : 'bg-gray-300'
          }`}
        >
          {unlocked ? (
            icon ? (
              <span className="text-2xl">{icon}</span>
            ) : (
              <Award size={24} className="text-white" />
            )
          ) : (
            <Lock size={20} className="text-gray-500" />
          )}
        </div>
        <div className="flex-1">
          <h3
            className={`font-semibold text-sm mb-1 ${
              unlocked ? 'text-black' : 'text-gray-500'
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-xs ${
              unlocked ? 'text-black' : 'text-gray-400'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      {/* Progress or Unlock Date */}
      {unlocked ? (
        unlockedAt && (
          <div className="text-xs text-gray-500">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </div>
        )
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-black mb-1">
            <span>Progress</span>
            <span className="font-semibold">
              {progress}/{total}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full    transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      {/* Unlocked Badge */}
      {unlocked && (
        <div className="absolute top-2 right-2 px-2 py-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
          • Unlocked
        </div>
      )}
    </div>
  );
}
