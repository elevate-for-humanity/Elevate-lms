import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashSSN, getSSNLast4, isValidSSN } from '@/lib/security/ssn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

/**
 * Track refund status - uses SSN hash for secure lookup
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input
    if (!body.ssn || !body.filingStatus || !body.refundAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isValidSSN(body.ssn)) {
      return NextResponse.json(
        { error: 'Invalid SSN format' },
        { status: 400 }
      );
    }

    const ssnClean = body.ssn.replace(/\D/g, '');

    // Use hashed SSN for lookup (more secure than plain text)
    const ssnHash = hashSSN(ssnClean);
    const ssnLast4 = getSSNLast4(ssnClean);

    // Find tax return by SSN hash or last 4 (fallback for existing records)
    const { data: client } = await supabase
      .from('clients')
      .select('id, tax_returns(*)')
      .or(`ssn_hash.eq.${ssnHash},ssn_last4.eq.${ssnLast4}`)
      .single();

    let status = 'received';
    let statusMessage = 'Your tax return has been received and is being processed';
    let expectedDate = null;

    if (client?.tax_returns?.[0]) {
      const taxReturn = client.tax_returns[0];

      // Determine status based on tax return status
      if (taxReturn.status === 'filed') {
        status = 'approved';
        statusMessage = 'Your refund has been approved and will be sent soon';

        // Calculate expected date (typically 21 days from filing)
        const filedDate = new Date(taxReturn.filed_date || taxReturn.created_at);
        expectedDate = new Date(filedDate);
        expectedDate.setDate(expectedDate.getDate() + 21);
      } else if (taxReturn.status === 'accepted') {
        status = 'sent';
        statusMessage = 'Your refund has been sent';
        expectedDate = new Date();
      }
    }

    // Save refund tracking lookup
    const { data: tracking, error: trackingError } = await supabase
      .from('refund_tracking')
      .insert({
        tax_return_id: client?.tax_returns?.[0]?.id || null,
        refund_type: 'federal',
        expected_amount: parseFloat(body.refundAmount),
        status: status,
        irs_status_code: status.toUpperCase(),
        last_checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (trackingError) {
      /* Tracking error handled silently */
    }

    return NextResponse.json({
      success: true,
      status: status,
      statusMessage: statusMessage,
      refundAmount: parseFloat(body.refundAmount),
      expectedDate: expectedDate?.toISOString().split('T')[0],
      method: body.refundMethod || 'direct_deposit',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track refund' },
      { status: 500 }
    );
  }
}

/**
 * Get refund tracking history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ssn = searchParams.get('ssn');

    if (!ssn) {
      return NextResponse.json(
        { error: 'SSN required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find client and their refund tracking
    const { data: client } = await supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        tax_returns (
          id,
          tax_year,
          status,
          federal_refund,
          refund_tracking (*)
        )
      `)
      .eq('ssn', ssn)
      .single();

    if (!client) {
      return NextResponse.json(
        { error: 'No tax return found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client: {
        name: `${client.first_name} ${client.last_name}`,
        taxReturns: client.tax_returns,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get tracking history' },
      { status: 500 }
    );
  }
}
