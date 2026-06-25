import requireRole from '@/lib/auth/require-role';

export default async function Page() {
  await requireRole('employer');
  return <div>Weekly Report</div>;
}
