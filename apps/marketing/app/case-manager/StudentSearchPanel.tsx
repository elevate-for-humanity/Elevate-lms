import { StudentSearchPanel as SharedStudentSearchPanel } from '@/components/workforce/StudentSearchPanel';

interface StudentSearchPanelProps {
  defaultValue?: string;
}

export function StudentSearchPanel({ defaultValue = '' }: StudentSearchPanelProps = {}) {
  return (
    <SharedStudentSearchPanel
      action="/case-manager/participants"
      defaultValue={defaultValue}
      label="Search assigned participants"
    />
  );
}
