import { redirect } from 'next/navigation';

// Staff management is handled under /admin/users with role filter
export default function AdminStaffPage() {
  redirect('/admin/users?role=staff');
}
