import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { parsePortalReadCommand } from './portal-read-command';

/** Page selects a capability; the canonical guard, never the page or supplied role, grants access. */
export async function executePortalReadCommand(text: string, page: string): Promise<string | null> {
  const command = parsePortalReadCommand(text);
  if (!command) return null;
  if (page === '/program-holder' || page.startsWith('/program-holder/')) {
    const ctx = await requireProgramHolder();
    if (ctx.mode === 'admin')
      return 'Select a Program Holder preview to query that organization’s assigned records.';
    let programIds = ctx.programIds;
    if (/\bcdl\b/i.test(text) && programIds.length) {
      const { data, error } = await ctx.db
        .from('programs')
        .select('id,title,slug')
        .in('id', programIds);
      if (error) throw error;
      programIds = (data || [])
        .filter((p: { id: string; title: string | null; slug: string | null }) =>
          /\bcdl\b/i.test(`${p.title || ''} ${p.slug || ''}`),
        )
        .map((p: { id: string }) => p.id);
    }
    if (command === 'hours') {
      const { count: total, error } = await ctx.db
        .from('hour_entries')
        .select('id', { count: 'exact', head: true })
        .eq('program_holder_id', ctx.holderId)
        .or(
          'approval_status.in.(pending,submitted),and(approval_status.is.null,status.in.(pending,submitted))',
        );
      if (error || total === null) throw error || new Error('PARIS_COUNT_UNAVAILABLE');
      return `${total} hour entries await review for your organization. [Review hours](/program-holder/hours). No hours were approved.`;
    }
    const count = async (table: string, statuses: string[]) => {
      if (!programIds.length) return 0;
      const { count: total, error } = await ctx.db
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('program_holder_id', ctx.holderId)
        .in('program_id', programIds)
        .in('status', statuses);
      if (error || total === null) throw error || new Error('PARIS_COUNT_UNAVAILABLE');
      return total;
    };
    const preview = ctx.mode === 'preview' ? 'Read-only preview: ' : '';
    if (command === 'applicants') {
      const total = await count('program_holder_students', ['applicant', 'applied', 'pending']);
      return `${preview}${total} applicants await enrollment review in your assigned ${/\bcdl\b/i.test(text) ? 'CDL ' : ''}programs. [Review applicants](/program-holder/students/pending).`;
    }
    if (command === 'students') {
      const total = await count('program_enrollments', [
        'active',
        'enrolled',
        'in_progress',
        'completed',
        'graduated',
      ]);
      return `${preview}${total} enrolled student records in your assigned programs. [Review students](/program-holder/students).`;
    }
    const [applicants, students] = await Promise.all([
      count('program_holder_students', ['applicant', 'applied', 'pending']),
      count('program_enrollments', ['active', 'enrolled', 'in_progress', 'completed', 'graduated']),
    ]);
    return `${preview}${programIds.length} assigned programs, ${applicants} applicants awaiting review, and ${students} enrolled student records. [Open your dashboard](/program-holder/dashboard).`;
  }
  if (page === '/host-shop' || page.startsWith('/host-shop/')) {
    const { user } = await requireRole(HOST_SHOP_ROLES);
    const board = await getHostShopBoard(user.id);
    if (command === 'applicants')
      return 'Use [Match requests](/host-shop/dashboard/match-requests) for incoming apprentice placement requests. These are separate from Program Holder applications.';
    if (command === 'hours')
      return `${board.pendingHoursCount} hour entries await review for your assigned shops. [Review hours](/host-shop/dashboard/hours/pending). No hours were approved.`;
    if (command === 'students')
      return `${board.apprentices.length} apprentices are assigned to your shops. [Review apprentices](/host-shop/dashboard/apprentices).`;
    return `${board.shops.length} assigned shops, ${board.apprentices.length} apprentices, and ${board.pendingHoursCount} hour entries awaiting review. ${board.acceptedDocumentCount} of ${board.requiredDocumentCount} required documents accepted. [Open your dashboard](/host-shop/dashboard).`;
  }
  return null;
}

/** Signed admin previews are valid for guidance and drafts, but remain read-only. */
export async function authenticatePartnerPortalGuidance(page: string): Promise<boolean> {
  if (page === '/program-holder' || page.startsWith('/program-holder/')) {
    await requireProgramHolder();
    return true;
  }
  if (page === '/host-shop' || page.startsWith('/host-shop/')) {
    await requireRole(HOST_SHOP_ROLES);
    return true;
  }
  return false;
}
