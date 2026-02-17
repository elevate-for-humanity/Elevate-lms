"use client";

import Link from "next/link";
import { BookOpen, Clock, TrendingUp } from "lucide-react";

interface LearningPathCardProps {
  id: string;
  name: string;
  description: string;
  pathType: string;
  estimatedWeeks: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  programCount: number;
  enrolled?: boolean;
  progress?: number;
}

export function LearningPathCard({
  id,
  name,
  description,
  pathType,
  estimatedWeeks,
  difficulty,
  programCount,
  enrolled = false,
  progress = 0,
}: LearningPathCardProps) {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case "beginner":
        return "text-brand-green-400 bg-brand-green-500/20";
      case "intermediate":
        return "text-yellow-400 bg-yellow-500/20";
      case "advanced":
        return "text-brand-red-400 bg-brand-orange-500/20";
    }
  };

  return (
    <Link
      href={`/learning-paths/${id}`}
      className="block bg-slate-800 hover:bg-slate-750 rounded-lg p-6 transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{description}</p>
        </div>
        {enrolled && (
          <div className="ml-4">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-3 py-2 rounded-full text-xs font-semibold ${getDifficultyColor()}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
        <span className="px-3 py-2 rounded-full text-xs font-semibold text-brand-blue-400 bg-brand-blue-500/20">
          {pathType.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
        <span className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          {programCount} programs
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {estimatedWeeks} weeks
        </span>
      </div>

      {enrolled && progress > 0 && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Progress</span>
            <span className="text-white font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-brand-orange-500 rounded-full h-2 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!enrolled && (
        <button className="w-full mt-2 px-4 py-2 bg-brand-orange-500 text-white rounded-lg font-semibold hover:bg-brand-orange-600 transition-colors flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Start Learning Path
        </button>
      )}
    </Link>
  );
}
