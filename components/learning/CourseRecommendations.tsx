"use client";

import Link from "next/link";
import { Sparkles, TrendingUp, Users, Target } from "lucide-react";

interface Recommendation {
  program_id: string;
  program_name: string;
  program_slug: string;
  recommendation_type: string;
  score: number;
  reason: string;
}

interface CourseRecommendationsProps {
  recommendations: Recommendation[];
}

export function CourseRecommendations({ recommendations }: CourseRecommendationsProps) {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "based_on_progress":
        return <Target className="w-5 h-5 text-brand-blue-400" />;
      case "similar_students":
        return <Users className="w-5 h-5 text-green-400" />;
      case "trending":
        return <TrendingUp className="w-5 h-5 text-orange-400" />;
      case "personalized":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-400" />;
    }
  };

  const getRecommendationLabel = (type: string) => {
    switch (type) {
      case "based_on_progress":
        return "Next Step";
      case "similar_students":
        return "Popular Choice";
      case "trending":
        return "Trending Now";
      case "personalized":
        return "For You";
      default:
        return "Recommended";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-orange-400" />
        Recommended For You
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Link
            key={rec.program_id}
            href={`/programs/${rec.program_slug}`}
            className="bg-slate-800 hover:bg-slate-750 rounded-lg p-6 transition-all hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getRecommendationIcon(rec.recommendation_type)}
                <span className="text-xs font-semibold text-slate-400">
                  {getRecommendationLabel(rec.recommendation_type)}
                </span>
              </div>
              <div className="px-2 py-2 bg-orange-500/20 rounded text-xs font-bold text-orange-400">
                {Math.round(rec.score * 100)}% match
              </div>
            </div>

            <h4 className="text-lg font-bold text-white mb-2">{rec.program_name}</h4>
            <p className="text-sm text-slate-400">{rec.reason}</p>

            <button className="mt-4 w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
              View Program
            </button>
          </Link>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <Sparkles className="w-12 h-12 text-black mx-auto mb-4" />
          <p className="text-slate-400">
            Complete more courses to get personalized recommendations
          </p>
        </div>
      )}
    </div>
  );
}
