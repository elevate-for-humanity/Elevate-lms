'use client';

import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, TrendingUp, MapPin, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  applyUrl: string;
  postedDate: string;
}

interface SalaryData {
  meanSalary?: number;
  minSalary?: number;
  maxSalary?: number;
}

interface CareerIntelligenceProps {
  jobTitle?: string;
  socCode?: string;
  location?: string;
  embedded?: boolean;
}

export default function CareerIntelligencePanel({ 
  jobTitle = 'Medical Assistant', 
  location = 'Indianapolis',
  embedded = false 
}: CareerIntelligenceProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [salary, setSalary] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function fetchCareerData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch jobs and salary in parallel
      const [jobsRes, salaryRes] = await Promise.all([
        fetch(`/api/jobs/search?what=${encodeURIComponent(jobTitle)}&where=${encodeURIComponent(location)}&results_per_page=5`),
        fetch(`/api/jobs/salary?title=${encodeURIComponent(jobTitle)}&where=${encodeURIComponent(location)}`)
      ]);

      const jobsData = await jobsRes.json();
      const salaryData = salaryRes.ok ? await salaryRes.json() : null;

      setJobs(jobsData.jobs ?? []);
      setSalary(salaryData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Failed to load career data');
      console.error('[CareerIntelligence] Error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCareerData();
  }, [jobTitle, location]);

  const formatSalary = (salaryData: SalaryData | null) => {
    if (!salaryData) return 'Data not available';
    if (salaryData.meanSalary) {
      return `$${(salaryData.meanSalary / 1000).toFixed(0)}k avg`;
    }
    if (salaryData.minSalary && salaryData.maxSalary) {
      return `$${(salaryData.minSalary / 1000).toFixed(0)}k - $${(salaryData.maxSalary / 1000).toFixed(0)}k`;
    }
    return 'Data not available';
  };

  const header = !embedded ? (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-8 rounded-t-xl">
      <div className="flex items-center gap-3 mb-2">
        <Briefcase className="h-8 w-8" />
        <h2 className="text-2xl font-bold">Career Intelligence</h2>
      </div>
      <p className="text-emerald-100">
        Real-time job market data for {jobTitle} in {location}
      </p>
    </div>
  ) : (
    <div className="px-4 py-3 border-b border-[#3c3c3c] bg-[#2d2d2d]">
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-white">Career Intelligence</span>
      </div>
    </div>
  );

  return (
    <div className={`rounded-xl border overflow-hidden ${embedded ? 'bg-[#1e1e1e] border-[#3c3c3c]' : 'bg-white border-slate-200 shadow-sm'}`}>
      {header}

      <div className={`${embedded ? 'p-4' : 'p-6'}`}>
        {/* Config Input */}
        <div className={`grid gap-3 mb-6 ${embedded ? '' : 'grid-cols-2'}`}>
          <div>
            <label className={`block text-xs font-medium mb-1 ${embedded ? 'text-slate-400' : 'text-slate-500'}`}>
              Job Title
            </label>
            <input
              type="text"
              defaultValue={jobTitle}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                embedded 
                  ? 'bg-[#2d2d2d] border border-[#3c3c3c] text-white' 
                  : 'border border-slate-200 text-slate-900'
              }`}
              placeholder="e.g., Medical Assistant"
              onBlur={(e) => {
                if (e.target.value !== jobTitle) {
                  // Would trigger re-fetch in parent component
                }
              }}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${embedded ? 'text-slate-400' : 'text-slate-500'}`}>
              Location
            </label>
            <input
              type="text"
              defaultValue={location}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                embedded 
                  ? 'bg-[#2d2d2d] border border-[#3c3c3c] text-white' 
                  : 'border border-slate-200 text-slate-900'
              }`}
              placeholder="e.g., Indianapolis"
            />
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center justify-between mb-4">
          <p className={`text-xs ${embedded ? 'text-slate-500' : 'text-slate-400'}`}>
            {lastUpdated ? `Updated ${lastUpdated}` : 'Loading...'}
          </p>
          <button
            onClick={fetchCareerData}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              embedded 
                ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 ${
            embedded ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Salary Card */}
        <div className={`rounded-xl p-5 mb-4 ${
          embedded ? 'bg-[#2d2d2d]' : 'bg-gradient-to-br from-emerald-50 to-teal-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`h-4 w-4 ${embedded ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-xs font-medium ${embedded ? 'text-slate-400' : 'text-emerald-600'}`}>
              Salary Range
            </span>
          </div>
          <p className={`text-2xl font-bold ${embedded ? 'text-white' : 'text-emerald-900'}`}>
            {loading ? '...' : formatSalary(salary)}
          </p>
        </div>

        {/* Job Listings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${embedded ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-xs font-medium ${embedded ? 'text-slate-400' : 'text-slate-500'}`}>
              Current Openings ({jobs.length})
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-16 rounded-lg animate-pulse ${embedded ? 'bg-[#2d2d2d]' : 'bg-slate-100'}`} />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            jobs.slice(0, 5).map((job) => (
              <a
                key={job.id}
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-4 rounded-xl border transition hover:scale-[1.01] ${
                  embedded 
                    ? 'bg-[#2d2d2d] border-[#3c3c3c] hover:border-emerald-600' 
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${embedded ? 'text-white' : 'text-slate-900'}`}>
                      {job.title}
                    </p>
                    <p className={`text-sm truncate ${embedded ? 'text-slate-400' : 'text-slate-500'}`}>
                      {job.company}
                    </p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${embedded ? 'text-slate-500' : 'text-slate-400'}`}>
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </div>
                  </div>
                  <ExternalLink className={`h-4 w-4 flex-shrink-0 ${embedded ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </a>
            ))
          ) : (
            <p className={`text-center py-8 ${embedded ? 'text-slate-500' : 'text-slate-400'}`}>
              No jobs found. Try a different search.
            </p>
          )}
        </div>

        {/* Attribution */}
        <p className={`mt-6 text-xs text-center ${embedded ? 'text-slate-600' : 'text-slate-400'}`}>
          Jobs sourced by{' '}
          <a href="https://adzuna.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">
            Adzuna
          </a>
          {' '}•{' '}
          <a href="https://www.careeronestop.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">
            CareerOneStop
          </a>
        </p>
      </div>
    </div>
  );
}
