import Link from 'next/link';

interface ProgramProgressCardProps {
  enrollmentId: string;
  programId: string;
  programTitle: string;
  programSlug: string;
  programCode?: string;
  progressPercent: number;
  status: string;
}

export function ProgramProgressCard({
  enrollmentId,
  programId,
  programTitle,
  programSlug,
  programCode,
  progressPercent,
  status,
}: ProgramProgressCardProps) {
  const href = `/lms/program/${programSlug || programCode || programId}`;
  const isActive = status === 'active' || status === 'confirmed';
  const isComplete = status === 'completed';

  return (
    <Link
      href={href}
      className="bg-white rounded-xl border hover:border-brand-blue-300 hover:shadow-md transition p-6 group block"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition">
          {programTitle}
        </h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isActive   ? 'bg-brand-green-100 text-brand-green-700' :
          isComplete ? 'bg-brand-blue-100 text-brand-blue-700' :
                       'bg-amber-100 text-amber-700'
        }`}>
          {isActive ? 'Active' : isComplete ? 'Completed' : 'Pending'}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all ${
            progressPercent === 100 ? 'bg-brand-green-500' : 'bg-brand-blue-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{progressPercent}% complete</p>
    </Link>
  );
}
