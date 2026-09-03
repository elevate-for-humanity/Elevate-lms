import type { ProgramEnrollmentConfig } from '@/lms-data/enrollment';

interface Props {
  config: ProgramEnrollmentConfig;
}

function labelForFlag(flag: string): string {
  switch (flag) {
    case 'jri':
      return 'Job Ready Indy (JRI)';
    case 'wrg':
      return 'Workforce Ready Grant (WRG)';
    case 'wex':
      return 'Work Experience (WEX)';
    case 'ojt':
      return 'On-the-Job Training (OJT)';
    case 'apprenticeship':
      return 'Apprenticeship';
    case 'state-grant':
      return 'State Grant Eligible';
    case 'federal-grant':
      return 'Federal / Partner Funding';
    case 'employer-pay':
      return 'Employer Sponsorship';
    case 'self-pay':
      return 'Self-Pay / Payment Plan';
    default:
      return flag;
  }
}

export function EligibilityBadges({ config }: Props) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {config.fundingFlags.map((flag) => (
        <span
          key={flag}
          className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-100 border border-slate-700"
        >
          {labelForFlag(flag)}
        </span>
      ))}
    </div>
  );
}
