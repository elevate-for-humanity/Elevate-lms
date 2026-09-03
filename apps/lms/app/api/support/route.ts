import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/service';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function _POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : 'general';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
  }
  if (subject.length > 200 || message.length > 5000 || category.length > 50) {
    return NextResponse.json({ error: 'Support request is too long' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  const fromEmail = profile?.email || user.email || 'unknown';
  const fromName = profile?.full_name || 'Learner';
  const sent = await sendEmail({
    to: PLATFORM_DEFAULTS.supportEmail,
    subject: `[LMS Support/${category}] ${subject}`,
    html: `<h2>LMS support request</h2><p><strong>From:</strong> ${escapeHtml(fromName)} (${escapeHtml(fromEmail)})</p><p><strong>User ID:</strong> ${escapeHtml(user.id)}</p><p><strong>Role:</strong> ${escapeHtml(profile?.role || 'unknown')}</p><p><strong>Category:</strong> ${escapeHtml(category)}</p><hr/><p>${escapeHtml(message).replaceAll('\n', '<br/>')}</p>`,
    text: `LMS support request\nFrom: ${fromName} (${fromEmail})\nUser ID: ${user.id}\nRole: ${profile?.role || 'unknown'}\nCategory: ${category}\n\n${message}`,
  });

  if (!sent) return NextResponse.json({ error: 'Support message could not be delivered' }, { status: 502 });
  return NextResponse.json({ success: true });
}

export const POST = withApiAudit('/api/support', _POST);
