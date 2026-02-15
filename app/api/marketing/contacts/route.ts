export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { sanitizeSearchInput } from '@/lib/utils';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/marketing/contacts
export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const unsubscribed = searchParams.get('unsubscribed');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('marketing_contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`email.ilike.%${sanitizedSearch}%,full_name.ilike.%${sanitizedSearch}%`);
    }

    if (unsubscribed === 'true') {
      query = query.eq('unsubscribed', true);
    } else if (unsubscribed === 'false') {
      query = query.eq('unsubscribed', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      contacts: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    logger.error(
      'GET /marketing/contacts error',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/marketing/contacts
export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await req.json();

    const { email, full_name, phone, source, tags } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error }: any = await supabase
      .from('marketing_contacts')
      .insert({
        email,
        full_name,
        phone,
        source,
        tags: tags || [],
      })
      .select('*')
      .single();

    if (error) {
      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Contact with this email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (error: any) {
    logger.error(
      'POST /marketing/contacts error',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: error?.message || 'Failed to create contact' },
      { status: 500 }
    );
  }
}
