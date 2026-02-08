export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, metadata, slug, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (metadata) updateData.metadata = metadata;
    if (slug) updateData.slug = slug;
    if (title) updateData.title = title;

    const { data, error }: any = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Supabase error:', error);
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, course: data });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Save course error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Failed to save course', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
