'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, TrendingUp, ChevronRight, Star, Sparkles } from 'lucide-react';
import { type JobMatch } from '@/lib/hub/job-matching';

interface Props {
  userId: string;
}

export function JobMatchSection({ userId }: Props) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch(`/api/learner/job-matches?userId=${userId}`);
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (error) {
        console.error('Failed to load job matches', error);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="h-6 bg-slate-100 rounded w-1/3 animate-pulse" />
        <div className="h-24 bg-slate-50 rounded animate-pulse" />
        <div className="h-24 bg-slate-50 rounded animate-pulse" />
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b bg-brand-blue-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-blue-600" />
          <h2 className="font-bold text-slate-900">Recommended Job Matches</h2>
        </div>
        <Link href="/careers/jobs" className="text-xs font-semibold text-brand-blue-600 hover:underline">
          View All Jobs
        </Link>
      </div>
      
      <div className="divide-y divide-slate-100">
        {matches.map((match) => (
          <div key={match.job.id} className="p-5 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900">{match.job.title}</h3>
                  <span className="px-2 py-0.5 bg-brand-green-100 text-brand-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {match.match_score}% Match
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600">{match.job.employer_name}</p>
              </div>
              {match.job.employer_logo && (
                <img src={match.job.employer_logo} alt={match.job.employer_name} className="w-10 h-10 rounded-lg object-contain border" />
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {match.job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {match.job.job_type.replace('_', ' ')}
              </span>
              {match.job.salary_range && (
                <span className="font-semibold text-slate-700">{match.job.salary_range}</span>
              )}
            </div>
            
            <div className="space-y-1 mb-4">
              {match.match_reasons.map((reason, idx) => (
                <p key={idx} className="text-[11px] text-brand-blue-700 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-brand-blue-600" />
                  {reason}
                </p>
              ))}
            </div>
            
            <Link 
              href={`/careers/jobs/${match.job.id}`}
              className="w-full py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-bold hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
            >
              Apply Now
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
