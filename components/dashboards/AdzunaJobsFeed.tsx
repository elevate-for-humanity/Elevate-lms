'use client';

import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Building2, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

interface AdzunaJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  applyUrl: string;
  postedDate: string;
  category?: string;
}

interface AdzunaJobsFeedProps {
  jobTitle?: string;
  location?: string;
  limit?: number;
  showAttribution?: boolean;
}

export default function AdzunaJobsFeed({ 
  jobTitle = 'Medical Assistant',
  location = 'Indianapolis',
  limit = 10,
  showAttribution = true
}: AdzunaJobsFeedProps) {
  const [jobs, setJobs] = useState<AdzunaJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchJobs() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/jobs/search?what=${encodeURIComponent(jobTitle)}&where=${encodeURIComponent(location)}&results_per_page=${limit}`
      );
      
      if (!res.ok) throw new Error('Failed to fetch jobs');
      
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch (err) {
      setError('Unable to load job listings');
      console.error('[AdzunaJobsFeed] Error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [jobTitle, location, limit]);

  const formatSalary = (job: AdzunaJob) => {
    if (job.salaryMin && job.salaryMax) {
      return `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`;
    }
    if (job.salaryMin) {
      return `From $${(job.salaryMin / 1000).toFixed(0)}k`;
    }
    return 'Salary not listed';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">{error}</p>
        <button
          onClick={fetchJobs}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl">
        <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No jobs found for "{jobTitle}" in {location}</p>
        <p className="text-sm text-slate-400 mt-2">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <a
          key={job.id}
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:shadow-md transition group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-blue-600">
                  {job.title}
                </h3>
                {job.category && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                    {job.category}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              </div>

              <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                {job.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                  {formatSalary(job)}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDate(job.postedDate)}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-blue-600 text-white text-sm font-medium rounded-lg group-hover:bg-brand-blue-700">
                Apply
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </a>
      ))}

      {showAttribution && (
        <p className="text-xs text-center text-slate-400 pt-4">
          Jobs sourced by{' '}
          <a 
            href="https://adzuna.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-brand-blue-600"
          >
            Adzuna
          </a>
          {' '}•{' '}
          <a 
            href="https://www.careeronestop.org" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-brand-blue-600"
          >
            CareerOneStop
          </a>
        </p>
      )}
    </div>
  );
}
