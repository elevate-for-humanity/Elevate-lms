import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, hours, minutes, category, description, photoProof, location, totalMinutes } = body;

    if (!totalMinutes || totalMinutes <= 0) {
      return NextResponse.json({ error: 'Invalid hours' }, { status: 400 });
    }

    // Get apprentice record
    const { data: apprentice, error: apprenticeError } = await db
      .from('apprentices')
      .select('id, shop_id')
      .eq('user_id', user.id)
      .single();

    if (apprenticeError || !apprentice) {
      return NextResponse.json({ error: 'Apprentice record not found' }, { status: 404 });
    }

    // Store photo if provided
    let photoUrl = null;
    if (photoProof) {
      // Extract base64 data
      const base64Data = photoProof.split(',')[1];
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `hours-proof/${apprentice.id}/${Date.now()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('apprentice-uploads')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('apprentice-uploads')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }
    }

    // Create hour entry
    const { data: entry, error: entryError } = await db
      .from('hour_entries')
      .insert({
        apprentice_id: apprentice.id,
        shop_id: apprentice.shop_id,
        date: date,
        hours: hours,
        minutes: minutes,
        total_minutes: totalMinutes,
        category: category,
        description: description || null,
        location: location || null,
        photo_proof_url: photoUrl,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (entryError) {
      logger.error('Error creating hour entry:', entryError);
      return NextResponse.json({ error: 'Failed to submit hours' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        date: entry.date,
        totalMinutes: entry.total_minutes,
        status: entry.status,
      },
    });
  } catch (error) {
    logger.error('Hours submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
