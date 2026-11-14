import 'server-only';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import { buildHostStudentCertificates, type CertificateApplication, type CertificateEnrollment } from './host-shop-student-records';

export async function getHostShopStudentCertificates(userId: string) {
  // Board resolution proves active partner membership and ownership of each shop.
  const board = await getHostShopBoard(userId);
  if (board.unavailableData?.includes('apprentice placements')) throw new Error('Student placements are temporarily unavailable.');
  const shopIds = board.shops.map(shop => shop.id);
  if (!shopIds.length) return { board, certificates: [] };
  const db = await requireAdminClient();
  const applications: CertificateApplication[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('applications')
      .select('id,assigned_shop_id,user_id,full_name,first_name,last_name,email,program_slug,program_interest,status,submitted_at,created_at')
      .in('assigned_shop_id', shopIds).order('id').range(offset, offset + 499);
    if (error) throw new Error('Student applications are temporarily unavailable.');
    applications.push(...(data || []));
    if ((data || []).length < 500) break;
  }
  const studentIds = [...new Set(board.apprentices.map(student => student.student_id))];
  const enrollments: CertificateEnrollment[] = [];
  for (let start = 0; start < studentIds.length; start += 100) {
    const ids = studentIds.slice(start, start + 100).join(',');
    const { data, error } = await db.from('program_enrollments')
      .select('user_id,student_id,program_slug,status,enrolled_at,enrollment_confirmed_at,revoked_at')
      .or(`user_id.in.(${ids}),student_id.in.(${ids})`);
    if (error) throw new Error('Student enrollment status is temporarily unavailable.');
    enrollments.push(...(data || []));
  }
  return { board, certificates: buildHostStudentCertificates(board.shops, board.apprentices, applications, enrollments) };
}
