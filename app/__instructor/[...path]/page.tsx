import { redirect } from 'next/navigation';

export default function LegacyCatchAllPage() {
  redirect('/admin/instructor');
}
