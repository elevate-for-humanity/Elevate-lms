import ProgramCard from '@/components/programs/ProgramCard';
import type { Program } from '@/lib/programs/programs.data';

/**
 * ProgramGrid — locked program card grid.
 *
 * 1 → 2 → 3 columns. Uses ProgramCard exclusively.
 * Do not build custom card grids on individual pages.
 */
interface ProgramGridProps {
  programs: Program[];
  cols?: 2 | 3 | 4;
}

const GRID: Record<number, string> = {
  2: 'grid grid-cols-1 sm:grid-cols-2 gap-5',
  3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
  4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5',
};

export default function ProgramGrid({ programs, cols = 3 }: ProgramGridProps) {
  return (
    <div className={GRID[cols]}>
      {programs.map((p) => (
        <ProgramCard key={p.slug} program={p} />
      ))}
    </div>
  );
}
