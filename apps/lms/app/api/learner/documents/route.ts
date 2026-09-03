import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ALLOWED = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api'); if (limited) return limited;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const form = await req.formData();
  const requirementId = String(form.get('requirement_id') || '');
  const file = form.get('file');
  if (!requirementId || !(file instanceof File)) return NextResponse.json({ error: 'Requirement and file are required' }, { status: 400 });
  if (!ALLOWED.has(file.type) || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Use a PDF, JPG, PNG, or WebP file up to 10 MB' }, { status: 400 });
  const { data: requirement } = await supabase.from('enrollment_requirements').select('id,enrollment_id').eq('id', requirementId).maybeSingle();
  if (!requirement) return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
  const { data: ownedEnrollment } = await supabase.from('program_enrollments').select('id').eq('id', requirement.enrollment_id).or(`user_id.eq.${user.id},student_id.eq.${user.id}`).maybeSingle();
  if (!ownedEnrollment) return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Document service unavailable' }, { status: 503 });
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${user.id}/${requirementId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from('documents').upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  const { error: updateError } = await admin.from('enrollment_requirements').update({ evidence_url: path, status: 'completed', updated_at: new Date().toISOString() }).eq('id', requirementId).eq('enrollment_id', requirement.enrollment_id);
  if (updateError) { await admin.storage.from('documents').remove([path]); return NextResponse.json({ error: 'Document record could not be saved' }, { status: 500 }); }
  return NextResponse.json({ success: true });
}
