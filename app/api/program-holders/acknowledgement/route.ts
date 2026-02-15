import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { orgName, contactName, title, email, phone, agreed } = body || {};

    if (!orgName || !contactName || !email || !agreed) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('program_holder_acknowledgements')
      .insert({
        organization_name: orgName,
        contact_name: contactName,
        title,
        email,
        phone,
        agreed: true,
      });

    if (error) {
      logger.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Unable to save acknowledgement.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error(
      'API error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
