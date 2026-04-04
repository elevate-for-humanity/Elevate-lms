import AdminClientPage from '@/components/admin/AdminClientPage';
import CourseGeneratorClient from './CourseGeneratorClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <AdminClientPage>
      <CourseGeneratorClient />
    </AdminClientPage>
  );
}
