import Link from 'next/link';
import { MapPin, Clock, DollarSign, Wifi, ArrowRight } from 'lucide-react';
import type { JobPosting } from '@/lib/data/jobs';
import { formatSalary, jobTypeBadge, jobTypeLabel } from '@/lib/data/jobs';

interface JobCardProps {
  job: JobPosting;
  href?: string;
  /** Show apply button instead of view details */
  showApply?: boolean;
}

export default function JobCard({ job, href, showApply = false }: JobCardProps) {
  const dest = href ?? `/careers/jobs/${job.id}`;
  const isExpired = job.application_deadline
    ? new Date(job.application_deadline) < new Date()
    : false;

  return (
    <div className={`group bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${
      isExpired ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:border-brand-blue-200 hover:shadow-md hover:-translate-y-0.5'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <Link href={dest} className="font-bold text-slate-900 text-base leading-snug hover:text-brand-blue-700 transition-colors line-clamp-2">
              {job.title}
            </Link>
            <p className="text-sm text-slate-500 mt-0.5">Elevate Employer Partner</p>
          </div>
          <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${jobTypeBadge(job.job_type ?? job.employment_type)}`}>
            {jobTypeLabel(job.job_type ?? job.employment_type)}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
          {(job.location || !job.remote_allowed) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.location ?? 'Indianapolis, IN'}
            </span>
          )}
          {job.remote_allowed && (
            <span className="flex items-center gap-1 text-teal-600">
              <Wifi className="w-3.5 h-3.5" /> Remote OK
            </span>
          )}
          {(job.salary_range || job.salary_min) && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> {formatSalary(job)}
            </span>
          )}
          {job.experience_level && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {job.experience_level}
            </span>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{job.description}</p>
        )}

        {/* Skills */}
        {job.skills_required && job.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills_required.slice(0, 4).map(s => (
              <span key={s} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{s}</span>
            ))}
            {job.skills_required.length > 4 && (
              <span className="text-[11px] text-slate-400">+{job.skills_required.length - 4} more</span>
            )}
          </div>
        )}

        {/* Deadline */}
        {job.application_deadline && (
          <p className={`text-xs mb-3 ${isExpired ? 'text-brand-red-500' : 'text-slate-400'}`}>
            {isExpired ? 'Applications closed' : `Apply by ${new Date(job.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </p>
        )}

        {/* CTA */}
        <div className="flex gap-2">
          {showApply && !isExpired ? (
            <Link href={dest} className="flex-1 text-center bg-brand-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-blue-700 transition-colors">
              Apply Now
            </Link>
          ) : (
            <Link href={dest} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 hover:gap-2.5 transition-all">
              View details <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
