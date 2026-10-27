import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import 'server-only';

/** Explicit administrator-maintained school bindings; never infer ownership from contact email at runtime. */
export async function loadApprovedSchoolApplicants(
  db: any, features: any, programs: Array<{ slug?: string }>, includeContact: boolean,
) {
  const ids = Array.isArray(features?.school_partner_ids)
    ? features.school_partner_ids.filter((id: unknown): id is string => typeof id === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) : [];
  const slugs = programs.map(program => program.slug).filter((slug): slug is string => Boolean(slug));
  if (!ids.length || !slugs.length) return [];
  const data = await readHoursPages<any>((from, to) => db.from('school_applications')
    .select(`id,partner_id,first_name,last_name,program_interest,status,created_at${includeContact ? ',email,phone' : ''}`)
    .in('partner_id', ids).in('program_interest', slugs).in('status', ['accepted', 'enrolled'])
    .order('created_at', { ascending: false }).order('id').range(from, to));
  return (data || []).map((row: any) => ({ ...row,
    full_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'School applicant',
    roster_source: 'school_application',
  }));
}
