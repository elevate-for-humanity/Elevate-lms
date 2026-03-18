import { ProgramProgressCard } from './ProgramProgressCard';

interface Enrollment {
  id: string;
  status: string;
  progress_percent?: number | null;
  program_id?: string;
  programs?: { id: string; title: string; slug: string; code?: string } | null;
}

interface EnrolledProgramsListProps {
  enrollments: Enrollment[];
}

export function EnrolledProgramsList({ enrollments }: EnrolledProgramsListProps) {
  if (!enrollments.length) return null;

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-black mb-4">My Programs</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {enrollments.map((pe) => {
          const prog = pe.programs;
          return (
            <ProgramProgressCard
              key={pe.id}
              enrollmentId={pe.id}
              programId={prog?.id ?? pe.program_id ?? ''}
              programTitle={prog?.title ?? 'Program'}
              programSlug={prog?.slug ?? ''}
              programCode={prog?.code}
              progressPercent={pe.progress_percent ?? 0}
              status={pe.status}
            />
          );
        })}
      </div>
    </div>
  );
}
