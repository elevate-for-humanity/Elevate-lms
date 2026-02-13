import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prepareSSNForStorage, maskSSN } from '@/lib/security/ssn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Get all clients for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all clients with their tax returns
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        tax_returns (
          id,
          tax_year,
          filing_status,
          status,
          drake_return_id,
          federal_refund,
          state_refund,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch clients', details: error.message },
        { status: 500 }
      );
    }

    // Get counts for stats
    const totalClients = clients?.length || 0;
    const inProgress = clients?.filter(c =>
      c.tax_returns?.some((r: any) => r.status === 'in_progress')
    ).length || 0;
    const completed = clients?.filter(c =>
      c.tax_returns?.some((r: any) => r.status === 'completed')
    ).length || 0;
    const withDrake = clients?.filter(c =>
      c.tax_returns?.some((r: any) => r.drake_return_id)
    ).length || 0;

    return NextResponse.json({
      success: true,
      clients: clients || [],
      stats: {
        total: totalClients,
        inProgress,
        completed,
        withDrake,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create new client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Securely hash SSN - never store plain text
    const ssnData = body.ssn ? prepareSSNForStorage(body.ssn) : {};

    const { data, error } = await supabase
      .from('clients')
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        ...ssnData, // ssn_hash and ssn_last4
        date_of_birth: body.dateOfBirth,
        address_street: body.address?.street,
        address_city: body.address?.city,
        address_state: body.address?.state,
        address_zip: body.address?.zip,
        filing_status: body.filingStatus,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create client', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      client: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
