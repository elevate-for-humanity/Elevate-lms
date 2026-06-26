// Alias for /admin/studio - dev-studio is used in navigation
import { redirect } from 'next/navigation';
export default function DevStudioPage() {
  redirect('/admin/studio');
}
