// Server component — canonical feed from job_postings (see lib/data/jobs.ts)
import LiveJobPostings from '@/components/careers/LiveJobPostings';

interface JobFeedProps {
  limit?: number;
  heading?: string;
  employer_id?: string;
}

export default function JobFeed({ limit = 6, heading = 'Open Positions' }: JobFeedProps) {
  return <LiveJobPostings heading={heading} limit={limit} className="bg-slate-50" />;
}
