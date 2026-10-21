import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { CredentialReviews } from './CredentialReviews';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Credential Document Review', robots: { index: false, follow: false } };
export default async function Page() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const uploads: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('student_credential_uploads').select('id,user_id,program_id,upload_type,original_filename,verification_status,verified_at,rejection_reason,credential_earned_date,created_at').order('id').range(offset, offset + 499);
    if (error) throw new Error('Credential review queue could not load.');
    uploads.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  const profiles: any[] = [];
  const ids = [...new Set(uploads.map(row => row.user_id))];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await db.from('profiles').select('id,full_name').in('id', ids.slice(offset, offset + 100));
    if (error) throw new Error('Credential student names could not load.');
    profiles.push(...(data ?? []));
  }
  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-6"><Link href="/funding/reconciliation" className="font-bold text-blue-700">← Student reconciliation</Link><h1 className="text-3xl font-black">Credential document review</h1><p>Review the protected document before making a decision. Approval records verified evidence; it does not issue a new certificate or mark training complete.</p><CredentialReviews rows={uploads.map(row => ({ ...row, name: profiles.find(p => p.id === row.user_id)?.full_name || 'Student account needs review' }))} /></main>;
}
