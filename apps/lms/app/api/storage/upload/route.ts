/**
 * Storage Upload API - LMS
 * Handles file uploads with auth check
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const bucket = formData.get('bucket') as string ?? 'uploads';
  const folder = formData.get('folder') as string ?? '';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return NextResponse.json({ 
    url: publicUrl, 
    path: data.path,
    service: 'lms'
  });
}
