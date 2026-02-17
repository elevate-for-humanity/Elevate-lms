'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Recommendation {
  courseId: string;
  score: number;
  reason: string;
  course?: {
    title: string;
    category: string;
  };
}

export function RecommendedCourses() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lms/recommendations')
      .then((r) => r.json())
      .then((data) => {
        setRecommendations(data.recommendations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-brand-blue-600" />
          <h3 className="font-semibold text-gray-900">Recommended for You</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-brand-blue-600" />
        <h3 className="font-semibold text-gray-900">Recommended for You</h3>
      </div>
      <div className="space-y-3">
        {recommendations.slice(0, 4).map((rec) => (
          <Link
            key={rec.courseId}
            href={`/lms/courses/${rec.courseId}`}
            className="block p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {rec.course?.title || rec.courseId}
                </p>
                <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
              </div>
              <span className="text-xs bg-brand-blue-50 text-brand-blue-700 px-2 py-1 rounded-full font-medium">
                {Math.round(rec.score * 100)}% match
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
