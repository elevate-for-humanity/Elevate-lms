'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, MapPin, DollarSign, Building2, Loader2, AlertCircle } from 'lucide-react';

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
}

interface AdzunaJobsSectionProps {
  programJobTitle?: string;
  limit?: number;
}

export default function AdzunaJobsSection({ 
  programJobTitle = 'Medical Assistant',
  limit = 5 
}: AdzunaJobsSectionProps) {
  const [jobs, setJobs] = useState<AdzunaJob[]>([]);
  const [salary, setSalary] = useState<{ mean?: number; min?: number; max?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch jobs
        const jobsRes = await fetch(
          `/api/jobs/search?what=${encodeURIComponent(programJobTitle)}&where=Indianapolis&results_per_page=${limit}`
        );
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs ?? []);

        // Fetch salary insights
        const salaryRes = await fetch(
          `/api/jobs/salary?title=${encodeURIComponent(programJobTitle)}&where=Indianapolis`
        );
        if (salaryRes.ok) {
          const salaryData = await salaryRes.json();
          setSalary(salaryData);
        }
      } catch (err) {
        setError('Unable to load job market data');
        console.error('[AdzunaJobsSection] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [programJobTitle, limit]);

  const formatSalary = () => {
    if (!salary) return 'Data not available';
    if (salary.mean) {
      return `$${(salary.mean / 1000).toFixed(0)}k average`;
    }
    if (salary.min && salary.max) {
      return `$${(salary.min / 1000).toFixed(0)}k - $${(salary.max / 1000).toFixed(0)}k`;
    }
    return 'Data not available';
  };

  if (error) {
    return null; // Silently fail - this is supplementary data
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Job Market</h3>
            <p className="text-xs text-slate-500">Real-time {programJobTitle} opportunities</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Job Market</h3>
          <p className="text-xs text-slate-500">Real-time {programJobTitle} opportunities</p>
        </div>
      </div>

      {/* Salary Banner */}
      <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Salary Range</p>
          <p className="text-lg font-bold text-emerald-600">{formatSalary()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Open Jobs</p>
          <p className="text-lg font-bold text-brand-blue-600">{jobs.length}+</p>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-3">
        {jobs.slice(0, 3).map((job) => (
          <a
            key={job.id}
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm group-hover:text-emerald-700 truncate">
                  {job.title}
                </p>
                <p className="text-xs text-slate-500 truncate">{job.company}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                  {job.salaryMin && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <DollarSign className="w-3 h-3" />
                      ${(job.salaryMin / 1000).toFixed(0)}k+
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0" />
            </div>
          </a>
        ))}
      </div>

      {/* Attribution */}
      <p className="mt-4 text-xs text-center text-slate-400">
        Jobs sourced by{' '}
        <a href="https://adzuna.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">
          Adzuna
        </a>
      </p>
    </div>
  );
}
