import { createClient } from '@/lib/supabase/server';

export async function getEmailTemplate(key: string, tenantId?: string | null) {
  const supabase = await createClient();

  // Try tenant-specific first
  if (tenantId) {
    const { data: tenantTemplate } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('key', key)
      .maybeSingle();

    if (tenantTemplate) return tenantTemplate;
  }

  // Fallback to global template
  const { data: globalTemplate } = await supabase
    .from('email_templates')
    .select('*')
    .is('tenant_id', null)
    .eq('key', key)
    .maybeSingle();

  return globalTemplate;
}

export function renderTemplate(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    const token = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    out = out.replace(token, v);
  }
  return out;
}

export function renderSubject(subject: string, vars: Record<string, string>): string {
  return renderTemplate(subject, vars);
}
